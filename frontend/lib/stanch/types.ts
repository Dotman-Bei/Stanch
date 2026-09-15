export type HaltStatus = "RUNNING" | "HALTED" | "UNKNOWN";
export type Verdict = "EXPLOIT" | "CLEAR" | "INDETERMINATE" | "PENDING";

export interface RegistryRow {
  key: string;
  target: string;
  status: HaltStatus;
}

export interface ClaimRecord {
  index: number;
  key: string;
  target: string;
  claimant: string;
  readingSpec: string;
  pattern: string;
  pinnedReading: string;
  verdict: Verdict;
  note: string;
  statusAfter: HaltStatus;
}

export interface PinnedReading {
  target?: string;
  methods?: string[];
  readings?: Record<string, string>;
  pattern?: string;
  error?: string;
}

export function parseReading(raw: string): PinnedReading | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PinnedReading;
  } catch {
    return null;
  }
}

export function normaliseStatus(word: unknown): HaltStatus {
  const text = String(word ?? "").toUpperCase();
  if (text === "RUNNING" || text === "HALTED") return text;
  return "UNKNOWN";
}

export function normaliseVerdict(word: unknown): Verdict {
  const text = String(word ?? "").toUpperCase();
  if (text === "EXPLOIT" || text === "CLEAR" || text === "INDETERMINATE") return text;
  return "PENDING";
}
