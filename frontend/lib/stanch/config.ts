export const NETWORK = {
  name: "GenLayer Studio Next",
  chainId: 61997,
  rpc: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio-next.genlayer.com/api",
  explorer:
    process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer-studio-dev.genlayer.com",
};
