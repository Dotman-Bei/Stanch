import { Callout, Tray } from "./shell";

export function NotConfigured() {
  return (
    <Tray className="mt-8">
      <h2 className="text-2xl text-black md:text-3xl">Contract address not set</h2>
      <p className="mt-3 text-sm leading-relaxed text-black/70">
        This build has no <span className="mono">NEXT_PUBLIC_CONTRACT_ADDRESS</span>.
        Copy <span className="mono">frontend/.env.example</span> to{" "}
        <span className="mono">frontend/.env</span> and set it to the deployed STANCH
        address, then restart the dev server.
      </p>
      <div className="mt-5">
        <Callout title="Why you are seeing this and not fake data">
          Nothing in this interface is synthesised. If the chain cannot be read, the
          page says so rather than rendering a placeholder that looks live.
        </Callout>
      </div>
    </Tray>
  );
}

export function RateLimited({ detail }: { detail: string }) {
  return (
    <Tray className="mt-8">
      <h2 className="text-2xl text-black md:text-3xl">Slow down a moment</h2>
      <p className="mt-3 text-sm leading-relaxed text-black/70">
        Studio Next limits reads to 30 per minute and this page hit that ceiling.
        <span className="font-black"> Nothing is wrong with the contracts.</span>{" "}
        Wait a few seconds and reload; the state below is read live rather than
        cached from a build, which is why it costs requests.
      </p>
      <pre className="mono mt-4 overflow-auto rounded-2xl border-[2.5px] border-black bg-white px-4 py-3 text-[12px] text-black">
        {detail}
      </pre>
    </Tray>
  );
}

export function ReadFailed({ detail }: { detail: string }) {
  return (
    <Tray className="mt-8">
      <h2 className="text-2xl text-black md:text-3xl">Could not read the chain</h2>
      <p className="mt-3 text-sm leading-relaxed text-black/70">
        STANCH is configured, but Studio Next did not answer. Targets are shown as{" "}
        <span className="mono font-bold">UNKNOWN</span> rather than assumed to be
        running.
      </p>
      <pre className="mono mt-4 overflow-auto rounded-2xl border-[2.5px] border-black bg-white px-4 py-3 text-[12px] text-black">
        {detail}
      </pre>
    </Tray>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Tray className="mt-8">
      <h2 className="text-2xl text-black md:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-black/70">{body}</p>
    </Tray>
  );
}
