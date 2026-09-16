import type { Metadata } from "next";
import { Navbar } from "@/components/stanch/navbar";
import { Ticker } from "@/components/stanch/ticker";
import "./globals.css";

export const metadata: Metadata = {
  title: "STANCH — halt authority with no write access",
  description:
    "STANCH halts other contracts when anyone proves an active exploit, and holds no key, no upgrader slot, and no write permission on anything it can halt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0038FF] antialiased">
        <Navbar />
        <main className="pb-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-10">
      <Ticker />
      <div className="mx-auto max-w-[1180px] px-4 py-8 md:px-8">
        <p className="text-[11px] leading-relaxed text-white/70">
          STANCH runs on GenLayer Studio Next, chain 61997, with valueless test
          tokens. Nothing here is an audit, a production-readiness claim, or a
          third-party endorsement. STANCH is opt-in and pull-based: it cannot halt
          a contract that was not written to read it.
        </p>
        <p className="mono mt-3 text-[11px] leading-relaxed text-white/55">
          Every status and verdict on this site is read from the chain, cached for
          at most 10 seconds. Studio Next limits reads to 30 per minute, and a
          verdict takes minutes to reach consensus, so nothing here can be stale in
          a way that changes what it says. To read the same state yourself with no
          cache in the way:{" "}
          <span className="text-[#CCFF00]">
            python -m tools.observe_deployment &lt;STANCH address&gt;
          </span>
        </p>
      </div>
    </footer>
  );
}
