import Link from "next/link";
import { notFound } from "next/navigation";
import { AddressLink, Mono } from "@/components/stanch/mono";
import { LabelPill, StatusPill } from "@/components/stanch/pills";
import { Callout, PageTitle, Section, Tray } from "@/components/stanch/shell";
import { NotConfigured, RateLimited, ReadFailed } from "@/components/stanch/states";
import { VerdictCard } from "@/components/stanch/verdict-card";
import {
  StanchNotConfigured,
  isRateLimitError,
  fetchClaim,
  fetchClaimCount,
  fetchStatus,
} from "@/lib/stanch/read";
import type { ClaimRecord, HaltStatus } from "@/lib/stanch/types";

// Revalidate rather than force-dynamic.
//
// Studio Next allows 30 reads per minute and one pass over these four surfaces
// costs about two dozen. force-dynamic would re-read the chain on every request,
// and the in-process cache in lib/stanch/read.ts is per serverless instance, so
// on a hosted deployment it dies on every cold start and is never shared between
// concurrent visitors. A few simultaneous reviewers would exhaust the limit.
//
// 10 seconds is far shorter than the minutes a verdict takes to reach consensus,
// so no page can show a stale halt status in any way that matters, and the
// staleness bound is stated in the footer.
export const revalidate = 10;

export default async function VerdictPage({
  params,
}: {
  params: Promise<{ index: string }>;
}) {
  const { index } = await params;
  const position = Number(index);
  if (!Number.isInteger(position) || position < 0) notFound();

  let claim: ClaimRecord | null = null;
  let count = 0;
  let status: HaltStatus = "UNKNOWN";
  let error: string | null = null;
  let limited: string | null = null;
  let configured = true;

  try {
    count = await fetchClaimCount();
    claim = await fetchClaim(position);
    if (claim) status = await fetchStatus(claim.key);
  } catch (exception) {
    if (exception instanceof StanchNotConfigured) configured = false;
    else if (isRateLimitError(exception))
      limited =
        exception instanceof Error ? exception.message : String(exception);
    else error = exception instanceof Error ? exception.message : String(exception);
  }

  return (
    <Section>
      <PageTitle
        eyebrow={`verdict record · claim #${position}`}
        title="One claim, start to finish"
        lede={
          <>
            The pinned reading, then the verdict over it, then what the target&apos;s
            status is now. A pending verdict reads{" "}
            <Mono className="font-bold text-white">PENDING</Mono>; an indeterminate one
            reads <Mono className="font-bold text-white">INDETERMINATE</Mono> and is
            styled as neither a pass nor a fail.
          </>
        }
      />

      {!configured ? <NotConfigured /> : null}
      {limited ? <RateLimited detail={limited} /> : null}
      {error ? <ReadFailed detail={error} /> : null}

      {configured && !error && !limited && !claim ? (
        <Tray className="mt-8">
          <h2 className="text-2xl text-black">No claim at index {position}</h2>
          <p className="mt-3 text-sm text-black/70">
            STANCH holds {count} claim{count === 1 ? "" : "s"}. Indices run from 0 to{" "}
            {Math.max(count - 1, 0)}.
          </p>
          <Link
            href="/proof"
            className="mt-5 inline-block rounded-full bg-[#CCFF00] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#000000]"
          >
            Back to the proof room
          </Link>
        </Tray>
      ) : null}

      {claim ? (
        <>
          <div className="mt-8">
            <VerdictCard claim={claim} />
          </div>

          <div className="mt-6 grid gap-5 [&>*]:min-w-0 md:grid-cols-[1.4fr_1fr]">
            <Tray>
              <h3 className="text-xl text-black">How this verdict was reached</h3>
              <ol className="mt-4 space-y-4 text-sm text-black/75">
                <Step n="1" title="Pin the reading">
                  STANCH called the target&apos;s own public view methods under{" "}
                  <Mono>gl.eq_principle.strict_eq</Mono>. Validators must agree on
                  these bytes before any model sees them. A reading that cannot be
                  reproduced is not a claim.
                </Step>
                <Step n="2" title="Classify it">
                  Each validator independently re-derived the reading and classified it
                  under <Mono>gl.eq_principle.prompt_non_comparative</Mono>, against a
                  standard fixed as a module constant in locked code. Non-comparative,
                  so validators derive the answer rather than tolerate the
                  leader&apos;s.
                </Step>
                <Step n="3" title="Act, or do not">
                  <Mono className="font-bold">EXPLOIT</Mono> flips the status to{" "}
                  <Mono className="font-bold">HALTED</Mono>, once and irreversibly.{" "}
                  <Mono className="font-bold">CLEAR</Mono> and{" "}
                  <Mono className="font-bold">INDETERMINATE</Mono> change nothing. The
                  record is appended either way.
                </Step>
              </ol>
            </Tray>

            <div className="space-y-5">
              <Tray>
                <h3 className="text-xl text-black">Target now</h3>
                <div className="mt-4 flex items-center gap-3">
                  <StatusPill status={status} />
                  <Mono className="text-sm text-black/60">{claim.key}</Mono>
                </div>
                <div className="mt-4 text-[13px]">
                  <AddressLink
                    address={claim.target}
                    truncate={false}
                    className="text-black"
                  />
                </div>
                {status === "HALTED" ? (
                  <p className="mt-4 text-sm leading-relaxed text-black/70">
                    STANCH did not write this. It published a word. CISTERN reads that
                    word at the top of every state-changing method and refuses itself.
                  </p>
                ) : null}
              </Tray>

              <Callout title="What this record does not prove">
                Validator agreement is agreement, not correctness. One verdict is one
                observation, not a measured detection rate. The demo target&apos;s
                defect was authored by us.
              </Callout>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LabelPill>{count} claims on record</LabelPill>
            {position > 0 ? (
              <NavLink href={`/verdict/${position - 1}`}>← claim #{position - 1}</NavLink>
            ) : null}
            {position < count - 1 ? (
              <NavLink href={`/verdict/${position + 1}`}>claim #{position + 1} →</NavLink>
            ) : null}
            <NavLink href="/proof">All claims</NavLink>
          </div>
        </>
      ) : null}
    </Section>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[3px] border-black bg-[#CCFF00] text-sm font-black text-black">
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-black uppercase tracking-wider text-black">
          {title}
        </span>
        <span className="mt-1 block leading-relaxed">{children}</span>
      </span>
    </li>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border-[3px] border-black bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#001A99] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#001A99]"
    >
      {children}
    </Link>
  );
}
