import type { Metadata } from "next";
import { Navbar } from "@/components/stanch/navbar";
import { Ticker } from "@/components/stanch/ticker";
import { TapedFooter } from "@/components/ui/footer-taped-design";
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
        <main className="pb-16">{children}</main>
        <Ticker />
        <TapedFooter />
      </body>
    </html>
  );
}
