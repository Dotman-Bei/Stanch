import Link from "next/link";
import { ExternalLink, Github } from "lucide-react";

import { cn } from "@/lib/utils";

const STANCH_ADDRESS = "0xe3C5B525a413797F86a2742C9C5d1502045EBC24";
const EXPLORER = "https://explorer-studio-dev.genlayer.com";
const REPO = "https://github.com/Dotman-Bei/Stanch";

/**
 * A torn strip of tape. The original of this shape is a soft grey; here it is
 * pure black, because every edge in this system is a chunky black outline and a
 * grey strip would read as a mistake rather than as tape.
 */
function Tape({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 95 80"
      fill="none"
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
    >
      <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#000000" />
      <path
        d="M69.68 39.99c5.09-3.07 10.6-4.97 15.77-7.95l-1.5 6.63c-3.67-6.29-8.24-12.18-11.72-18.59-2.23-4.11-4.43-8.24-6.61-12.39l7.36 1.97c-2.41 1.26-4.82 2.52-7.24 3.76-6.58 3.4-13.19 6.74-19.83 10.04-6.63 3.3-13.29 6.56-19.96 9.8-4.53 2.2-9.07 4.39-13.6 6.58-1.99.96-3.98 1.91-5.97 2.87-1.48.72-2.97 1.43-4.45 2.15-.21.1-.44.14-.63.13-.2-.02-.35-.1-.42-.23a.39.39 0 0 1 .02-.48c.08-.18.24-.35.43-.48 1.37-.93 2.75-1.86 4.12-2.79 1.53-1.04 3.05-2.07 4.58-3.11.56.39 1.14.59 1.88.4.39-.1.89-.34 1.18-.64.27-.27.42-.57.56-.85.15-.29.29-.57.55-.79.44-.38.78-.87 1.13-1.39.13-.19.26-.38.4-.58 1.46-.98 2.92-1.97 4.38-2.95.62-.29 1.19-.55 1.63-.84.4-.25.71-.58 1.01-.94.22-.16.45-.31.68-.46 1.46-.98 2.92-1.96 4.38-2.94 1.27-.54 2.59-1.12 4.24-2 .71-.37 1.44-.69 2.15-1 1.04-.45 2.02-.88 2.78-1.42.51-.36 1.12-.61 1.73-.86.81-.34 1.63-.68 2.19-1.28.36-.37.67-.76.95-1.12.45-.56.84-1.06 1.3-1.34.85-.53 1.5-1.13 2.08-1.66.69-.63 1.27-1.17 1.95-1.35.1-.03.22-.05.36-.08.71-.15 1.86-.4 3.15-1.37.46-.35.83-.77 1.19-1.19.53-.6 1.05-1.19 1.79-1.49.11-.05.25-.05.38-.05.17 0 .31 0 .34-.9.1-.27.3-.62.51-.99.16-.28.32-.57.47-.86 1.73-1.12 3.46-2.23 5.19-3.34.8-.5 1.59-1.01 2.39-1.52.55 0 1.1-.03 1.65-.13.71-.13 1.51-.5 2.54-.99.32-.15.65-.31 1.02-.47 2.15-1.1 4.73-.59 5.82 1.56.23.51.48 1.08.72 1.7.78 1.98 1.92 3.81 2.76 4.93.17.23.35.47.55.72.73.95 1.65 2.14 3.25 4.48 1.52 2.21 2.7 4.15 3.59 5.62.45.74.83 1.36 1.14 1.82.52.8 1.15 1.78 1.77 2.77.99 1.55 1.98 3.11 2.59 3.96.22.3.45.62.71.96.65.87 1.42 1.92 2.37 3.37 1.53 2.99.82 6.58-2.17 8.1-.11.08-.23.15-.34.23-1.72 1.1-2.85 1.68-4.06 2.21-.49.21-1.01.25-1.55.28-.77.05-1.57.1-2.36.68-.18.13-.36.3-.55.48-.35.32-.73.68-1.2.89-.16.08-.33.1-.5.13-.18.02-.36.05-.52.14-.62.34-1.21.7-1.73 1.02-.68.41-1.24.75-1.63.91-.68.28-1.33.75-1.98 1.24-.5.37-1.01.74-1.54 1.03-1.52.83-3.49 2.17-5.48 3.64-.75.55-1.5.82-2.47 1.16-.6.21-1.28.45-2.1.81-.46.2-.76.53-1.05.83-.26.27-.5.53-.82.65-.29.11-.57.02-.83-.07-.29-.1-.56-.19-.82.01-.14.1-.26.3-.41.54-.06.09-.12.19-.19.29-.02-.04-.03-.07-.05-.1-.1-.18-.44-.11-.77-.05-.13.03-.27.05-.38.06-.42.04-1.07.38-1.55.66-.2.12-.42.17-.67.23-.23.05-.48.11-.78.23-.17.07-.32.09-.45.1-.09.01-.17.02-.23.05-.05.02-.06.1-.07.18-.01.06-.02.13-.04.18-.06.13-.18.23-.29.26-.05.01-.09.01-.14.01-.05 0-.1 0-.16.02-.27.1-.47.3-.69.51-.23.23-.48.46-.83.59-.11.04-.24.06-.36.09-.13.02-.26.05-.35.09-.39.17-.65.5-.9.8-.16.2-.31.39-.49.51-.32.22-.41.49-.47.68-.03.1-.06.18-.11.23-.06.03-.11.05-.17.08-.06.02-.11.03-.16.06l-.02.01c-.32.13-.64.25-.97.36-.72.26-1.44.51-2.08.98-.14.1-.25.25-.37.4-.14.19-.28.38-.48.49-.47.25-1 .42-1.53.58-.79.24-1.55.48-2.08 1.01-.17.18-.32.38-.47.59-.08.12-.16.24-.25.35-.03-.1-.06-.19-.09-.27-.06-.17-.12-.31-.07-.49.1-.42.19-.95 0-1.2-.05-.07-.09-.15-.13-.24-.1-.21-.2-.43-.49-.39-.2.03-.7.13-.87.44-.04.07-.04.15-.03.25.01.17.02.38-.21.56-.04.03-.08.06-.12.1-.18.13-.38.27-.39.43-.02.18.08.31.2.46.15.2.34.44.32.86 0 .08-.06.15-.11.19-.03.03-.06.06-.05.08 0 .02.04.06.09.11.17.16.47.45.06.7-.11.07-.24.13-.37.18-.18.08-.33.14-.32.21.01.03.02.05.03.08l-.42.21c-.21.03-.45.18-.74.36-.07.04-.15.09-.23.14-.27.14-.54.28-.82.41-.22.09-.47.18-.75.24-.56.12-1.11.12-1.65.11-.23 0-.45 0-.67.01.06-.05.11-.1.15-.14.24-.31.23-.62.21-.92 0-.19-.01-.37.05-.53.13-.29 0-.48-.1-.61-.05-.07-.09-.13-.08-.18 0-.04.05-.09.1-.13.04-.04.09-.09.1-.13.23-.51.02-.61-.3-.75-.17-.08-.37-.17-.54-.35-.17-.2-.2-.27-.04-.48l-.68-.03c-.06.04-.07.14-.07.29 0 .28-.35.58-.62.81-.13.11-.24.21-.29.28-.27.38-.03.55.18.7.12.08.23.16.24.26 0 .04.05.06.09.08.03.02.07.04.08.06.12.2 0 .48-.13.74-.07.15-.13.29-.15.41 0 .04 0 .07 0 .1 0 .05 0 .09-.01.14-.03.11-.15.24-.28.38-.07.07-.14.15-.2.23-.08.1-.07.2-.07.31.01.08.01.16-.01.24-.05.15-.23.29-.39.43-.07.06-.14.12-.2.17-.02.02-.03.04-.02.06-.27.24-.52.47-.76.69-1.22 1.13-2.28 2.12-4.22 2.97-.37.16-.73.38-1.09.63-1 .49-2 .98-3 1.47-1.86.95-4.09.51-5.03-1.35-.12-.24-.24-.48-.35-.72.05-.34.03-.72-.04-1.13-.14-.77-.48-1.46-.87-2.28-.29-.6-.61-1.27-.92-2.09-.51-1.38-1.07-2.78-1.82-4.28-.74-1.51-1.63-3.21-2.28-4.39-.36-.65-.58-1.42-.79-2.13-.29-1.01-.56-1.91-1.11-2.23-.18-.1-.42-.16-.66-.22-.17-.04-.33-.08-.47-.14l-.38-.84c-.09-.58-.31-1.43-.93-2.02l-.39-.86c-.28-.61-.55-1.21-.83-1.81-.09-.2-.18-.4-.27-.6v-.01c-.18-.4-.36-.8-.54-1.2l-.23-.49c-.2-.43-.39-.87-.59-1.3l-.3-.69c-.17-.37-.34-.75-.5-1.12l-.81-1.79a.75.75 0 0 1-.06-.3c.01-.09.05-.16.11-.2.06-.04.14-.03.22 0 .09.04.17.11.23.2l1.16 1.61c.24.33.48.67.72 1 .15.2.29.41.44.61l.44.76c.11.15.22.3.33.46l.77 1.08.01.02c.13.18.25.35.38.53l1.15 1.62c.2.28.41.58.62.87l.34.49c.06.09.12.18.19.27 1.44 2.04 2.86 4.08 4.29 6.13l4.25 6.16c1.41 2.06 2.81 4.12 4.21 6.19l.75 1.12-4.16-1.12c12.75-8.6 25.65-17.06 38.72-25.24 1.92-1.2 3.89-2.43 5.82-3.62 1.95-1.2 3.87-2.37 5.83-3.57Z"
        fill="#000000"
      />
    </svg>
  );
}

const SURFACES = [
  { href: "/", label: "Registry" },
  { href: "/claim", label: "Submit a claim" },
  { href: "/proof", label: "Proof room" },
  { href: "/verdict/1", label: "The halt" },
  { href: "/verdict/0", label: "The refusal" },
  { href: "/verdict/2", label: "The undecidable one" },
];

const VERIFY = [
  { href: `${REPO}#verify-it-yourself`, label: "Verify it yourself" },
  { href: `${REPO}/blob/main/evidence/claims.json`, label: "Evidence ledger" },
  { href: `${REPO}/blob/main/DECISIONS.md`, label: "Decisions" },
  { href: `${REPO}/blob/main/REPRODUCE.md`, label: "Reproduce" },
  { href: `${REPO}/blob/main/probes/results.json`, label: "Probe results" },
];

const CHAIN = [
  { href: `${EXPLORER}/address/${STANCH_ADDRESS}`, label: "STANCH on the explorer" },
  {
    href: `${EXPLORER}/address/0x288aA7651e3260fA13B09bD86c7430FD52585f30`,
    label: "CISTERN, halted",
  },
  {
    href: "https://github.com/genlayerlabs/genvm-manager/issues/20",
    label: "Upstream issue #20",
  },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  const external = href.startsWith("http");
  const className =
    "group inline-flex items-center gap-1 text-[13px] font-medium text-black/60 underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:text-black hover:decoration-[#CCFF00]";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
        <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function Column({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 md:gap-3">
      <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
        {title}
      </h4>
      <div className="flex flex-col items-start gap-1.5">
        {links.map((link) => (
          <FooterLink key={link.href + link.label} {...link} />
        ))}
      </div>
    </div>
  );
}

export function TapedFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto mt-12 w-full max-w-[1180px] px-4 pb-10 md:px-8">
      <div className="relative rounded-[2rem] border-[3px] border-black bg-white px-5 py-9 shadow-[8px_8px_0px_#001A99] md:px-9">
        {/* The viewBox is 95x80, so the box has to keep that ratio or the strip
            shears. Each is pulled out past the corner so it reads as tape holding
            the card down rather than as a mark printed on it. */}
        <Tape className="absolute -left-8 -top-7 hidden h-[72px] w-[86px] -rotate-6 md:block" />
        <Tape className="absolute -right-8 -top-7 hidden h-[72px] w-[86px] -scale-x-100 rotate-6 md:block" />

        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="flex max-w-sm flex-col items-start gap-3">
            <div className="flex items-center gap-1">
              <span className="relative rounded-2xl rounded-bl-sm bg-black px-3 py-1.5 text-sm font-black tracking-tight text-white">
                STANCH
                <span
                  className="absolute -bottom-1.5 left-0 h-3 w-3 bg-black"
                  style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                />
              </span>
              <span className="rounded-full border-[1.5px] border-black bg-[#CCFF00] px-3 py-1.5 text-sm font-black text-black">
                HALT
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-black/60">
              A halt authority with no write path to anything it can halt. It
              publishes a verdict; the target reads it and stops itself.
            </p>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-[#CCFF00] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#000000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000000]"
            >
              <Github className="h-4 w-4" />
              Read the source
            </a>
          </div>

          <div className="grid gap-7 sm:grid-cols-3 md:gap-10">
            <Column title="Surfaces" links={SURFACES} />
            <Column title="Check it" links={VERIFY} />
            <Column title="On chain" links={CHAIN} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-[11px] leading-relaxed text-white/70">
          STANCH runs on GenLayer Studio Next, chain 61997, with valueless test
          tokens. Nothing here is an audit, a production-readiness claim, or a
          third-party endorsement. STANCH is opt-in and pull-based: it cannot halt a
          contract that was not written to read it.
        </p>
        <p className="mono text-[11px] leading-relaxed text-white/55">
          Every status and verdict on this site is read from the chain, cached for at
          most 10 seconds. Studio Next limits reads to 30 per minute, and a verdict
          takes minutes to reach consensus, so nothing here can be stale in a way
          that changes what it says. To read the same state yourself with no cache in
          the way:{" "}
          <span className="text-[#CCFF00]">
            python -m tools.observe_deployment &lt;STANCH address&gt;
          </span>
        </p>
        <div className="flex flex-col gap-2 border-t-2 border-white/15 pt-4 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} STANCH · MIT licensed · built for the GenLayer Agent Tank</p>
          <p className="mono">
            chain 61997 · <span className="text-white/75">{STANCH_ADDRESS}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
