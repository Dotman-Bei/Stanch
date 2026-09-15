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
export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer-studio-dev.genlayer.com";

export class StanchNotConfigured extends Error {
  constructor() {
    super("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
    this.name = "StanchNotConfigured";
  }
}

function publicClient() {
  return createClient({ chain: GENLAYER_CHAIN });
}

async function readStanch(functionName: string, args: unknown[] = []): Promise<unknown> {
  if (!STANCH_ADDRESS.startsWith("0x")) throw new StanchNotConfigured();
  const client = publicClient();
  return client.readContract({
    address: STANCH_ADDRESS as `0x${string}`,
    functionName,
    args: args as never[],
  });
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
    const client = publicClient();
    return String(
      await client.readContract({
        address: address as `0x${string}`,
        functionName: "vault_report",
        args: [],
      }),
    );
  } catch {
    return null;
  }
}

export function explorerAddress(address: string): string {
  return `${EXPLORER_BASE}/address/${address}`;
}

export function explorerTx(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}
