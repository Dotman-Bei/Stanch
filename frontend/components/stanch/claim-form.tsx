"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "@/lib/genlayer/network";
import { connectMetaMask, getAccounts, isMetaMaskInstalled } from "@/lib/genlayer/client";
import { SPEC_PRESETS, validateReadingSpec } from "@/lib/stanch/spec";
import { STANCH_ADDRESS } from "@/lib/stanch/read";
import { Mono, short } from "./mono";
import { VoltPill } from "./pills";
import type { RegistryRow } from "@/lib/stanch/types";

type Phase = "idle" | "previewing" | "signing" | "sent" | "failed";

export function ClaimForm({ registry }: { registry: RegistryRow[] }) {
  const runnable = registry.filter((row) => row.status === "RUNNING");
  const [account, setAccount] = useState<string | null>(null);
  const [key, setKey] = useState(runnable[0]?.key ?? registry[0]?.key ?? "");
  const [spec, setSpec] = useState(SPEC_PRESETS[0].spec);
  const [pattern, setPattern] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const check = useMemo(() => validateReadingSpec(spec), [spec]);
  const target = registry.find((row) => row.key === key);

  useEffect(() => {
    getAccounts()
      .then((accounts) => setAccount(accounts[0] ?? null))
      .catch(() => setAccount(null));
  }, []);

  async function connect() {
    setMessage(null);
    try {
      setAccount(await connectMetaMask());
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : String(exception));
    }
  }

  async function readPreview() {
    if (!check.ok || !target) return;
    setPhase("previewing");
    setMessage(null);
    try {
      const client = createClient({ chain: GENLAYER_CHAIN });
      const readings: Record<string, string> = {};
      for (const method of check.methods) {
        try {
          readings[method] = String(
            await client.readContract({
              address: target.target as `0x${string}`,
              functionName: method,
              args: [],
            }),
          );
        } catch {
          readings[method] = "READ_FAILED";
        }
      }
      setPreview(
        JSON.stringify(
          {
            target: target.target,
            methods: check.methods,
            readings,
            pattern,
          },
          Object.keys({ methods: 0, pattern: 0, readings: 0, target: 0 }).sort(),
          2,
        ),
      );
      setPhase("idle");
    } catch (exception) {
      setPhase("failed");
      setMessage(exception instanceof Error ? exception.message : String(exception));
    }
  }

  async function submit() {
    if (!check.ok || !target || !account) return;
    setPhase("signing");
    setMessage(null);
    try {
      const client = createClient({
        chain: GENLAYER_CHAIN,
        account: account as `0x${string}`,
      });
      const fees = await client.estimateTransactionFees();
      const hash = await client.writeContract({
        address: STANCH_ADDRESS as `0x${string}`,
        functionName: "submit_claim",
        args: [key, check.canonical ?? spec, pattern],
        fees,
      });
      setTxHash(String(hash));
      setPhase("sent");
    } catch (exception) {
      setPhase("failed");
      setMessage(exception instanceof Error ? exception.message : String(exception));
    }
  }

  const disabled = !check.ok || !target || pattern.trim() === "";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
      <div className="rounded-[2rem] border-[3px] border-black bg-[#F8F9FA] p-5 text-black shadow-[8px_8px_0px_#001A99] md:p-7">
        <Field
          label="1 · target"
          hint="Only registered keys can be claimed against. A key STANCH does not know records an UNREGISTERED_KEY claim and halts nothing."
        >
          {registry.length === 0 ? (
            <p className="mono text-sm text-black/60">No registered targets to claim against.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {registry.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => setKey(row.key)}
                  className={`mono rounded-full border-[3px] border-black px-4 py-2 text-[12px] font-bold transition-all ${
                    key === row.key
                      ? "bg-[#CCFF00] text-black shadow-[4px_4px_0px_#000000]"
                      : "bg-white text-black/70 hover:bg-black/5"
                  }`}
                >
                  {row.key}
                  <span className="ml-2 text-[10px] uppercase opacity-60">{row.status}</span>
                </button>
              ))}
            </div>
          )}
          {target ? (
            <p className="mono mt-3 text-[12px] text-black/50">{target.target}</p>
          ) : null}
          {target?.status === "HALTED" ? (
            <p className="mt-2 text-[12px] font-bold text-black">
              This target is already halted. A further claim is recorded but changes nothing.
            </p>
          ) : null}
        </Field>

        <Field
          label="2 · reading recipe"
          hint="The view methods STANCH will call on the target. These returned values are the only evidence the classifier sees."
        >
          <div className="mb-2 flex flex-wrap gap-2">
            {SPEC_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSpec(preset.spec)}
                className="rounded-full border-2 border-black/30 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black/70 hover:border-black hover:text-black"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <textarea
            value={spec}
            onChange={(event) => setSpec(event.target.value)}
            rows={3}
            spellCheck={false}
            className="mono w-full rounded-2xl border-[2.5px] border-black bg-white px-4 py-3 text-[13px] text-black outline-none focus:shadow-[4px_4px_0px_#CCFF00]"
          />
          {check.ok ? (
            <p className="mono mt-2 text-[12px] text-black/50">
              {check.methods.length} method{check.methods.length === 1 ? "" : "s"} will be read
              and pinned under strict_eq.
            </p>
          ) : (
            <p className="mt-2 rounded-xl border-[2.5px] border-black bg-black px-3 py-2 text-[12px] font-bold text-[#CCFF00]">
              {check.reason}
            </p>
          )}
        </Field>

        <Field
          label="3 · the pattern you assert"
          hint="Prose. Recorded on chain and shown beside the verdict — and never the basis of it. A forceful description does not move the answer."
        >
          <textarea
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            rows={4}
            placeholder="total_claimable exceeds total_deposited, so the vault owes more units than were put into it"
            className="w-full rounded-2xl border-[2.5px] border-black bg-white px-4 py-3 text-[13px] text-black outline-none placeholder:text-black/30 focus:shadow-[4px_4px_0px_#CCFF00]"
          />
        </Field>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={readPreview}
            disabled={disabled || phase === "previewing"}
            className="rounded-full border-[3px] border-black bg-white px-5 py-2.5 text-[12px] font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#001A99] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#001A99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "previewing" ? "reading…" : "Show the exact bytes"}
          </button>

          {account ? (
            <button
              type="button"
              onClick={submit}
              disabled={disabled || phase === "signing"}
              className="rounded-full bg-[#CCFF00] px-6 py-2.5 text-[12px] font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#000000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-[#b8e600] hover:shadow-[2px_2px_0px_#000000] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === "signing" ? "signing…" : "Sign and submit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={connect}
              className="rounded-full bg-black px-6 py-2.5 text-[12px] font-black uppercase tracking-wider text-[#CCFF00] shadow-[4px_4px_0px_#CCFF00] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#CCFF00]"
            >
              {isMetaMaskInstalled() ? "Connect wallet to submit" : "MetaMask required"}
            </button>
          )}

          {account ? (
            <Mono className="text-[12px] text-black/50">{short(account)}</Mono>
          ) : null}
        </div>

        {message ? (
          <p className="mono mt-4 rounded-2xl border-[2.5px] border-black bg-black px-4 py-3 text-[12px] leading-relaxed text-[#CCFF00]">
            {message}
          </p>
        ) : null}

        {phase === "sent" && txHash ? (
          <div className="mt-4 rounded-2xl border-[3px] border-black bg-[#CCFF00] px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-black">
              submitted
            </div>
            <Mono className="mt-1 block break-all text-[12px] text-black">{txHash}</Mono>
            <p className="mt-2 text-[12px] leading-relaxed text-black/70">
              Validators are classifying the pinned reading now. The verdict appears in
              the proof room once consensus finalises.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <div className="frost rounded-[2rem] border-[1.5px] border-white/40 p-5 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl text-white">Exactly what gets classified</h3>
            <VoltPill>preview</VoltPill>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/80">
            Read from the target right now, in the same shape STANCH will pin on chain.
            Nothing is signed to produce this.
          </p>
          <pre className="mono mt-4 max-h-[420px] overflow-auto rounded-2xl border-[1.5px] border-white/30 bg-black/40 px-4 py-3 text-[12px] leading-relaxed text-white">
            {preview ?? "Press “Show the exact bytes”."}
          </pre>
        </div>

        <div className="rounded-[1.5rem] border-[3px] border-black bg-black px-5 py-4 text-white shadow-[5px_5px_0px_#CCFF00]">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#CCFF00]">
            submitting costs you nothing but fees
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/85">
            There is no bond. STANCH takes no custody of value — on Studio Next, probe
            P4 shows value paid into a contract cannot be paid out, so anything
            escrowed would be stranded. Claim spam is handled by the record being
            public and append-only, not by economics.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-black/50">
        {label}
      </div>
      <p className="mt-1 mb-3 text-[12px] leading-relaxed text-black/50">{hint}</p>
      {children}
    </div>
  );
}
