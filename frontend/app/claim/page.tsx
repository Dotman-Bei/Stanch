import { ClaimForm } from "@/components/stanch/claim-form";
import { Mono } from "@/components/stanch/mono";
import { Callout, PageTitle, Section, Tray } from "@/components/stanch/shell";
import { NotConfigured, ReadFailed } from "@/components/stanch/states";
import { StanchNotConfigured, fetchRegistry, fetchStandard } from "@/lib/stanch/read";
import type { RegistryRow } from "@/lib/stanch/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClaimPage() {
  let registry: RegistryRow[] = [];
  let standard = "";
  let error: string | null = null;
  let configured = true;

  try {
    registry = await fetchRegistry();
    standard = await fetchStandard();
  } catch (exception) {
    if (exception instanceof StanchNotConfigured) configured = false;
    else error = exception instanceof Error ? exception.message : String(exception);
  }

  return (
    <Section>
      <PageTitle
        eyebrow="submit a claim"
        title="Show the bytes before you sign"
        lede={
          <>
            A claim is an input, not an assertion. You choose a registered target and a
            reading recipe; STANCH reads the target&apos;s own view surface and pins
            those bytes. Your description is recorded next to the verdict and is never
            the basis of it. This is the only page that needs a wallet.
          </>
        }
      />

      {!configured ? <NotConfigured /> : null}
      {error ? <ReadFailed detail={error} /> : null}

      {configured && !error ? (
        <>
          <div className="mt-8">
            <ClaimForm registry={registry} />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <Tray>
              <h3 className="text-xl text-black">The standard, as it is in the code</h3>
              <p className="mt-2 text-sm text-black/60">
                Read live from <Mono>Stanch.standard()</Mono>. It is a module-level
                constant, not a writable slot: there is no method that changes it, and
                the contract deployed with an empty upgraders list.
              </p>
              <pre className="mono mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border-[2.5px] border-black bg-white px-4 py-3 text-[12px] leading-relaxed text-black">
                {standard || "—"}
              </pre>
            </Tray>

            <div className="space-y-5">
              <Callout title="Three outcomes, and two of them do nothing">
                <p>
                  <span className="font-black text-[#CCFF00]">EXPLOIT</span> flips the
                  target to HALTED, once. There is no way back.
                </p>
                <p className="mt-2">
                  <span className="font-black">CLEAR</span> means the reading did not
                  support your pattern. The claim is still recorded.
                </p>
                <p className="mt-2">
                  <span className="font-black">INDETERMINATE</span> means the reading
                  could not decide. It is counted and displayed as its own outcome and
                  is never folded into CLEAR.
                </p>
              </Callout>

              <Tray>
                <h3 className="text-xl text-black">A condition must be readable now</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  STANCH can only halt on a condition visible in the target&apos;s public
                  view surface at verdict time. It cannot read historical state or
                  transaction traces, it cannot halt an exploit that already completed
                  and left no trace, and a target exposing no useful view surface cannot
                  be protected however badly it is being drained.
                </p>
              </Tray>
            </div>
          </div>
        </>
      ) : null}
    </Section>
  );
}
