/**
 * Explorer URL builders, deliberately in their own module.
 *
 * These live apart from `read.ts` because `mono.tsx` needs them and is imported
 * by `claim-form.tsx`, which is a client component. Importing them from
 * `read.ts` pulled that module's `genlayer-js` and `viem` dependencies across
 * the client boundary and shipped roughly a megabyte of wallet SDK to every
 * page, including the three that never touch a wallet.
 *
 * Nothing in here may import anything.
 */
export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer-studio-dev.genlayer.com";

export function explorerAddress(address: string): string {
  return `${EXPLORER_BASE}/address/${address}`;
}

export function explorerTx(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}
