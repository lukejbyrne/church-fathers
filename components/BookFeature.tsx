import Link from "next/link";
import { amazonUrl } from "@/lib/affiliate";
import { bookDisplayTitle, type ResolvedBookRecommendation } from "@/lib/books";
import { BookCover } from "@/components/BookShelf";

export default function BookFeature({
  book,
  eyebrow = "Book of the day",
  title = "Book of the day",
  blurb = "A reading pick tied to today's figure, quote, era, or event.",
  className = "",
}: {
  book: ResolvedBookRecommendation | null;
  eyebrow?: string;
  title?: string;
  blurb?: string;
  className?: string;
}) {
  if (!book) return null;

  const displayTitle = bookDisplayTitle(book);
  const buyUrl = amazonUrl({
    asin: book.work.amazon_asin,
    query: book.work.amazon_query ?? `${displayTitle} ${book.person.name}`,
  });
  const description = [blurb, book.reason].filter(Boolean).join(" ");

  return (
    <section className={`max-w-5xl mx-auto px-4 ${className}`}>
      <div className="rounded-md border border-ink/10 bg-ink/[0.025] p-4 sm:p-5">
        <div className="flex gap-4 sm:gap-6 items-start">
          <BookCover book={book} className="h-[150px] w-[100px]" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink/45 mb-2">
              {eyebrow}
            </div>
            {title ? (
              <h2 className="font-serif text-2xl sm:text-3xl leading-tight text-ink">
                {title}
              </h2>
            ) : null}
            <h3 className={`font-serif text-xl sm:text-2xl leading-tight text-ink/90 ${title ? "mt-3" : "mt-1"}`}>
              {displayTitle}
            </h3>
            <Link
              href={`/fathers/${book.person.id}`}
              className="text-sm text-ink/55 hover:text-accent"
            >
              {book.person.name}
            </Link>
            <p className="text-sm text-ink/70 mt-3 leading-snug max-w-2xl">{description}</p>
            <div className="flex flex-wrap gap-3 text-sm mt-4">
              {buyUrl && (
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener sponsored"
                  className="text-accent hover:underline"
                >
                  Find a copy →
                </a>
              )}
              {book.work.ccel_url && (
                <a
                  href={book.work.ccel_url}
                  target="_blank"
                  rel="noopener"
                  className="text-ink/60 hover:text-accent underline"
                >
                  Read free
                </a>
              )}
              <Link href="/books" className="text-ink/60 hover:text-accent underline">
                Reading path
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
