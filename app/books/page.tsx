import Link from "next/link";
import type { Metadata } from "next";
import BookShelf from "@/components/BookShelf";
import { getRecommendedBooks } from "@/lib/books";
import { ERAS_DATA, type EraSlug } from "@/lib/eras";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Recommended books",
  description:
    "A practical reading path through the Church Fathers: starter books, era-by-era recommendations, and controversy-focused texts.",
  alternates: { canonical: canonicalUrl("/books") },
  openGraph: {
    title: "Recommended books",
    description:
      "A practical reading path through the Church Fathers: starter books, era-by-era recommendations, and controversy-focused texts.",
    url: canonicalUrl("/books"),
    type: "article",
  },
};

const ERA_ORDER: EraSlug[] = [
  "apostolic-fathers",
  "ante-nicene",
  "desert-fathers",
  "nicene",
  "post-nicene",
  "early-medieval",
];

const CHOOSE = [
  {
    title: "Start tiny",
    body: "Pick one short book before buying a shelf. Athanasius or the Apostolic Fathers is enough to begin.",
  },
  {
    title: "Follow your question",
    body: "Succession, Trinity, bishops, icons, and heresies each have a different first book.",
  },
  {
    title: "Use figure pages",
    body: "Every linked Father page shows context, works, and the chain back through the dataset.",
  },
];

export default function BooksPage() {
  const starter = getRecommendedBooks({ shelf: "starter", limit: 6 });
  const controversies = getRecommendedBooks({ eventSlug: "schisms", limit: 6 });

  return (
    <article className="max-w-6xl mx-auto px-4 py-12 text-ink/85">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>

      <header className="grid lg:grid-cols-[1fr_360px] gap-8 mt-4 mb-12 items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mb-3">
            Reading path
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-ink leading-[1.02] max-w-3xl">
            Recommended books on the Church Fathers
          </h1>
          <p className="text-lg text-ink/70 mt-4 max-w-2xl leading-relaxed">
            A practical shelf, not a complete bibliography. Start with one book, then
            follow the era, controversy, or Father that catches your attention.
          </p>
        </div>

        <section className="rounded-md border border-ink/10 bg-ink/[0.025] p-5">
          <h2 className="font-serif text-2xl text-ink mb-3">First pick</h2>
          <p className="text-sm text-ink/65">
            If you want the safest first purchase, choose the Apostolic Fathers for
            breadth or Athanasius's <em>On the Incarnation</em> for one short classic.
          </p>
        </section>
      </header>

      <BookShelf
        books={starter}
        title="Best first books"
        blurb="Readable, important, and useful before you know the whole map."
        moreHref={null}
      />

      <section className="mb-12">
        <h2 className="font-serif text-3xl text-ink mb-5">Choose by era</h2>
        <div className="space-y-10">
          {ERA_ORDER.map((eraSlug) => {
            const era = ERAS_DATA[eraSlug];
            const books = getRecommendedBooks({ eraSlug, limit: 3 });
            return (
              <div key={eraSlug} id={`era-${eraSlug}`}>
                <BookShelf
                  books={books}
                  title={`${era.label} (${era.yearLabel})`}
                  blurb={era.blurb}
                  moreHref={`/eras/${eraSlug}`}
                  moreLabel="Open era →"
                />
              </div>
            );
          })}
        </div>
      </section>

      <BookShelf
        books={controversies}
        title="For councils, schisms, and heresies"
        blurb="Books that help explain why the major disputes mattered."
        moreHref="/schisms"
        moreLabel="Open schisms →"
      />

      <section className="grid md:grid-cols-3 gap-3 border-t border-ink/10 pt-8">
        {CHOOSE.map((item) => (
          <div key={item.title} className="rounded-md border border-ink/10 bg-ink/[0.025] p-4">
            <h2 className="font-serif text-2xl text-ink">{item.title}</h2>
            <p className="text-sm text-ink/65 mt-2 leading-snug">{item.body}</p>
          </div>
        ))}
      </section>

      <p className="text-xs text-ink/45 italic mt-8">
        Some links use Amazon search URLs. As an Amazon Associate we earn from qualifying purchases.
        No prices are shown here because availability changes.
      </p>
    </article>
  );
}
