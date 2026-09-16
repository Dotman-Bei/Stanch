"use client";

import dynamic from "next/dynamic";

import type { RegistryRow } from "@/lib/stanch/types";

/**
 * Load the claim form, and everything it drags in, only when this page renders.
 *
 * The form needs genlayer-js and viem to read the target and sign a claim. Those
 * are about a megabyte of JavaScript, and importing the form directly put them in
 * a chunk the layout pulled onto every route — including the registry, the
 * verdict records and the proof room, none of which ever touch a wallet.
 *
 * `ssr: false` is what keeps them out of the shared graph, and costs nothing
 * here: the form is interactive, wallet-dependent, and has nothing to render on
 * the server anyway.
 */
const ClaimFormInner = dynamic(
  () => import("./claim-form").then((m) => m.ClaimForm),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <div className="min-h-[520px] animate-pulse rounded-[2rem] border-[3px] border-black bg-[#F8F9FA]/80 shadow-[8px_8px_0px_#001A99]" />
        <div className="frost min-h-[320px] animate-pulse rounded-[2rem] border-[1.5px] border-white/40" />
      </div>
    ),
  },
);

export function ClaimForm({ registry }: { registry: RegistryRow[] }) {
  return <ClaimFormInner registry={registry} />;
}
