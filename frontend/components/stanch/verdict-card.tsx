import Link from "next/link";
import { AddressLink, Mono, short } from "./mono";
import { StatusPill, VerdictPill, VoltPill } from "./pills";
import type { ClaimRecord } from "@/lib/stanch/types";
import { parseReading } from "@/lib/stanch/types";

const VERDICT_NOTE: Record<string, string> = {
  EXPLOIT:
    "Validators independently re-derived this reading and agreed it shows the asserted condition holding now. The status flipped once and cannot flip back.",
  CLEAR:
    "The reading did not support the pattern. STANCH declined to act. The target is untouched.",
  INDETERMINATE:
    "The reading was not sufficient to decide. This is not a pass and it is not a fail. Nothing changed.",
  PENDING: "No verdict is stored for this claim yet.",
};

export function VerdictCard({
  claim,
  href,
  dense = false,
}: {
  claim: ClaimRecord;
  href?: string;
  dense?: boolean;
}) {
  const reading = parseReading(claim.pinnedReading);
  const readings = reading?.readings ?? {};
  const entries = Object.entries(readings);

  const body = (
    <article className="rounded-[2rem] border-[3px] border-black bg-[#F8F9FA] p-5 text-black shadow-[8px_8px_0px_#001A99] transition-transform md:p-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictPill verdict={claim.verdict} />
          <VoltPill>claim #{claim.index}</VoltPill>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-black/60">
          target now
          <StatusPill status={claim.statusAfter} size="sm" />
        </div>
      </header>

      <p className="mt-4 text-sm leading-relaxed text-black/70">
        {VERDICT_NOTE[claim.verdict] ?? VERDICT_NOTE.PENDING}
      </p>

      <div className="mt-5 grid gap-4 [&>*]:min-w-0 md:grid-cols-2">
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-black/50">
            1 · pinned reading
          </h2>
          <p className="mt-1 text-[11px] text-black/50">
            Read from the target under <Mono>strict_eq</Mono>. Validators agree on
            these bytes before any model sees them.
          </p>
          {entries.length > 0 ? (
            <dl className="mt-3 divide-y-2 divide-black/10 rounded-2xl border-[2.5px] border-black bg-white">
              {entries.map(([name, value]) => (
                <div key={name} className="flex flex-col gap-1 px-4 py-3">
                  <dt className="mono text-[11px] font-bold text-black/50">{name}</dt>
                  <dd className="mono break-all text-[13px] leading-snug text-black">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <pre className="mono mt-3 max-h-56 overflow-auto rounded-2xl border-[2.5px] border-black bg-white px-4 py-3 text-[12px] leading-relaxed text-black">
              {claim.pinnedReading || "—"}
            </pre>
          )}
        </section>

        <section>
          <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-black/50">
            2 · the claimant&apos;s pattern
          </h2>
          <p className="mt-1 text-[11px] text-black/50">
            Prose. Never the basis of the verdict.
          </p>
          <blockquote className="mono mt-3 max-h-56 overflow-auto rounded-2xl border-[2.5px] border-dashed border-black/40 bg-black/[0.03] px-4 py-3 text-[12px] leading-relaxed text-black/70">
            {claim.pattern || "—"}
          </blockquote>
          {claim.note ? (
            <p className="mono mt-2 text-[11px] font-bold uppercase tracking-wider text-black/60">
              note: {claim.note}
            </p>
          ) : null}
        </section>
      </div>

      {dense ? null : (
        <footer className="mt-5 grid gap-3 border-t-2 border-black/10 pt-4 text-[12px] [&>*]:min-w-0 md:grid-cols-3">
          <Field label="registration key">
            <Mono>{claim.key || "—"}</Mono>
          </Field>
          <Field label="target">
            <AddressLink address={claim.target} className="text-black" />
          </Field>
          <Field label="claimant">
            <Mono>{short(claim.claimant)}</Mono>
          </Field>
        </footer>
      )}
    </article>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block hover:-translate-y-0.5 focus:outline-none">
      {body}
    </Link>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-black/40">
        {label}
      </div>
      <div className="mt-0.5 text-black">{children}</div>
    </div>
  );
}
