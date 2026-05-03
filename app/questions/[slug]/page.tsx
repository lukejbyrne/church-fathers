import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { chainTo, getPerson, getRelationships } from "@/lib/data";
import { dateRange } from "@/lib/dates";
import { getQuestionPage, questionPages } from "@/lib/questions";
import type { Person, Relationship } from "@/lib/schema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";

const STRENGTH_CLASS: Record<Relationship["strength"], string> = {
  documented: "bg-green-900/10 text-green-900 border-green-900/20",
  tradition: "bg-yellow-900/10 text-yellow-900 border-yellow-900/20",
  disputed: "bg-accent/10 text-accent border-accent/20",
};

function relationLabel(type: Relationship["type"]) {
  return type.replace(/_/g, " ");
}

function peopleFor(ids: string[]): Person[] {
  return ids.map((id) => getPerson(id)).filter((p): p is Person => Boolean(p));
}

function relatedRelationships(ids: string[]) {
  const set = new Set(ids);
  return getRelationships()
    .filter((rel) => set.has(rel.from) && set.has(rel.to))
    .sort((a, b) => {
      const rank = { documented: 0, tradition: 1, disputed: 2 };
      return rank[a.strength] - rank[b.strength] || relationLabel(a.type).localeCompare(relationLabel(b.type));
    })
    .slice(0, 12);
}

export function generateStaticParams() {
  return questionPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getQuestionPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/questions/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}/questions/${page.slug}`,
      type: "article",
    },
  };
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getQuestionPage(slug);
  if (!page) notFound();

  const people = peopleFor(page.figureIds);
  const rels = relatedRelationships(page.figureIds);
  const chain = page.chainTargetId
    ? chainTo(page.chainTargetId, "jesus-of-nazareth", page.chainKind ?? "all")
    : null;
  const related = (page.relatedSlugs ?? [])
    .map((relatedSlug) => getQuestionPage(relatedSlug))
    .filter(Boolean);

  const ldArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    mainEntityOfPage: `${SITE_URL}/questions/${page.slug}`,
    about: people.map((person) => person.name),
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldArticle) }}
      />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/questions" className="text-sm text-ink/60 hover:text-accent">
          ← Questions
        </Link>
        <Link href="/about" className="text-sm text-ink/60 hover:text-accent">
          Methodology
        </Link>
      </div>

      <header className="max-w-3xl mt-4 mb-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mb-3">
          Sourced guide
        </p>
        <h1 className="font-serif text-5xl mb-4 text-ink leading-tight">{page.title}</h1>
        <p className="text-xl text-ink/75 leading-relaxed">{page.shortAnswer}</p>
      </header>

      {chain && chain.length > 1 && (
        <section className="mb-10 rounded-md border border-ink/10 bg-ink/5 p-5">
          <h2 className="font-serif text-2xl mb-3 text-ink">Chain in the data</h2>
          <ol className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {chain.map(({ person, edge }, index) => (
              <li key={`${person.id}-${index}`} className="flex items-center gap-3">
                {index > 0 && edge && (
                  <span className="text-[10px] uppercase tracking-wider text-ink/50">
                    {relationLabel(edge.type)}
                  </span>
                )}
                <Link
                  href={`/fathers/${person.id}`}
                  className="rounded border border-ink/15 bg-parchment px-3 py-2 text-sm hover:border-accent hover:text-accent transition-colors"
                >
                  <span className="font-medium">{person.name}</span>
                  <span className="ml-2 text-ink/45 tabular-nums">{dateRange(person).text}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-10">
        <div>
          {page.sections.map((section) => (
            <section key={section.heading} className="mb-9">
              <h2 className="font-serif text-2xl mb-3 text-ink">{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mb-3">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {rels.length > 0 && (
            <section className="mb-10">
              <h2 className="font-serif text-2xl mb-3 text-ink">Relevant relationships</h2>
              <ul className="space-y-3">
                {rels.map((rel, index) => {
                  const from = getPerson(rel.from);
                  const to = getPerson(rel.to);
                  return (
                    <li key={`${rel.from}-${rel.type}-${rel.to}-${index}`} className="border-l-2 border-ink/15 pl-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Link href={`/fathers/${rel.from}`} className="font-medium hover:text-accent">
                          {from?.name ?? rel.from}
                        </Link>
                        <span className="text-ink/50">{relationLabel(rel.type)}</span>
                        <Link href={`/fathers/${rel.to}`} className="font-medium hover:text-accent">
                          {to?.name ?? rel.to}
                        </Link>
                        <span
                          className={`text-[10px] uppercase tracking-wider rounded border px-1.5 py-0.5 ${STRENGTH_CLASS[rel.strength]}`}
                        >
                          {rel.strength}
                        </span>
                      </div>
                      {rel.notes && <p className="text-sm text-ink/65 mt-1">{rel.notes}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="self-start">
          <section className="mb-6">
            <h2 className="font-serif text-xl mb-3 text-ink">Figures to inspect</h2>
            <div className="space-y-3">
              {people.map((person) => (
                <Link
                  key={person.id}
                  href={`/fathers/${person.id}`}
                  className="group flex gap-3 rounded-md border border-ink/10 bg-ink/[0.025] p-3 hover:border-accent transition-colors"
                >
                  <span className="block w-12 h-12 rounded-full overflow-hidden bg-ink/10 shrink-0">
                    {person.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.image_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: "center 8%" }}
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center font-serif text-lg text-ink/40">
                        {person.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-sm text-ink group-hover:text-accent leading-tight">
                      {person.name}
                    </span>
                    <span className="block text-[11px] text-ink/50 tabular-nums">
                      {dateRange(person).text}
                    </span>
                    <span className="block text-xs text-ink/60 mt-1 leading-snug">
                      {person.short_bio}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {related.length > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-3 text-ink">Related questions</h2>
              <div className="space-y-2">
                {related.map((relatedPage) =>
                  relatedPage ? (
                    <Link
                      key={relatedPage.slug}
                      href={`/questions/${relatedPage.slug}`}
                      className="block rounded border border-ink/10 px-3 py-2 text-sm hover:border-accent hover:text-accent transition-colors"
                    >
                      {relatedPage.title}
                    </Link>
                  ) : null
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      <div className="mt-12 border-t border-ink/10 pt-6 text-sm text-ink/60">
        These guides summarize the site data. For primary-source details, open the linked figure
        pages and the methodology notes.
      </div>
    </article>
  );
}
