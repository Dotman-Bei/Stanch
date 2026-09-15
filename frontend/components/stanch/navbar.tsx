"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

const LINKS = [
  { href: "/", label: "Registry" },
  { href: "/claim", label: "Submit a claim" },
  { href: "/proof", label: "Proof room" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-8">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 rounded-full border-[3px] border-black bg-[#0038FF] px-3 py-2 shadow-[6px_6px_0px_#000000] md:px-4">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 rounded-full border-[1.5px] border-white/30 bg-black/20 p-1 md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "bg-[#CCFF00] text-black"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <a
          href="https://explorer-studio-dev.genlayer.com"
          target="_blank"
          rel="noreferrer"
          className="mono shrink-0 rounded-full border-[1.5px] border-white/40 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:bg-black/40"
        >
          chain 61997
        </a>
      </nav>

      <div className="mx-auto mt-2 flex max-w-[1180px] items-center gap-1 overflow-x-auto rounded-full border-[3px] border-black bg-black/25 p-1 md:hidden">
        {LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                active ? "bg-[#CCFF00] text-black" : "text-white/80"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
