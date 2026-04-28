import { notFound } from "next/navigation";
import Link from "next/link";
import { getPeople, getPerson, getRelationshipsFor, chainTo } from "@/lib/data";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getPeople().map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPerson(slug);
  if (!p) return {};
  return {
    title: `${p.name} — Church Fathers`,
    description: p.short_bio,
  };
}

export default async function FatherPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();

  const rels = getRelationshipsFor(person.id);
  const grouped = {
    documented: rels.filter((r) => r.strength === "documented"),
    tradition: rels.filter((r) => r.strength === "tradition"),
    disputed: rels.filter((r) => r.strength === "disputed"),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">← Lineage</Link>
      <h1 className="font-serif text-5xl mt-4 mb-2">{person.name}</h1>
      <div className="text-ink/60 mb-6">
        {person.born ?? "?"} – {person.died ?? "?"}
        {person.birth_place ? ` · b. ${person.birth_place}` : ""}
        {person.see ? ` · Bishop of ${person.see}` : ""}
      </div>
      <div className="flex flex-wrap gap-1 mb-6">
        {person.role.map((r) => (
          <span key={r} className="text-xs uppercase tracking-wide bg-ink/10 px-2 py-0.5 rounded">
            {r}
          </span>
        ))}
      </div>

      <p className="text-lg leading-relaxed mb-8">{person.short_bio}</p>

      <ChainToJesus id={person.id} />


      {person.citations.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-2xl mb-2">Sources for biography</h2>
          <ul className="text-sm space-y-1">
            {person.citations.map((c, i) => (
              <li key={i} className="text-ink/70">
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noopener" className="hover:text-accent underline">
                    {c.source}
                  </a>
                ) : (
                  c.source
                )}{" "}
                <span className="text-[10px] uppercase text-ink/40 ml-1">{c.kind}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(["documented", "tradition", "disputed"] as const).map((strength) =>
        grouped[strength].length === 0 ? null : (
          <section key={strength} className="mb-8">
            <h2 className="font-serif text-2xl mb-3 capitalize">
              {strength} connections
              <span className="text-sm text-ink/50 ml-2">({grouped[strength].length})</span>
            </h2>
            <ul className="space-y-3">
              {grouped[strength].map((r, i) => {
                const otherId = r.from === person.id ? r.to : r.from;
                const other = getPerson(otherId);
                const verb = r.from === person.id ? r.type : `${r.type} (incoming)`;
                return (
                  <li key={i} className="border-l-2 border-ink/15 pl-4">
                    <div className="text-sm">
                      <span className="text-ink/60">{verb.replace(/_/g, " ")}</span>{" "}
                      <Link href={`/fathers/${otherId}`} className="font-medium hover:text-accent">
                        {other?.name ?? otherId}
                      </Link>
                    </div>
                    {r.notes && <div className="text-ink/70 text-sm mt-1">{r.notes}</div>}
                    <div className="text-xs text-ink/50 mt-1">
                      {r.citations.map((c, j) => (
                        <span key={j}>
                          {j > 0 && " · "}
                          {c.url ? (
                            <a href={c.url} target="_blank" rel="noopener" className="hover:text-accent underline">
                              {c.source}
                            </a>
                          ) : (
                            c.source
                          )}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )
      )}

      {(person.wikipedia_url || person.ccel_url) && (
        <section className="mb-8 text-sm">
          <h2 className="font-serif text-2xl mb-2">Read more</h2>
          <ul className="space-y-1">
            {person.wikipedia_url && (
              <li>
                <a href={person.wikipedia_url} target="_blank" rel="noopener" className="hover:text-accent underline">
                  Wikipedia
                </a>
              </li>
            )}
            {person.ccel_url && (
              <li>
                <a href={person.ccel_url} target="_blank" rel="noopener" className="hover:text-accent underline">
                  Primary text on CCEL
                </a>
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}

function ChainToJesus({ id }: { id: string }) {
  const chain = chainTo(id);
  if (!chain || chain.length <= 1) return null;
  // chain comes anchor-first; we want anchor → id reading order
  return (
    <section className="mb-10 -mx-4 px-4 py-5 bg-ink/5 border-y border-ink/10">
      <h2 className="font-serif text-2xl mb-1">Chain to Jesus</h2>
      <p className="text-xs text-ink/50 mb-4">
        Shortest path through documented + traditional relationships ({chain.length - 1} step{chain.length === 2 ? "" : "s"})
      </p>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {chain.map(({ person, edge }, i) => (
          <li key={person.id} className="flex items-center gap-1">
            {i > 0 && (
              <span
                className={`text-[10px] uppercase mx-1 ${
                  edge?.strength === "documented"
                    ? "text-ink/60"
                    : edge?.strength === "tradition"
                      ? "text-ink/40 italic"
                      : "text-accent"
                }`}
              >
                — {edge?.type.replace(/_/g, " ")} →
              </span>
            )}
            <Link
              href={`/fathers/${person.id}`}
              className={`px-2 py-1 rounded border ${
                person.id === id
                  ? "bg-accent text-parchment border-accent"
                  : person.id === "jesus-of-nazareth"
                    ? "bg-ink text-parchment border-ink"
                    : "bg-parchment border-ink/20 hover:border-accent"
              }`}
            >
              <span className="font-medium">{person.name}</span>
              <span className="text-[10px] opacity-70 ml-1">
                {person.born ?? "?"}–{person.died ?? "?"}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
