export interface SpecCheck {
  ok: boolean;
  reason?: string;
  methods: string[];
  canonical?: string;
}

export function validateReadingSpec(raw: string): SpecCheck {
  const text = raw.trim();
  if (text === "") {
    return { ok: false, reason: "A reading spec is required. It is what gets classified.", methods: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (exception) {
    return {
      ok: false,
      reason: `Not valid JSON: ${exception instanceof Error ? exception.message : String(exception)}`,
      methods: [],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "The spec must be a JSON object, for example {\"methods\": [...]}.", methods: [] };
  }

  const methods = (parsed as { methods?: unknown }).methods;
  if (!Array.isArray(methods)) {
    return { ok: false, reason: 'The spec needs a "methods" array naming view methods on the target.', methods: [] };
  }
  if (methods.length === 0) {
    return { ok: false, reason: 'The "methods" array is empty. A reading with no values cannot support anything.', methods: [] };
  }
  const bad = methods.find((name) => typeof name !== "string" || name.trim() === "");
  if (bad !== undefined) {
    return { ok: false, reason: "Every entry in \"methods\" must be a non-empty method name.", methods: [] };
  }

  const names = (methods as string[]).map((name) => name.trim());
  return {
    ok: true,
    methods: names,
    canonical: JSON.stringify({ methods: names }),
  };
}

export const SPEC_PRESETS: { label: string; spec: string; note: string }[] = [
  {
    label: "Vault report",
    spec: JSON.stringify({ methods: ["vault_report"] }),
    note: "One call returning the target's own invariant statement alongside its numbers.",
  },
  {
    label: "Invariant only (insufficient)",
    spec: JSON.stringify({ methods: ["published_invariant"] }),
    note: "Reads the sentence the target publishes about itself and none of the numbers. Gathers fine, and cannot decide anything — this is what INDETERMINATE is for.",
  },
  {
    label: "Separate totals",
    spec: JSON.stringify({
      methods: ["total_deposited_units", "total_claimable_units", "published_invariant"],
    }),
    note: "Three calls. The classifier sees each value on its own.",
  },
];
