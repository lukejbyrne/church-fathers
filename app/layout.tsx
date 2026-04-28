import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";
const SITE_NAME = "Patristic Lineage";
const SITE_DESC =
  "From Jesus through the Apostles to the Church Fathers — a sourced visual chain of who knew whom, AD 30 to 750.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description: SITE_DESC,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
  },
  alternates: { canonical: SITE_URL },
};

const ldGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      publisher: { "@id": `${SITE_URL}/#publisher` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#publisher`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      "@type": "Dataset",
      "@id": `${SITE_URL}/#dataset`,
      name: "Patristic Lineage Dataset",
      description:
        "Structured dataset of early Christian figures (AD 0–750) and the documented, traditional, or disputed relationships between them, each backed by primary-source citations.",
      url: SITE_URL,
      license: "https://creativecommons.org/licenses/by/4.0/",
      keywords: [
        "Church Fathers",
        "Patristics",
        "Apostolic succession",
        "Early Christianity",
        "Eusebius",
        "Irenaeus",
      ],
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: `${SITE_URL}/api/people.json`,
          name: "People (JSON)",
        },
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: `${SITE_URL}/api/relationships.json`,
          name: "Relationships (JSON)",
        },
      ],
      creator: { "@id": `${SITE_URL}/#publisher` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldGraph) }}
        />
        <header className="border-b border-ink/10 bg-parchment/80 backdrop-blur sticky top-0 z-20">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-serif text-xl tracking-tight">
              Patristic Lineage
            </Link>
            <Link href="/" className="text-sm hover:text-accent">Lineage</Link>
            <Link href="/map" className="text-sm hover:text-accent">Map</Link>
            <Link href="/start-here" className="text-sm hover:text-accent">Start here</Link>
            <Link href="/directory" className="text-sm hover:text-accent">Directory</Link>
            <Link href="/about" className="text-sm hover:text-accent">Methodology</Link>
            <span className="ml-auto text-xs text-ink/50">AD 30 — 750</span>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-ink/10 py-8 text-center text-xs text-ink/50">
          <div>
            Sourced from primary patristic texts. Cross-referenced against Quasten, ODCC, and CCEL.
            {" · "}
            <a href="/api/people.json" className="hover:text-accent">people.json</a>
            {" · "}
            <a href="/api/relationships.json" className="hover:text-accent">relationships.json</a>
            {" · "}
            <a href="/llms.txt" className="hover:text-accent">llms.txt</a>
          </div>
          <div className="mt-2 text-ink/40 italic">
            As an Amazon Associate we earn from qualifying purchases.
          </div>
        </footer>
      </body>
    </html>
  );
}
