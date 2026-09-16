import { unstable_cache } from "next/cache";
import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "@/lib/genlayer/network";
import {
  type ClaimRecord,
  type HaltStatus,
  type RegistryRow,
  normaliseStatus,
  normaliseVerdict,
} from "./types";

export const STANCH_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "").trim();

export { EXPLORER_BASE, explorerAddress, explorerTx } from "./explorer";

export class StanchNotConfigured extends Error {
  constructor() {
    super("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
    this.name = "StanchNotConfigured";
  }
}

export class StanchRateLimited extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "StanchRateLimited";
  }
}

function isRateLimit(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /rate limit/i.test(text) || /-32029/.test(text);
}

/**
 * Detect the rate-limit case without `instanceof`.
 *
 * Next bundles this module more than once, so a `StanchRateLimited` thrown in
 * one bundle is not `instanceof` the class imported in another and the page
 * would fall through to the generic "could not read the chain" state — which
 * would be a lie, because the chain answered fine and only told us to slow
 * down.
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error && error.name === "StanchRateLimited") return true;
  return isRateLimit(error);
}

// Studio Next allows 30 reads per minute. A single pass over the four surfaces
// costs roughly two dozen calls, so a reviewer clicking quickly would otherwise
// be rate-limited into an error page. Reads are cached for CACHE_MS and no
// longer, which is far shorter than the time a verdict takes to reach
// consensus: nothing here can show a stale halt status in any way that matters,
// and every page states the age of what it is showing.
export const CACHE_MS = 10_000;

interface CacheEntry {
  at: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;
  try {
    const value = await load();
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (error) {
    if (isRateLimit(error)) {
      if (hit) return hit.value as T;
      throw new StanchRateLimited(
        "Studio Next rate-limited this read (30 requests per minute). Nothing is " +
          "wrong with the contracts or with this page. Wait a moment and reload.",
      );
    }
    throw error;
  }
}

function publicClient() {
  return createClient({ chain: GENLAYER_CHAIN });
}

/**
 * Read through Next's Data Cache, which on a hosted deployment is shared between
 * serverless instances and survives cold starts. The in-process `cached` wrapper
 * below it still helps within a single render and, unlike the Data Cache, can
 * serve a stale value when the RPC rate-limits us.
 *
 * `/verdict/[index]` is a dynamic route, so route-level `revalidate` does not
 * cache it. This does.
 */
const readThroughDataCache = unstable_cache(
  async (functionName: string, argsJson: string): Promise<string> => {
    const value = await publicClient().readContract({
      address: STANCH_ADDRESS as `0x${string}`,
      functionName,
      args: JSON.parse(argsJson) as never[],
    });
    return JSON.stringify(value ?? null);
  },
  ["stanch-read"],
  { revalidate: 10, tags: ["stanch"] },
);

async function readStanch(functionName: string, args: unknown[] = []): Promise<unknown> {
  if (!STANCH_ADDRESS.startsWith("0x")) throw new StanchNotConfigured();
  const argsJson = JSON.stringify(args);
  return cached(`${functionName}:${argsJson}`, async () =>
    JSON.parse(await readThroughDataCache(functionName, argsJson)),
  );
}

export async function fetchRegistry(): Promise<RegistryRow[]> {
  const raw = String(await readStanch("registry"));
  const parsed = JSON.parse(raw) as { targets?: RegistryRow[] };
  return (parsed.targets ?? []).map((row) => ({
    key: String(row.key),
    target: String(row.target),
    status: normaliseStatus(row.status),
  }));
}

export async function fetchStatus(key: string): Promise<HaltStatus> {
  return normaliseStatus(await readStanch("status_of", [key]));
}

export async function fetchClaimCount(): Promise<number> {
  return Number(await readStanch("claim_count"));
}

export async function fetchClaim(index: number): Promise<ClaimRecord | null> {
  const raw = String(await readStanch("claim_at", [index]));
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    index: Number(parsed.index ?? index),
    key: String(parsed.key ?? ""),
    target: String(parsed.target ?? ""),
    claimant: String(parsed.claimant ?? ""),
    readingSpec: String(parsed.readingSpec ?? ""),
    pattern: String(parsed.pattern ?? ""),
    pinnedReading: String(parsed.pinnedReading ?? ""),
    verdict: normaliseVerdict(parsed.verdict),
    note: String(parsed.note ?? ""),
    statusAfter: normaliseStatus(parsed.statusAfter),
  };
}

export async function fetchAllClaims(): Promise<ClaimRecord[]> {
  const count = await fetchClaimCount();
  const indexes = Array.from({ length: count }, (_, i) => count - 1 - i);
  const records = await Promise.all(indexes.map((i) => fetchClaim(i)));
  return records.filter((record): record is ClaimRecord => record !== null);
}

export async function fetchStandard(): Promise<string> {
  return String(await readStanch("standard"));
}

export async function fetchTargetReport(address: string): Promise<string | null> {
  if (!address.startsWith("0x")) return null;
  try {
    return await cached(`vault_report:${address}`, async () =>
      String(
        await publicClient().readContract({
          address: address as `0x${string}`,
          functionName: "vault_report",
          args: [],
        }),
      ),
    );
  } catch {
    return null;
  }
}
