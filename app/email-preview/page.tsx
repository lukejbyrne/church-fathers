// Internal preview of the daily newsletter HTML.
// Visit /email-preview to see today's email rendered in an iframe — exactly what
// subscribers will receive. Add ?d=YYYY-MM-DD or ?id=person-slug to preview a
// specific day or figure.
//
// This page is not linked from public nav. It's a tool for reviewing copy + design.

import { getPerson } from "@/lib/data";
import { isoDate, parseIsoDate, pickContent } from "@/lib/picker";
import { renderEmail } from "@/lib/email-template";
import { buildExtras, fatherContent } from "@/lib/email-helpers";
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
  const content = explicit ? fatherContent(explicit, dateInput) : pickContent(dateInput);
  const extras = buildExtras(content, SITE_URL);

  const { subject, html, plain } = renderEmail(content, SITE_URL, extras);

  const featured =
    content.type === "father" || content.type === "heretic" || content.type === "quote"
      ? content.person.name
      : content.type === "council" || content.type === "schism"
        ? content.anniversary.title
        : `Era spotlight: ${content.era}`;

  const featuredLink =
    content.type === "father" || content.type === "heretic" || content.type === "quote"
      ? `/fathers/${content.person.id}`
      : "/today";

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
          <span className="text-ink/55">Type:</span>
          <code className="bg-ink/5 px-2 py-1 rounded text-ink/90 font-mono text-xs">{content.type}</code>
          <span className="text-ink/45">·</span>
          <span className="text-ink/55">Featured:</span>
          <Link href={featuredLink} className="font-medium hover:text-accent">{featured}</Link>
          <span className="text-ink/45">·</span>
          <span className="text-ink/55">Date:</span>
          <code className="bg-ink/5 px-2 py-1 rounded text-ink/90 font-mono text-xs">{content.date}</code>
          {extras.book ? (
            <>
              <span className="text-ink/45">·</span>
              <span className="text-ink/55">Book:</span>
              <Link href={extras.book.person_url.replace(SITE_URL, "")} className="font-medium hover:text-accent">
                {extras.book.title}
              </Link>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <a href={`/email-preview?d=${isoDate(new Date(dateInput.getTime() - 86400000))}`} className="px-2.5 py-1 border border-ink/20 rounded hover:border-accent">← Yesterday</a>
          <a href="/email-preview" className="px-2.5 py-1 border border-ink/20 rounded hover:border-accent">Today</a>
          <a href={`/email-preview?d=${isoDate(new Date(dateInput.getTime() + 86400000))}`} className="px-2.5 py-1 border border-ink/20 rounded hover:border-accent">Tomorrow →</a>
          <span className="text-ink/40 px-2 py-1">or query ?id=person-slug for a specific figure</span>
        </div>
      </div>

      <div className="border border-ink/15 rounded-lg overflow-hidden bg-ink/5 p-2">
        <iframe
          srcDoc={html}
          title={`Email preview — ${featured}`}
          className="w-full bg-white block rounded"
          style={{ height: "1100px", border: 0 }}
          sandbox="allow-same-origin"
        />
      </div>

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-ink/60 hover:text-accent font-medium">Plain-text version</summary>
        <pre className="mt-3 p-4 bg-ink/5 border border-ink/10 rounded text-xs whitespace-pre-wrap font-mono text-ink/85">{plain}</pre>
      </details>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink/60 hover:text-accent font-medium">Raw HTML source</summary>
        <pre className="mt-3 p-4 bg-ink/5 border border-ink/10 rounded text-[10px] whitespace-pre-wrap font-mono text-ink/85 max-h-[500px] overflow-y-auto">{html}</pre>
      </details>
    </div>
  );
}
