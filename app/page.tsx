import { getPeople, getRelationships } from "@/lib/data";
import HomeView from "@/components/HomeView";
import HeroChain from "@/components/HeroChain";
import SubscribeForm from "@/components/SubscribeForm";
import BookFeature from "@/components/BookFeature";
import { getBookOfDay } from "@/lib/books";

export const dynamic = "force-dynamic";

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
