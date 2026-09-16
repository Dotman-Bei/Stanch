import Link from "next/link";

import { StopGlyph } from "@/components/stanch/doodles";
import { Section } from "@/components/stanch/shell";

export default function NotFound() {
  return (
    <Section className="pt-16 md:pt-24">
      <div className="mx-auto max-w-2xl rounded-[2rem] border-[3px] border-black bg-[#F8F9FA] p-7 text-black shadow-[8px_8px_0px_#001A99] md:p-10">
        <StopGlyph className="h-14 w-14" />
        <h1 className="extrude-sm mt-5 text-4xl text-black md:text-5xl">
          Nothing here
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-black/70">
          That page does not exist. Nothing has gone wrong with the contracts —
          this is the site telling you a route is missing rather than inventing
          something to show you.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#CCFF00] px-5 py-2.5 text-[12px] font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#000000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000000]"
          >
            Registry
          </Link>
          <Link
            href="/proof"
            className="rounded-full border-[3px] border-black bg-white px-5 py-2.5 text-[12px] font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#001A99] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#001A99]"
          >
            Proof room
          </Link>
        </div>
      </div>
    </Section>
  );
}
