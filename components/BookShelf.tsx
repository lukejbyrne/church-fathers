import Link from "next/link";
import { amazonUrl } from "@/lib/affiliate";
import { bookDisplayTitle, type ResolvedBookRecommendation } from "@/lib/books";

export function BookCover({
  book,
  className = "h-[132px] w-[88px]",
}: {
  book: ResolvedBookRecommendation;
  className?: string;
}) {
  const title = bookDisplayTitle(book);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-sm border border-ink/15 bg-[linear-gradient(135deg,#2f261c,#8b1e2d_58%,#c8a75d)] shadow-sm ${className}`}
    >
      {book.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.coverImageUrl}
          alt={book.coverAlt ?? `Cover of ${title}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-2 text-parchment">
          <div className="text-[9px] uppercase tracking-wider opacity-70">
            Patristic text
          </div>
          <div>
            <div className="font-serif text-base leading-[1.05]">{title}</div>
            <div className="mt-2 h-px w-8 bg-parchment/45" />
          </div>
          <div className="text-[9px] leading-tight opacity-75">{book.person.name}</div>
        </div>
      )}
    </div>
  );
}

export default function BookShelf({
  books,
  title = "Recommended books",
  blurb,
  moreHref = "/books",
  moreLabel = "More books →",
}: {
  books: ResolvedBookRecommendation[];
  title?: string;
  blurb?: string;
  moreHref?: string | null;
  moreLabel?: string;
}) {
  if (books.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">{title}</h2>
          {blurb && <p className="text-sm text-ink/60 mt-1 max-w-2xl">{blurb}</p>}
        </div>
        {moreHref && (
          <Link href={moreHref} className="text-sm text-ink/60 hover:text-accent">
            {moreLabel}
          </Link>
        )}
      </div>

      <div className={`grid gap-3 ${books.length === 1 ? "md:grid-cols-1" : "md:grid-cols-3"}`}>
        {books.map((book) => {
          const buyUrl = amazonUrl({
            asin: book.work.amazon_asin,
            query:
              book.work.amazon_query ??
              `${book.displayTitle ?? book.work.title} ${book.person.name}`,
          });
          return (
            <article
              key={book.id}
              className="rounded-md border border-ink/10 bg-ink/[0.025] p-4"
            >
              <div className="flex gap-4">
                <BookCover book={book} />
                <div className="min-w-0">
                  <div className="text-[11px] leading-snug text-ink/50 mb-2">
                    {book.audience}
                  </div>
                  <h3 className="font-serif text-2xl leading-tight text-ink">
                    {bookDisplayTitle(book)}
                  </h3>
                  <Link
                    href={`/fathers/${book.person.id}`}
                    className="text-sm text-ink/55 hover:text-accent"
                  >
                    {book.person.name}
                  </Link>
                </div>
              </div>
              <p className="text-sm text-ink/70 mt-4 leading-snug">{book.reason}</p>
              <div className="flex flex-wrap gap-3 text-xs mt-4">
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
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
