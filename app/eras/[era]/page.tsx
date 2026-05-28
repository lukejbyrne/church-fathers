import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPeople } from "@/lib/data";
import type { Person } from "@/lib/schema";
import { dateRange } from "@/lib/dates";
import { ERAS_DATA, type EraSlug, inEra, sortKey } from "@/lib/eras";
import { getEraImage, imageCredit } from "@/lib/images";
import ShareBar from "@/components/ShareBar";
import BookShelf from "@/components/BookShelf";
import { getRecommendedBooks } from "@/lib/books";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(ERAS_DATA).map((era) => ({ era }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ era: string }>;
}): Promise<Metadata> {
  const { era: slug } = await params;
  const era = ERAS_DATA[slug as EraSlug];
  if (!era) return { title: "Era not found" };
  const url = canonicalUrl(`/eras/${slug}`);
  return {
    title: `${era.label} (${era.yearLabel})`,
    description: era.blurb,
    alternates: { canonical: url },
    openGraph: {
      title: `${era.label} (${era.yearLabel})`,
      description: era.blurb,
      url,
      type: "article",
    },
  };
}

function FigureCard({ p }: { p: Person }) {
  const dr = dateRange(p);
  return (
    <Link
      href={`/fathers/${p.id}`}
      className="group block border border-ink/10 rounded-md bg-parchment hover:border-accent/60 hover:shadow-sm transition overflow-hidden"
    >
      <div className="aspect-[4/5] bg-ink/5 overflow-hidden">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink/30 font-serif text-3xl">
            {p.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <div className="font-serif text-base text-ink group-hover:text-accent leading-tight">
          {p.name}
        </div>
        <div className="text-[11px] text-ink/55 mt-0.5" title={dr.explanation}>
          {dr.text}
        </div>
      </div>
    </Link>
  );
}

export default async function EraPage({
  params,
}: {
  params: Promise<{ era: string }>;
}) {
  const { era: slug } = await params;
  const era = ERAS_DATA[slug as EraSlug];
  if (!era) notFound();

  const all = getPeople();
  const figures = all
    .filter((p) => inEra(p, era))
    .sort((a, b) => {
      const sigDiff = (b.significance ?? 0) - (a.significance ?? 0);
      if (sigDiff !== 0) return sigDiff;
      return sortKey(a) - sortKey(b);
    });

  const headline = figures.slice(0, 12);
  const recommendedBooks = getRecommendedBooks({ eraSlug: era.slug, limit: 3 });
  const image = getEraImage(era.slug);
  const credit = image ? imageCredit(image) : "";
  const ldBreadcrumb = breadcrumbJsonLd([
    { name: "Patristic Lineage", path: "/" },
    { name: "Eras", path: "/eras" },
    { name: era.label, path: `/eras/${era.slug}` },
  ]);

  return (
    <article className="max-w-5xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>
      <h1 className="font-serif text-5xl mt-4 mb-1 text-ink">{era.label}</h1>
      <p className="text-ink/55 italic mb-8">{era.yearLabel}</p>

      {image ? (
        <figure className="mb-10 overflow-hidden rounded-md border border-ink/10 bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            className="w-full max-h-[430px] object-cover"
            style={{ objectPosition: image.object_position ?? "center" }}
          />
          {(image.caption || credit) ? (
            <figcaption className="px-3 py-2 text-[11px] text-ink/55">
              {image.caption}
              {image.caption && credit ? " " : ""}
              {image.source_url && credit ? (
                <a href={image.source_url} target="_blank" rel="noopener noreferrer" className="underline decoration-ink/20 underline-offset-2 hover:text-accent">
                  {credit}
                </a>
              ) : (
                credit
              )}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="grid lg:grid-cols-[1fr_260px] gap-10 mb-12">
        <section>
          {era.intro.map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
        </section>

        <aside className="lg:border-l lg:border-ink/10 lg:pl-6">
          <h2 className="font-serif text-lg text-ink mb-3">Key events</h2>
          <ul className="space-y-2 text-sm">
            {era.events.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-ink/50 tabular-nums shrink-0 w-14">{e.year}</span>
                <span className="text-ink/80">{e.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {headline.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-ink mb-1">Major figures</h2>
          <p className="text-ink/55 text-sm mb-5">
            {figures.length} figure{figures.length === 1 ? "" : "s"} placed in this era. Showing the
            most prominent.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {headline.map((p) => (
              <FigureCard key={p.id} p={p} />
            ))}
          </div>
          {figures.length > headline.length && (
            <p className="text-sm text-ink/55 mt-4">
              Plus {figures.length - headline.length} more —{" "}
              <Link href="/directory" className="underline hover:text-accent">
                see the full directory
              </Link>
              .
            </p>
          )}
        </section>
      )}

      <section className="mb-12">
        <h2 className="font-serif text-2xl text-ink mb-3">What was decided</h2>
        <ul className="list-disc pl-6 space-y-2 text-ink/80">
          {era.decided.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </section>

      <BookShelf
        books={recommendedBooks}
        title={`Recommended books for ${era.label}`}
        blurb="A short reading shelf for this era, chosen from the works already attached to figure pages."
        moreHref={`/books#era-${era.slug}`}
      />

      <div className="flex flex-wrap gap-3 mt-12 pt-8 border-t border-ink/10">
        <Link
          href="/"
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
        >
          See the full lineage
        </Link>
        <Link
          href="/start-here"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Start here
        </Link>
        <Link
          href="/directory"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Browse all figures
        </Link>
      </div>

      <div className="mt-10">
        <ShareBar
          path={`/eras/${era.slug}`}
          title={`${era.label} (${era.yearLabel}) — Patristic Lineage`}
        />
      </div>
    </article>
  );
}
