import Link from "next/link";
import claimsLedger from "@/lib/stanch/claims.json";
import probeResults from "@/lib/stanch/probes.json";
import { AddressLink, Mono } from "@/components/stanch/mono";
import { LabelPill, VerdictPill, VoltPill } from "@/components/stanch/pills";
import { Callout, PageTitle, Section, Tray } from "@/components/stanch/shell";
import { NotConfigured, RateLimited, ReadFailed } from "@/components/stanch/states";
import {
  StanchNotConfigured,
  fetchAllClaims,
  isRateLimitError,
} from "@/lib/stanch/read";
import type { ClaimRecord } from "@/lib/stanch/types";
import { parseReading } from "@/lib/stanch/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LedgerClaim {
  id: string;
  claim: string;
  status: string;
  evidenceClasses?: string[];
  evidence?: string[];
  reproduce?: string | null;
  limitations?: string[];
  observedAtUtc?: string | null;
}

interface Ledger {
  updatedAtUtc?: string;
  statusDefinitions?: Record<string, string>;
  evidenceClassDefinitions?: Record<string, string>;
  standingCaveats?: string[];
  claims: LedgerClaim[];
}

const LEDGER = claimsLedger as unknown as Ledger;
const PROBES = probeResults as unknown as {
  probes?: Record<string, { pass?: boolean | null; question?: string }>;
};

const STATUS_STYLE: Record<string, string> = {
  SUPPORTED: "bg-white text-black border-black shadow-[4px_4px_0px_#001A99]",
  PARTIAL: "bg-[#CCFF00] text-black border-black shadow-[4px_4px_0px_#000000]",
  UNMEASURED: "frost text-white border-white/70 border-dashed",
  NOT_CLAIMED: "bg-black text-white border-black shadow-[4px_4px_0px_#CCFF00]",
};

export default async function ProofPage() {
  let claims: ClaimRecord[] = [];
  let error: string | null = null;
  let limited: string | null = null;
  let configured = true;

  try {
    claims = await fetchAllClaims();
  } catch (exception) {
    if (exception instanceof StanchNotConfigured) configured = false;
    else if (isRateLimitError(exception))
      limited =
        exception instanceof Error ? exception.message : String(exception);
    else error = exception instanceof Error ? exception.message : String(exception);
  }

  const counts = claims.reduce<Record<string, number>>((acc, claim) => {
    acc[claim.verdict] = (acc[claim.verdict] ?? 0) + 1;
    return acc;
  }, {});
  const total = claims.length;

  return (
    <Section>
      <PageTitle
        eyebrow="proof room"
        title="Every claim, and what the evidence does not reach"
        lede={
          <>
            Two independent axes. <span className="font-black">Status</span> is how
            much of a claim the evidence supports.{" "}
            <span className="font-black">Evidence class</span> is what kind of
            observation produced it. Partial evidence is described in the row and never
            raises its status. No wallet is needed to read any of this.
          </>
        }
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <Stat label="claims on chain" value={String(total)} />
        <Stat label="halted" value={`${counts.EXPLOIT ?? 0} / ${total}`} />
        <Stat label="refused" value={`${counts.CLEAR ?? 0} / ${total}`} />
        <Stat label="indeterminate" value={`${counts.INDETERMINATE ?? 0} / ${total}`} />
      </div>

      {!configured ? <NotConfigured /> : null}
      {limited ? <RateLimited detail={limited} /> : null}
      {error ? <ReadFailed detail={error} /> : null}

      {configured && !error && !limited ? (
        <div className="mt-10">
          <h2 className="extrude-sm text-3xl text-white md:text-4xl">
            Claims submitted on chain
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            Read back from <Mono className="font-bold text-white">claim_at()</Mono>,
            newest first. Every submission is recorded, including the ones that changed
            nothing.
          </p>
          {claims.length === 0 ? (
            <Tray className="mt-6">
              <h3 className="text-2xl text-black">No claims submitted yet</h3>
              <p className="mt-3 text-sm text-black/70">
                The registry is readable and the claim list is empty.
              </p>
            </Tray>
          ) : (
            <div className="mt-6 space-y-5">
              {claims.map((claim) => (
                <ChainClaimRow key={claim.index} claim={claim} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="extrude-sm text-3xl text-white md:text-4xl">
              The evidence ledger
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
              From <Mono className="font-bold text-white">evidence/claims.json</Mono>.
              A claim may not be promoted above{" "}
              <Mono className="font-bold text-white">UNMEASURED</Mono> until the file it
              names exists in the repository.
            </p>
          </div>
          {LEDGER.updatedAtUtc ? (
            <LabelPill>updated {LEDGER.updatedAtUtc}</LabelPill>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {LEDGER.claims.map((row) => (
            <LedgerRow key={row.id} row={row} />
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <Tray>
          <h3 className="text-xl text-black">Feasibility gate (§11)</h3>
          <p className="mt-2 text-sm text-black/60">
            Run before any contract was written. Raw output in{" "}
            <Mono>probes/results.json</Mono>.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(PROBES.probes ?? {}).map(([id, probe]) => (
              <li
                key={id}
                className="flex items-start justify-between gap-4 rounded-2xl border-[2.5px] border-black bg-white px-4 py-3"
              >
                <div>
                  <span className="mono text-[13px] font-bold text-black">{id}</span>
                  <p className="mt-0.5 text-[12px] leading-snug text-black/60">
                    {probe.question}
                  </p>
                </div>
                <span
                  className={`mono shrink-0 rounded-full border-[2.5px] px-3 py-1 text-[11px] font-black uppercase ${
                    probe.pass === true
                      ? "border-black bg-white text-black"
                      : probe.pass === false
                        ? "border-black bg-black text-[#CCFF00]"
                        : "border-dashed border-black/50 bg-transparent text-black/60"
                  }`}
                >
                  {probe.pass === true ? "pass" : probe.pass === false ? "fail" : "partial"}
                </span>
              </li>
            ))}
          </ul>
        </Tray>

        <div className="space-y-5">
          <Callout title="Standing caveats">
            <ul className="space-y-2">
              {(LEDGER.standingCaveats ?? []).map((caveat) => (
                <li key={caveat} className="flex gap-2">
                  <span className="text-[#CCFF00]">·</span>
                  <span>{caveat}</span>
                </li>
              ))}
            </ul>
          </Callout>
        </div>
      </div>
    </Section>
  );
}

function ChainClaimRow({ claim }: { claim: ClaimRecord }) {
  const reading = parseReading(claim.pinnedReading);
  const readings = Object.entries(reading?.readings ?? {});
  return (
    <Link
      href={`/verdict/${claim.index}`}
      className="block rounded-[2rem] border-[3px] border-black bg-[#F8F9FA] p-5 text-black shadow-[8px_8px_0px_#001A99] transition-transform hover:-translate-y-0.5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictPill verdict={claim.verdict} size="sm" />
          <VoltPill>#{claim.index}</VoltPill>
          <Mono className="text-[12px] font-bold text-black/60">{claim.key}</Mono>
        </div>
        <Mono className="text-[11px] text-black/50">
          {readings.length} value{readings.length === 1 ? "" : "s"} pinned
        </Mono>
      </div>
      <p className="mono mt-3 line-clamp-2 text-[12px] leading-relaxed text-black/60">
        {claim.pattern || claim.note || "—"}
      </p>
      {readings.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {readings.slice(0, 3).map(([name, value]) => (
            <span
              key={name}
              className="mono rounded-full border-2 border-black/20 bg-white px-3 py-1 text-[11px] text-black"
            >
              {name} = {String(value).slice(0, 44)}
              {String(value).length > 44 ? "…" : ""}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function LedgerRow({ row }: { row: LedgerClaim }) {
  const style = STATUS_STYLE[row.status] ?? STATUS_STYLE.UNMEASURED;
  const unmeasured = row.status === "UNMEASURED";
  return (
    <article
      className={`rounded-[2rem] border-[3px] p-5 md:p-6 ${
        unmeasured
          ? "frost border-dashed border-white/50 text-white"
          : "border-black bg-[#F8F9FA] text-black shadow-[8px_8px_0px_#001A99]"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Mono className={`text-[13px] font-bold ${unmeasured ? "text-white" : "text-black"}`}>
          {row.id}
        </Mono>
        <span
          className={`mono rounded-full border-[3px] px-3 py-1 text-[11px] font-black uppercase tracking-wider ${style}`}
        >
          {row.status}
        </span>
      </header>

      <p
        className={`mt-3 text-sm leading-relaxed ${
          unmeasured ? "text-white/85" : "text-black/80"
        }`}
      >
        {row.claim}
      </p>

      {(row.evidenceClasses ?? []).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {row.evidenceClasses!.map((klass) => (
            <span
              key={klass}
              className={`mono rounded-full border-2 px-3 py-1 text-[10px] uppercase tracking-wider ${
                unmeasured
                  ? "border-white/40 text-white/80"
                  : "border-black/20 bg-white text-black/70"
              }`}
            >
              {klass}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <div
          className={`text-[10px] font-black uppercase tracking-[0.18em] ${
            unmeasured ? "text-white/60" : "text-black/45"
          }`}
        >
          what this does not reach
        </div>
        <ul
          className={`mt-2 space-y-1.5 text-[13px] leading-relaxed ${
            unmeasured ? "text-white/80" : "text-black/70"
          }`}
        >
          {(row.limitations ?? []).map((limitation) => (
            <li key={limitation} className="flex gap-2">
              <span className={unmeasured ? "text-[#CCFF00]" : "text-[#0038FF]"}>·</span>
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </div>

      {(row.evidence ?? []).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {row.evidence!.map((file) => (
            <span
              key={file}
              className={`mono rounded-full px-3 py-1 text-[10px] ${
                unmeasured ? "bg-black/25 text-white/70" : "bg-black/5 text-black/60"
              }`}
            >
              {file}
            </span>
          ))}
        </div>
      ) : null}

      {row.reproduce ? (
        <pre
          className={`mono mt-3 overflow-auto rounded-2xl px-4 py-2.5 text-[11px] ${
            unmeasured ? "bg-black/30 text-white/85" : "bg-black text-[#CCFF00]"
          }`}
        >
          {row.reproduce}
        </pre>
      ) : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-black bg-white px-5 py-3 shadow-[5px_5px_0px_#CCFF00]">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-black/50">
        {label}
      </div>
      <div className="mono mt-0.5 text-2xl font-bold text-black">{value}</div>
    </div>
  );
}
