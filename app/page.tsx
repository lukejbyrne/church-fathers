import { getPeople, getRelationships } from "@/lib/data";
import LineageGraph from "@/components/LineageGraph";

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-4xl mb-2">From Jesus to the Fathers</h1>
        <p className="text-ink/70 max-w-3xl">
          Each dot is a person; lines show who knew (or knew of) whom. Solid = documented in primary sources, dashed = traditional attestation, dotted red = disputed.
        </p>
      </header>
      <LineageGraph people={people} relationships={relationships} />
    </div>
  );
}
