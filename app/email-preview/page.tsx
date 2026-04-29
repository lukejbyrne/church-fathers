// Internal preview of the daily newsletter HTML.
// Visit /email-preview to see today's email rendered in an iframe — exactly what
// subscribers will receive. Add ?d=YYYY-MM-DD or ?id=person-slug to preview a
// specific day or figure.
//
// This page is not linked from public nav. It's a tool for reviewing copy + design.

import { getPerson } from "@/lib/data";
import { featuredOfDay, isoDate, parseIsoDate } from "@/lib/featured";
import { renderEmail, type EmailFigure } from "@/lib/email-template";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";

export const dynamic = "force-dynamic";

export default async function EmailPreview({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; id?: string }>;
}) {
  const sp = await searchParams;

  const dateInput = parseIsoDate(sp.d) ?? new Date();
  const explicit = sp.id ? getPerson(sp.id) : null;
  const person = explicit ?? featuredOfDay(dateInput);

  const primaryCitation = person.citations.find((c) => c.kind === "primary")?.source;

  const figure: EmailFigure = {
    date: isoDate(dateInput),
    person: {
      id: person.id,
      name: person.name,
      url: `${SITE_URL}/fathers/${person.id}`,
      image_url: person.image_url,
      born: person.born,
      died: person.died,
      see: person.see,
      short_bio: person.short_bio,
      why_matters: person.why_matters,
      primary_citation: primaryCitation,
    },
  };

  const { subject, html, plain } = renderEmail(figure, SITE_URL);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-ink/60 hover:text-accent">← Lineage</Link>
        <h1 className="font-serif text-3xl mt-3 mb-1">Email preview</h1>
        <p className="text-ink/60 text-sm mb-4">
          Internal review tool. Not linked from public nav. The HTML below is exactly what subscribers
          will receive.
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
          <span className="text-ink/55">Subject:</span>
          <code className="bg-ink/5 px-2 py-1 rounded text-ink/90 font-mono text-xs">{subject}</code>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
          <span className="text-ink/55">Featured:</span>
          <Link href={`/fathers/${person.id}`} className="font-medium hover:text-accent">{person.name}</Link>
          <span className="text-ink/45">·</span>
          <span className="text-ink/55">Date:</span>
          <code className="bg-ink/5 px-2 py-1 rounded text-ink/90 font-mono text-xs">{figure.date}</code>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <a
            href={`/email-preview?d=${isoDate(new Date(dateInput.getTime() - 86400000))}`}
            className="px-2.5 py-1 border border-ink/20 rounded hover:border-accent"
          >
            ← Yesterday
          </a>
          <a href="/email-preview" className="px-2.5 py-1 border border-ink/20 rounded hover:border-accent">
            Today
          </a>
          <a
            href={`/email-preview?d=${isoDate(new Date(dateInput.getTime() + 86400000))}`}
            className="px-2.5 py-1 border border-ink/20 rounded hover:border-accent"
          >
            Tomorrow →
          </a>
          <span className="text-ink/40 px-2 py-1">or query ?id=person-slug for a specific figure</span>
        </div>
      </div>

      <div className="border border-ink/15 rounded-lg overflow-hidden bg-ink/5 p-2">
        <iframe
          srcDoc={html}
          title={`Email preview — ${person.name}`}
          className="w-full bg-white block rounded"
          style={{ height: "1100px", border: 0 }}
          sandbox="allow-same-origin"
        />
      </div>

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-ink/60 hover:text-accent font-medium">
          Plain-text version
        </summary>
        <pre className="mt-3 p-4 bg-ink/5 border border-ink/10 rounded text-xs whitespace-pre-wrap font-mono text-ink/85">
          {plain}
        </pre>
      </details>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink/60 hover:text-accent font-medium">
          Raw HTML source
        </summary>
        <pre className="mt-3 p-4 bg-ink/5 border border-ink/10 rounded text-[10px] whitespace-pre-wrap font-mono text-ink/85 max-h-[500px] overflow-y-auto">
          {html}
        </pre>
      </details>
    </div>
  );
}
