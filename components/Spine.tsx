import Link from "next/link";
import { getPerson, getRelationships } from "@/lib/data";
import type { Relationship } from "@/lib/schema";

const SPINE_IDS = [
  "jesus-of-nazareth",
  "john-the-apostle",
  "polycarp-of-smyrna",
  "irenaeus-of-lyons",
  "hippolytus-of-rome",
  "origen-of-alexandria",
  "basil-of-caesarea",
  "ambrose-of-milan",
  "augustine-of-hippo",
  "bede-the-venerable",
];

const ERA_NOTES: Record<string, string> = {
  "polycarp-of-smyrna": "Apostolic Fathers — taught by disciples of the apostles, written under persecution.",
  "irenaeus-of-lyons": "Ante-Nicene — Apologists and bishops define orthodoxy against Gnostic and Marcionite teaching.",
  "basil-of-caesarea": "Nicene era — after Constantine (313), the great councils settle Trinitarian doctrine.",
  "augustine-of-hippo": "Late Patristic — Augustine in the West, the Cappadocians in the East, theology systematized.",
  "bede-the-venerable": "Early Medieval — patristic learning preserved and transmitted through monasteries.",
};

function findEdge(rels: Relationship[], a: string, b: string): Relationship | null {
  // Prefer "downstream" direction (a teaches b, a → b) and documented over tradition
  const matches = rels.filter(
    (r) => (r.from === a && r.to === b) || (r.from === b && r.to === a)
  );
  matches.sort((x, y) => {
    const order = (s: string) => (s === "documented" ? 0 : s === "tradition" ? 1 : 2);
    return order(x.strength) - order(y.strength);
  });
  return matches[0] ?? null;
}

export default function Spine() {
  const rels = getRelationships();
  const steps = SPINE_IDS.map((id, i) => {
    const person = getPerson(id);
    if (!person) return null;
    const prevId = i > 0 ? SPINE_IDS[i - 1] : null;
    const edge = prevId ? findEdge(rels, prevId, id) : null;
    return { person, edge };
  }).filter(Boolean) as { person: NonNullable<ReturnType<typeof getPerson>>; edge: Relationship | null }[];

  return (
    <section className="mb-16">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl mb-2">The chain, told plainly</h2>
        <p className="text-ink/70 mb-8 max-w-2xl">
          Ten people, almost seven hundred years. Each link below rests on a cited primary source —
          the kind a librarian would accept. Click any name for the full bio and every connection.
        </p>

        <ol className="relative">
          {steps.map(({ person, edge }, i) => (
            <li key={person.id} className="relative pl-12 pb-8 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  className={`absolute left-[18px] top-9 bottom-0 w-px ${
                    edge?.strength === "tradition" ? "border-l border-dashed border-ink/30" : "bg-ink/40"
                  }`}
                  style={
                    edge?.strength === "tradition"
                      ? { backgroundColor: "transparent", borderLeftWidth: 1 }
                      : undefined
                  }
                />
              )}
              <span
                className={`absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center text-sm font-serif ${
                  person.role.includes("apostle")
                    ? "bg-accent text-parchment"
                    : person.id === "jesus-of-nazareth"
                      ? "bg-ink text-parchment"
                      : "bg-parchment border-2 border-ink text-ink"
                } ${person.role.includes("bishop") ? "ring-2 ring-yellow-600 ring-offset-2 ring-offset-parchment" : ""}`}
              >
                {i + 1}
              </span>

              {edge && (
                <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1.5">
                  {edge.type.replace(/_/g, " ")}
                  {edge.strength === "tradition" && (
                    <span className="ml-2 italic text-ink/40 normal-case">— attested by tradition</span>
                  )}
                </div>
              )}

              <Link href={`/fathers/${person.id}`} className="group block">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="font-serif text-2xl group-hover:text-accent">{person.name}</h3>
                  <span className="text-sm text-ink/50">
                    {person.born ?? "?"} – {person.died ?? "?"}
                    {person.see ? ` · Bishop of ${person.see}` : ""}
                  </span>
                </div>
                <p className="text-ink/80 mt-1 max-w-2xl text-[15px] leading-relaxed">{person.short_bio}</p>
              </Link>

              {ERA_NOTES[person.id] && (
                <p className="mt-3 text-xs text-ink/55 italic max-w-xl border-l-2 border-ink/15 pl-3">
                  {ERA_NOTES[person.id]}
                </p>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10 pl-12">
          <p className="text-sm text-ink/60">
            These are ten of the {getRelationships().length > 0 ? "192" : ""} figures we track. The full
            lineage — every Apologist, Cappadocian, desert father, and pope through John of
            Damascus — is mapped below.
          </p>
        </div>
      </div>
    </section>
  );
}
