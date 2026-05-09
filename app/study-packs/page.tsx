import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Patristic Lineage",
  description:
    "Support Patristic Lineage source checking, visual explanations, and optional sponsorships for existing Church Fathers pages.",
};

const SPONSOR_OPTIONS = [
  {
    title: "Sponsor an existing page",
    status: "Page support",
    body: "Support maintenance of a published Father, bishop list, question guide, schism, era, or reading page.",
    includes: ["Citation checks", "Reading-link review", "Clearer page notes", "Sponsor acknowledgement when appropriate"],
  },
  {
    title: "Sponsor a source trail",
    status: "Source support",
    body: "Help keep the cited patristic graph readable and properly tied to primary sources and standard references.",
    includes: ["Primary-source citations", "Evidence labels", "Bibliography cleanup", "Methodology clarity"],
  },
  {
    title: "Sponsor a visual explanation",
    status: "Visual support",
    body: "Support upkeep of existing maps, lineage views, bishop lists, and comparison pages used by non-specialist readers.",
    includes: ["Lineage graph", "Map view", "Bishop lists", "Schism and question routes"],
  },
];

const SUPPORT_COVERS = [
  "Checking citations against primary patristic texts and standard reference works",
  "Maintaining existing Father, bishop, schism, era, and question pages",
  "Keeping the public graph, maps, bishop lists, and guides understandable",
  "Covering boring but necessary work: images, broken links, copy edits, and data cleanup",
];

export default function SupportPage() {
  return (
    <article className="max-w-6xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        Back to lineage
      </Link>

      <header className="max-w-3xl mt-4 mb-12">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mb-3">
          Support and sponsorship
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl text-ink leading-[1.02]">
          Support Patristic Lineage
        </h1>
        <p className="text-lg text-ink/70 mt-4">
          Patristic Lineage is a free, sourced graph of the early Church. Support keeps the
          existing pages checked, readable, and useful for readers, teachers, and small groups.
        </p>
      </header>

      <section className="grid lg:grid-cols-[1fr_340px] gap-6 mb-12">
        <div className="rounded-md border border-ink/12 bg-ink/[0.025] p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45 mb-3">
            Support this project
          </p>
          <h2 className="font-serif text-3xl text-ink leading-tight mb-3">
            Help keep Church Fathers history free and source-backed
          </h2>
          <p className="text-sm text-ink/68 max-w-2xl">
            Public pages stay free. Contributions support work visible on the site now: source
            checking, clearer evidence labels, cleaner reading links, data cleanup, and maintenance
            of the maps and lineage views.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <a
              href="https://www.buymeacoffee.com/lukebyrne"
              className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm text-center"
            >
              Support Patristic Lineage
            </a>
            <a
              href="mailto:hello@patristic.io?subject=Patristic%20Lineage%20sponsorship"
              className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm text-center"
            >
              Sponsor a page
            </a>
          </div>
        </div>

        <aside className="rounded-md border border-ink/12 bg-parchment p-5 h-fit">
          <h2 className="font-serif text-2xl text-ink mb-3">Support covers</h2>
          <ul className="space-y-2 text-sm text-ink/65">
            {SUPPORT_COVERS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-12">
        {SPONSOR_OPTIONS.map((option) => (
          <div key={option.title} className="rounded-md border border-ink/10 bg-ink/[0.025] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45 mb-3">
              {option.status}
            </p>
            <h2 className="font-serif text-3xl text-ink leading-tight mb-2">{option.title}</h2>
            <p className="text-sm text-ink/68 mb-4">{option.body}</p>
            <ul className="space-y-2 text-sm text-ink/65">
              {option.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-[1fr_340px] gap-6 border-t border-ink/10 pt-8">
        <div>
          <h2 className="font-serif text-3xl text-ink mb-4">What remains free</h2>
          <p className="text-ink/70 max-w-2xl mb-5">
            The public research surface is the point: readers can inspect the graph, follow the
            citations, and use the existing guides without paying.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Link href="/questions" className="rounded-md border border-ink/10 bg-parchment p-4 hover:border-accent">
              Question guides
            </Link>
            <Link href="/bishops" className="rounded-md border border-ink/10 bg-parchment p-4 hover:border-accent">
              Bishops and sees
            </Link>
            <Link href="/schisms" className="rounded-md border border-ink/10 bg-parchment p-4 hover:border-accent">
              Schisms
            </Link>
            <Link href="/books" className="rounded-md border border-ink/10 bg-parchment p-4 hover:border-accent">
              Recommended reading
            </Link>
          </div>
        </div>

        <aside className="rounded-md border border-ink/12 bg-ink/[0.025] p-5 h-fit">
          <h2 className="font-serif text-2xl text-ink mb-3">Sponsor fit</h2>
          <p className="text-sm text-ink/65 mb-4">
            Sponsorships are best for churches, schools, publishers, ministries, or readers who
            want to support a specific existing page, source trail, or visual explanation.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="mailto:hello@patristic.io?subject=Patristic%20Lineage%20sponsorship"
              className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm text-center"
            >
              Ask about sponsorship
            </a>
            <a
              href="https://www.buymeacoffee.com/lukebyrne"
              className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm text-center"
            >
              Support the project
            </a>
            <Link
              href="/resources"
              className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm text-center"
            >
              Free resources
            </Link>
          </div>
        </aside>
      </section>
    </article>
  );
}
