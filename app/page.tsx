import { getPeople, getRelationships } from "@/lib/data";
import Link from "next/link";
import HomeView from "@/components/HomeView";
import HeroChain from "@/components/HeroChain";
import SubscribeForm from "@/components/SubscribeForm";
import BookFeature from "@/components/BookFeature";
import { getBookOfDay } from "@/lib/books";
import { canonicalUrl, SITE_DESC, SITE_NAME } from "@/lib/seo";
import type { Metadata } from "next";

// Static page with hourly ISR. The homepage content only changes when the
// "book of the day" rolls over, so we serve one cached copy to everyone and
// regenerate at most once an hour — instead of running the server on every
// request (which was burning the Netlify function quota).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_DESC,
  alternates: { canonical: canonicalUrl("/") },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESC,
    url: canonicalUrl("/"),
    type: "website",
  },
};

export default function Home() {
  const people = getPeople();
  const relationships = getRelationships();
  const bookOfDay = getBookOfDay(new Date());

  if (people.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <h1 className="text-4xl mb-4">Church Fathers Lineage</h1>
        <p className="text-ink/70">
          Data is being assembled. Run <code className="bg-ink/10 px-1 rounded">pnpm data</code> to merge research output into <code>data/people.json</code> and <code>data/relationships.json</code>.
        </p>
      </div>
    );
  }

  return (
    <>
      <HeroChain />
      <BookFeature
        book={bookOfDay}
        eyebrow="Daily reading"
        title="Book of the day"
        className="pb-12"
      />
      <section className="max-w-5xl mx-auto px-4 py-10 border-t border-ink/10">
        <div className="grid md:grid-cols-[1fr_1fr] gap-4">
          <Link
            href="/resources"
            className="group rounded-md border border-ink/10 bg-ink/[0.025] p-5 hover:border-accent transition-colors"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45 mb-3">
              Public resources
            </p>
            <h2 className="font-serif text-3xl text-ink group-hover:text-accent mb-2">
              Free maps, guides, and study routes
            </h2>
            <p className="text-sm text-ink/65">
              Beginner paths, bishop lists, question guides, calendar routes, and reading shelves
              for self-study or teaching.
            </p>
          </Link>
          <Link
            href="/study-packs"
            className="group rounded-md border border-ink/10 bg-ink/[0.025] p-5 hover:border-accent transition-colors"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink/45 mb-3">
              Support and sponsor
            </p>
            <h2 className="font-serif text-3xl text-ink group-hover:text-accent mb-2">
              Help keep the Church Fathers graph free
            </h2>
            <p className="text-sm text-ink/65">
              Support source checking, page maintenance, visual explanations, and optional
              sponsorships for existing pages.
            </p>
          </Link>
        </div>
      </section>
      <HomeView people={people} relationships={relationships} />
      <section className="max-w-3xl mx-auto px-4 py-10 border-t border-ink/10 mt-10">
        <p className="text-center text-sm text-ink/60 mb-3">
          Get one early Church quote each morning, with the historical context in plain English.
        </p>
        <SubscribeForm variant="compact" />
      </section>
    </>
  );
}
