import Link from "next/link";
import { getPeople, getRelationships } from "@/lib/data";
import Spine from "@/components/Spine";
import HomeView from "@/components/HomeView";

export default function Home() {
  const people = getPeople();
  const relationships = getRelationships();

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
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-6 text-center">
        <h1 className="font-serif text-5xl mb-3 leading-tight">From Jesus to the Fathers</h1>
        <p className="text-base text-ink/75 max-w-2xl mx-auto leading-relaxed">
          A visual chain of who knew whom — apostles, bishops, theologians, martyrs — from
          AD&nbsp;30 to&nbsp;750. Every link is sourced. Click any bar to lock a person and trace their connections.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-sm">
          <Link href="/directory" className="px-3 py-1.5 bg-ink text-parchment rounded hover:bg-accent transition-colors">
            Browse all 192
          </Link>
          <Link href="/about" className="px-3 py-1.5 border border-ink/30 rounded hover:border-accent">
            Methodology
          </Link>
        </div>
      </section>

      <section className="px-4 pb-12">
        <HomeView people={people} relationships={relationships} />
      </section>

      <div className="max-w-5xl mx-auto px-4 pt-10 border-t border-ink/10">
        <Spine />
      </div>
    </>
  );
}
