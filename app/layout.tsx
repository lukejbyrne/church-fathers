import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Church Fathers Lineage",
  description: "From Jesus through the Apostles to the Church Fathers — a visual chain of who knew whom, AD 30 to 750.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-ink/10 bg-parchment/80 backdrop-blur sticky top-0 z-20">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-serif text-xl tracking-tight">
              Church Fathers
            </Link>
            <Link href="/" className="text-sm hover:text-accent">Lineage</Link>
            <Link href="/directory" className="text-sm hover:text-accent">Directory</Link>
            <Link href="/about" className="text-sm hover:text-accent">Methodology</Link>
            <span className="ml-auto text-xs text-ink/50">AD 30 — 750</span>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-ink/10 py-8 text-center text-xs text-ink/50">
          Sourced from primary patristic texts. Cross-referenced against Quasten, ODCC, and CCEL.
        </footer>
      </body>
    </html>
  );
}
