import type { HaltStatus, Verdict } from "@/lib/stanch/types";

type Tone = "loud" | "plain" | "neither";

const TONE_CLASS: Record<Tone, string> = {
  loud: "bg-black text-[#CCFF00] border-black shadow-[4px_4px_0px_#CCFF00]",
  plain: "bg-white text-black border-black shadow-[4px_4px_0px_#001A99]",
  neither:
    "frost text-white border-white/70 border-dashed shadow-none",
};

function toneForStatus(status: HaltStatus): Tone {
  if (status === "HALTED") return "loud";
  if (status === "RUNNING") return "plain";
  return "neither";
}

function toneForVerdict(verdict: Verdict): Tone {
  if (verdict === "EXPLOIT") return "loud";
  if (verdict === "CLEAR") return "plain";
  return "neither";
}

function Pill({
  tone,
  children,
  size = "md",
}: {
  tone: Tone;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-[3px] font-black uppercase tracking-wider ${
        size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-xs md:text-sm"
      } ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  status,
  size = "md",
}: {
  status: HaltStatus;
  size?: "sm" | "md";
}) {
  return (
    <Pill tone={toneForStatus(status)} size={size}>
      {status}
    </Pill>
  );
}

export function VerdictPill({
  verdict,
  size = "md",
}: {
  verdict: Verdict;
  size?: "sm" | "md";
}) {
  return (
    <Pill tone={toneForVerdict(verdict)} size={size}>
      {verdict}
    </Pill>
  );
}

export function LabelPill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-[1.5px] border-white/50 bg-black/25 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white ${className}`}
    >
      {children}
    </span>
  );
}

export function VoltPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border-[3px] border-black bg-[#CCFF00] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black">
      {children}
    </span>
  );
}
