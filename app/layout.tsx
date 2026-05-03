import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";
const SITE_NAME = "Patristic Lineage";
const SITE_DESC =
  "Trace how Christianity was handed down from Jesus to the early Church Fathers through a sourced transmission graph, AD 30 to 750.";

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
        <AnalyticsBeacon />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldGraph) }}
        />
        <header className="border-b border-ink/10 bg-parchment/80 backdrop-blur sticky top-0 z-20">
          <nav className="max-w-7xl mx-auto px-4">
            {/* Mobile bar: brand + hamburger */}
            <div className="flex items-center justify-between md:hidden py-3">
              <Link href="/" className="flex items-center gap-2 font-serif text-lg tracking-tight">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" width={22} height={22} className="shrink-0" />
                Patristic Lineage
              </Link>
              <details className="relative [&[open]>summary>span:last-child]:hidden [&[open]>summary>span:first-child]:inline">
                <summary className="cursor-pointer list-none select-none p-2 -mr-2 text-ink/70 hover:text-accent">
                  <span className="hidden text-xl leading-none" aria-label="Close menu">✕</span>
                  <span className="text-xl leading-none" aria-label="Open menu">☰</span>
                </summary>
                <div className="absolute top-full right-0 mt-1 bg-parchment border border-ink/15 rounded shadow-lg py-2 min-w-[240px] max-h-[80vh] overflow-y-auto z-30">
                  <Link href="/today" className="block px-4 py-2 text-sm font-medium hover:bg-ink/5">Today</Link>

                  <div className="mt-1 px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider text-ink/45">Explore</div>
                  <Link href="/" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Lineage</Link>
                  <Link href="/questions" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Questions</Link>
                  <Link href="/books" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Books</Link>
                  <Link href="/map" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Map</Link>
                  <Link href="/calendar" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Calendar</Link>

                  <div className="mt-1 px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider text-ink/45">Eras</div>
                  <Link href="/eras/apostolic" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Apostolic age <span className="text-ink/45">(5–100)</span></Link>
                  <Link href="/eras/apostolic-fathers" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Apostolic Fathers <span className="text-ink/45">(100–150)</span></Link>
                  <Link href="/eras/apologists" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Apologists <span className="text-ink/45">(130–200)</span></Link>
                  <Link href="/eras/ante-nicene" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Ante-Nicene <span className="text-ink/45">(200–325)</span></Link>
                  <Link href="/eras/desert-fathers" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Desert Fathers <span className="text-ink/45">(250–500)</span></Link>
                  <Link href="/eras/nicene" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Nicene <span className="text-ink/45">(325–451)</span></Link>
                  <Link href="/eras/post-nicene" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Post-Nicene <span className="text-ink/45">(451–600)</span></Link>
                  <Link href="/eras/early-medieval" className="block px-4 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5">Early Medieval <span className="text-ink/45">(600–750)</span></Link>
                  <Link href="/eras" className="block px-4 py-1.5 text-[12px] italic text-ink/55 hover:bg-ink/5">All eras overview →</Link>

                  <div className="mt-1 px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider text-ink/45">People</div>
                  <Link href="/directory" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Directory</Link>
                  <Link href="/bishops" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Bishops</Link>

                  <div className="mt-1 px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider text-ink/45">Events</div>
                  <Link href="/schisms" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Schisms</Link>

                  <div className="mt-1 px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider text-ink/45">About</div>
                  <Link href="/start-here" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Start here</Link>
                  <Link href="/about" className="block px-4 py-1.5 text-sm hover:bg-ink/5">Methodology</Link>
                </div>
              </details>
            </div>

            {/* Desktop bar: full horizontal nav (md+) */}
            <div className="hidden md:flex items-center gap-5 py-3">
              <Link href="/" className="flex items-center gap-2 font-serif text-xl tracking-tight">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" width={24} height={24} className="shrink-0" />
                Patristic Lineage
              </Link>
              <Link href="/today" className="text-sm hover:text-accent">Today</Link>

              <div className="relative group">
                <button type="button" className="text-sm hover:text-accent cursor-pointer select-none inline-flex items-center">
                  Explore <span className="text-ink/50 ml-0.5">▾</span>
                </button>
                <div className="absolute top-full left-0 pt-1 hidden group-hover:block group-focus-within:block z-30">
                  <div className="bg-parchment border border-ink/15 rounded shadow-lg py-1 min-w-[180px]">
                    <Link href="/" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Lineage</Link>
                    <Link href="/questions" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Questions</Link>
                    <Link href="/books" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Books</Link>
                    <Link href="/map" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Map</Link>
                    <Link href="/calendar" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Calendar</Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Link
                  href="/eras"
                  className="text-sm hover:text-accent cursor-pointer select-none inline-flex items-center"
                >
                  Eras <span className="text-ink/50 ml-0.5">▾</span>
                </Link>
                <div className="absolute top-full left-0 pt-1 hidden group-hover:block group-focus-within:block z-30">
                  <div className="bg-parchment border border-ink/15 rounded shadow-lg py-1 min-w-[230px]">
                    <Link href="/eras/apostolic" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Apostolic age <span className="text-ink/50">(5–100)</span>
                    </Link>
                    <Link href="/eras/apostolic-fathers" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Apostolic Fathers <span className="text-ink/50">(100–150)</span>
                    </Link>
                    <Link href="/eras/apologists" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Apologists <span className="text-ink/50">(130–200)</span>
                    </Link>
                    <Link href="/eras/ante-nicene" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Ante-Nicene <span className="text-ink/50">(200–325)</span>
                    </Link>
                    <Link href="/eras/desert-fathers" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Desert Fathers <span className="text-ink/50">(250–500)</span>
                    </Link>
                    <Link href="/eras/nicene" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Nicene <span className="text-ink/50">(325–451)</span>
                    </Link>
                    <Link href="/eras/post-nicene" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Post-Nicene <span className="text-ink/50">(451–600)</span>
                    </Link>
                    <Link href="/eras/early-medieval" className="block px-3 py-1.5 text-sm hover:bg-ink/5">
                      Early Medieval <span className="text-ink/50">(600–750)</span>
                    </Link>
                    <div className="border-t border-ink/10 mt-1 pt-1">
                      <Link href="/eras" className="block px-3 py-1.5 text-xs text-ink/60 hover:bg-ink/5 italic">
                        All eras overview →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button type="button" className="text-sm hover:text-accent cursor-pointer select-none inline-flex items-center">
                  People <span className="text-ink/50 ml-0.5">▾</span>
                </button>
                <div className="absolute top-full left-0 pt-1 hidden group-hover:block group-focus-within:block z-30">
                  <div className="bg-parchment border border-ink/15 rounded shadow-lg py-1 min-w-[180px]">
                    <Link href="/directory" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Directory</Link>
                    <Link href="/bishops" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Bishops</Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button type="button" className="text-sm hover:text-accent cursor-pointer select-none inline-flex items-center">
                  Events <span className="text-ink/50 ml-0.5">▾</span>
                </button>
                <div className="absolute top-full left-0 pt-1 hidden group-hover:block group-focus-within:block z-30">
                  <div className="bg-parchment border border-ink/15 rounded shadow-lg py-1 min-w-[180px]">
                    <Link href="/schisms" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Schisms</Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button type="button" className="text-sm hover:text-accent cursor-pointer select-none inline-flex items-center">
                  About <span className="text-ink/50 ml-0.5">▾</span>
                </button>
                <div className="absolute top-full right-0 pt-1 hidden group-hover:block group-focus-within:block z-30">
                  <div className="bg-parchment border border-ink/15 rounded shadow-lg py-1 min-w-[180px]">
                    <Link href="/start-here" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Start here</Link>
                    <Link href="/about" className="block px-3 py-1.5 text-sm hover:bg-ink/5">Methodology</Link>
                  </div>
                </div>
              </div>

              <span className="ml-auto text-xs text-ink/50">AD 30 — 750</span>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-ink/10 py-8 text-center text-xs text-ink/50">
          <div>
            Sourced from primary patristic texts. Cross-referenced against Quasten, ODCC, and CCEL.
            {" · "}
            <a href="/sent" className="hover:text-accent">Past issues</a>
            {" · "}
            <a href="/questions" className="hover:text-accent">Questions</a>
            {" · "}
            <a href="/books" className="hover:text-accent">Books</a>
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
