import { explorerAddress, explorerTx } from "@/lib/stanch/explorer";

export function Mono({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`mono ${className}`}>{children}</span>;
}

export function short(value: string, head = 6, tail = 4): string {
  if (!value) return "";
  if (value.length <= head + tail + 2) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function AddressLink({
  address,
  truncate = true,
  className = "",
}: {
  address: string;
  truncate?: boolean;
  className?: string;
}) {
  if (!address) return <Mono className={className}>—</Mono>;
  return (
    <a
      href={explorerAddress(address)}
      target="_blank"
      rel="noreferrer"
      className={`mono underline decoration-[#CCFF00] decoration-2 underline-offset-4 hover:text-[#CCFF00] ${className}`}
    >
      {truncate ? short(address) : address}
    </a>
  );
}

export function TxLink({
  hash,
  truncate = true,
  className = "",
}: {
  hash: string;
  truncate?: boolean;
  className?: string;
}) {
  if (!hash) return <Mono className={className}>—</Mono>;
  return (
    <a
      href={explorerTx(hash)}
      target="_blank"
      rel="noreferrer"
      className={`mono underline decoration-[#CCFF00] decoration-2 underline-offset-4 hover:text-[#CCFF00] ${className}`}
    >
      {truncate ? short(hash, 10, 8) : hash}
    </a>
  );
}
