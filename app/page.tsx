import Link from "next/link";
import { getPeople, getRelationships } from "@/lib/data";
import LineageGraph from "@/components/LineageGraph";
import Spine from "@/components/Spine";

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
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-10 text-center">
        <h1 className="font-serif text-6xl mb-5 leading-tight">From Jesus to the Fathers</h1>
        <p className="text-lg text-ink/75 max-w-2xl mx-auto leading-relaxed">
          A visual chain of who knew whom — apostles, bishops, theologians, martyrs — from
          AD&nbsp;30 to&nbsp;750. Every link is sourced. Every claim is contestable.
        </p>
        <div className="flex justify-center gap-4 mt-6 text-sm">
          <Link href="/directory" className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors">
            Browse all 192 figures
          </Link>
          <Link href="/about" className="px-4 py-2 border border-ink/30 rounded hover:border-accent">
            How this was sourced
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        <Spine />
      </div>

      <section className="max-w-7xl mx-auto px-4 pt-8 pb-16 border-t border-ink/10">
        <header className="mb-6 max-w-3xl">
          <h2 className="font-serif text-3xl mb-2">The full lineage</h2>
          <p className="text-ink/70">
            All 192 figures plotted by year (vertical) and region (horizontal). Solid lines are
            documented in primary sources; dashed are traditional attestations; dotted red are
            disputed. Hover for dates, click for the full bio. Bishops have a gold ring.
          </p>
        </header>
        <LineageGraph people={people} relationships={relationships} />
      </section>
    </>
  );
}
