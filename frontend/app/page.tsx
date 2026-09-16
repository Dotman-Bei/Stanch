import Link from "next/link";
import { AddressLink, Mono, TxLink } from "@/components/stanch/mono";
import { LabelPill, StatusPill, VoltPill } from "@/components/stanch/pills";
import { Callout, FrostPanel, PageTitle, Section, Tray } from "@/components/stanch/shell";
import { NotConfigured, RateLimited, ReadFailed } from "@/components/stanch/states";
import { ArrowVoltRight, SquiggleUnderline, StopGlyph } from "@/components/stanch/doodles";
import {
  STANCH_ADDRESS,
  StanchNotConfigured,
  isRateLimitError,
  fetchRegistry,
} from "@/lib/stanch/read";
import { DEPLOYMENT, registrationTx } from "@/lib/stanch/deployment";
import type { RegistryRow } from "@/lib/stanch/types";

// Revalidate rather than force-dynamic.
//
// Studio Next allows 30 reads per minute and one pass over these four surfaces
// costs about two dozen. force-dynamic would re-read the chain on every request,
// and the in-process cache in lib/stanch/read.ts is per serverless instance, so
// on a hosted deployment it dies on every cold start and is never shared between
// concurrent visitors. A few simultaneous reviewers would exhaust the limit.
//
// 10 seconds is far shorter than the minutes a verdict takes to reach consensus,
// so no page can show a stale halt status in any way that matters.
export const revalidate = 10;

export default async function RegistryPage() {
  let rows: RegistryRow[] = [];
  let error: string | null = null;
  let limited: string | null = null;
  let configured = true;

  try {
    rows = await fetchRegistry();
  } catch (exception) {
    if (exception instanceof StanchNotConfigured) configured = false;
    else if (isRateLimitError(exception))
      limited =
        exception instanceof Error ? exception.message : String(exception);
    else error = exception instanceof Error ? exception.message : String(exception);
  }

  return (
    <>
      <Hero />
      <HowItWorks />
      <Section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="extrude-sm text-3xl text-white md:text-4xl">Registry</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
              Every registered target, its key, its current status and the transaction
              that bound it. A target STANCH cannot reach reads{" "}
              <Mono className="font-bold text-white">UNKNOWN</Mono>, never{" "}
              <Mono className="font-bold text-white">RUNNING</Mono>. No wallet is
              needed to read any of this.
            </p>
          </div>
          <LabelPill>{rows.length} registered</LabelPill>
        </div>

        {!configured ? <NotConfigured /> : null}
        {limited ? <RateLimited detail={limited} /> : null}
      {error ? <ReadFailed detail={error} /> : null}
        {configured && !error && !limited ? <RegistryTable rows={rows} /> : null}
      </Section>

      <Section className="mt-12">
        <Tray>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl text-black md:text-3xl">Deployment</h3>
              <p className="mt-2 text-sm text-black/60">
                Addresses and transactions on Studio Next, chain 61997.
              </p>
            </div>
            <VoltPill>{DEPLOYMENT.status === "UNDEPLOYED" ? "not deployed" : "live"}</VoltPill>
          </div>
          <dl className="mt-5 grid gap-4 [&>*]:min-w-0 md:grid-cols-2">
            <DeployRow label="STANCH" record={DEPLOYMENT.stanch} fallback={STANCH_ADDRESS} />
            <DeployRow label="CISTERN (demo target)" record={DEPLOYMENT.cistern} />
            <DeployRow label="CISTERN-FIXED (control)" record={DEPLOYMENT.cistern_fixed} />
            <DeployRow label="Injection target (campaign)" record={DEPLOYMENT.injection_target} />
          </dl>
        </Tray>
      </Section>
    </>
  );
}

function Hero() {
  return (
    <Section>
      <div className="relative pt-10 md:pt-16">
        <div className="grid items-center gap-10 [&>*]:min-w-0 lg:grid-cols-[1.35fr_1fr]">
          <div>
            {/* The eyebrow pill that sat here was removed. Its 31px of height is
                kept so the headline holds its position against the floating
                cards to the right, which are aligned to it. */}
            <div aria-hidden className="h-[31px]" />
            <h1 className="extrude mt-5 max-w-[14ch] text-4xl leading-[0.98] text-white sm:text-5xl md:text-[4.1rem]">
              Halt is one‑way.{" "}
              <span className="text-[#CCFF00]">
                That isn&apos;t a limitation, it&apos;s the guarantee.
              </span>
            </h1>
            <SquiggleUnderline className="mt-4 h-4 w-56" />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90">
              No key. No owner. No upgrader slot. STANCH holds exactly one power —
              publish a verdict that a registered target is compromised — and{" "}
              <span className="font-black text-[#CCFF00]">no write path</span> to
              anything it can halt.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/proof"
                className="rounded-full bg-[#CCFF00] px-6 py-3 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#000000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#b8e600] hover:shadow-[2px_2px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Open the proof room
              </Link>
              <Link
                href="/claim"
                className="rounded-full border-[3px] border-black bg-white px-6 py-3 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#001A99] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#001A99]"
              >
                Submit a claim
              </Link>
              <ArrowVoltRight className="hidden h-10 w-24 lg:block" />
            </div>
          </div>

          <div className="relative hidden justify-center lg:flex lg:justify-end">
            <div className="frost w-56 rotate-[-9deg] rounded-[2rem] border border-white/40 p-6 shadow-2xl transition-transform duration-500 hover:rotate-0">
              <StopGlyph className="mx-auto h-14 w-14" />
              <div className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
                one-way
              </div>
              <div className="mt-1 text-center text-2xl font-black uppercase text-white">
                Halted
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-white/75">
                There is no method that writes RUNNING after construction.
              </p>
            </div>
            <div className="frost absolute -bottom-6 left-0 hidden w-44 rotate-[7deg] rounded-[1.5rem] border border-white/40 p-4 shadow-2xl xl:block">
              <div className="mono text-[10px] uppercase tracking-[0.14em] text-white/70">
                upgraders
              </div>
              <div className="mono mt-1 text-lg font-bold text-[#CCFF00]">[ ]</div>
              <div className="mono mt-2 text-[10px] text-white/70">
                locked slots · 4
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function RegistryTable({ rows }: { rows: RegistryRow[] }) {
  if (rows.length === 0) {
    return (
      <Tray className="mt-8">
        <h3 className="text-2xl text-black">No targets registered yet</h3>
        <p className="mt-3 text-sm text-black/70">
          STANCH is deployed and readable, and nothing has bound a registration key to
          it. This is an empty registry, not a failed read.
        </p>
      </Tray>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <div className="min-w-[720px] overflow-hidden rounded-[2rem] border-[3px] border-black bg-[#F8F9FA] shadow-[8px_8px_0px_#001A99]">
        <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr_1fr] gap-4 border-b-[3px] border-black bg-black px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#CCFF00]">
          <div>registration key</div>
          <div>target</div>
          <div>status</div>
          <div>bound by</div>
        </div>
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[1.1fr_1.2fr_0.8fr_1fr] items-center gap-4 border-b-2 border-black/10 px-6 py-4 text-sm last:border-b-0"
          >
            <div className="mono font-bold text-black">{row.key}</div>
            <div>
              <AddressLink address={row.target} className="text-black" />
            </div>
            <div>
              <StatusPill status={row.status} size="sm" />
            </div>
            <div className="text-[12px]">
              {registrationTx(row.key)?.txHash ? (
                <TxLink hash={registrationTx(row.key)!.txHash!} className="text-black" />
              ) : (
                <Mono className="text-black/40">not recorded</Mono>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Anyone can claim",
    body: (
      <>
        No permission, no allowlist. You name a registered target, the view methods
        STANCH should read, and the pattern you assert is present.
      </>
    ),
    chip: "submit_claim(key, spec, pattern)",
  },
  {
    n: "02",
    title: "STANCH reads the target",
    body: (
      <>
        It calls the target&apos;s own public view methods and pins the bytes. This is
        deterministic, so every validator re-executes it and disagreement fails
        consensus before a verdict exists.
      </>
    ),
    chip: "get_at(addr).view()",
  },
  {
    n: "03",
    title: "Validators classify",
    body: (
      <>
        Each derives a verdict independently from those bytes — never from your
        description. A reading that could not be gathered is settled in code, with no
        model consulted.
      </>
    ),
    chip: "EXPLOIT · CLEAR · INDETERMINATE",
  },
  {
    n: "04",
    title: "The target stops itself",
    body: (
      <>
        Only <span className="font-black">EXPLOIT</span> changes anything, once and
        irreversibly. CISTERN reads the status at the top of every write method and
        refuses itself. STANCH never calls it.
      </>
    ),
    chip: 'UserError("STANCH_HALTED")',
  },
];

function HowItWorks() {
  return (
    <Section className="mt-16 md:mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="extrude-sm text-3xl text-white md:text-4xl">How it works</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            Four steps. Exactly one of them asks a language model anything, and it is
            asked about bytes read from the target, never about the claim.
          </p>
        </div>
        <VoltPill>no privileged caller anywhere</VoltPill>
      </div>

      <ol className="mt-8 grid gap-5 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.n} className="relative">
            <article className="flex h-full flex-col rounded-[1.75rem] border-[3px] border-black bg-white p-5 text-black shadow-[6px_6px_0px_#000000]">
              <span className="mono flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-black bg-[#CCFF00] text-sm font-black text-black">
                {step.n}
              </span>
              <h3 className="mt-3 text-base leading-tight text-black">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-black/75">
                {step.body}
              </p>
              <code className="mt-4 block overflow-x-auto whitespace-nowrap rounded-xl bg-black px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] leading-relaxed text-[#CCFF00]">
                {step.chip}
              </code>
            </article>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-[1.5rem] border-[3px] border-black bg-black px-5 py-4 shadow-[5px_5px_0px_#CCFF00]">
        <p className="text-sm leading-relaxed text-white/85">
          <span className="font-black uppercase tracking-wider text-[#CCFF00]">
            The whole point:
          </span>{" "}
          step 2 is a read and step 4 is the target acting on itself. There is no step
          where STANCH writes to anything it can halt — which is why{" "}
          <Mono className="text-white">grep</Mono> can falsify the claim in under a
          minute.
        </p>
      </div>
    </Section>
  );
}

function DeployRow({
  label,
  record,
  fallback,
}: {
  label: string;
  record?: { address?: string; txHash?: string } | null;
  fallback?: string;
}) {
  const address = record?.address ?? fallback ?? "";
  return (
    <div className="rounded-2xl border-[2.5px] border-black bg-white px-4 py-3">
      <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-black/50">
        {label}
      </dt>
      <dd className="mt-1 text-[13px]">
        {address ? (
          <AddressLink address={address} truncate={false} className="text-black" />
        ) : (
          <Mono className="text-black/40">not deployed</Mono>
        )}
      </dd>
      {record?.txHash ? (
        <dd className="mt-1 text-[12px]">
          <TxLink hash={record.txHash} className="text-black/70" />
        </dd>
      ) : null}
    </div>
  );
}
