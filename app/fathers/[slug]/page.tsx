import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getPeople, getPerson, getRelationshipsFor, chainTo } from "@/lib/data";
import type { Person, Relationship } from "@/lib/schema";
import type { ChainKind } from "@/lib/lineage";
import type { Metadata } from "next";
import { amazonUrl } from "@/lib/affiliate";
import ChainToJesus, { type ChainStep } from "@/components/ChainToJesus";
import ShareBar from "@/components/ShareBar";
import { dateRange, bornDisplay, diedDisplay } from "@/lib/dates";

const ALL_KINDS: ChainKind[] = ["all", "pedagogical", "episcopal", "documented_only"];

function buildChainsFor(id: string): Partial<Record<ChainKind, ChainStep[] | null>> {
  const result: Partial<Record<ChainKind, ChainStep[] | null>> = {};
  for (const k of ALL_KINDS) {
    const c = chainTo(id, "jesus-of-nazareth", k);
    result[k] = c
      ? c.map(({ person, edge }) => ({
          person: {
            id: person.id,
            name: person.name,
            born: person.born,
            born_circa: person.born_circa,
            died: person.died,
            died_circa: person.died_circa,
            role: person.role,
            image_url: person.image_url,
          },
          edge: edge ? { type: edge.type, strength: edge.strength } : null,
        }))
      : null;
  }
  return result;
}

type Token = { kind: "text"; value: string } | { kind: "person"; id: string; name: string };
type FaqEntry = { q: string; tokens: Token[]; plain: string };

function buildFaq(person: Person, rels: Relationship[]): FaqEntry[] {
  const nameOf = (id: string) => getPerson(id)?.name ?? id;
  const tokensFromIds = (ids: string[], suffix = "."): { tokens: Token[]; plain: string } => {
    const tokens: Token[] = [];
    ids.forEach((id, i) => {
      if (i > 0) {
        const sep = i === ids.length - 1 ? (ids.length === 2 ? " and " : ", and ") : ", ";
        tokens.push({ kind: "text", value: sep });
      }
      tokens.push({ kind: "person", id, name: nameOf(id) });
    });
    if (suffix) tokens.push({ kind: "text", value: suffix });
    const plain = tokens
      .map((t) => (t.kind === "text" ? t.value : t.name))
      .join("");
    return { tokens, plain };
  };
  const others = (filter: (r: Relationship) => boolean, side: "from" | "to" | "other") => {
    const ids = new Set<string>();
    for (const r of rels) {
      if (!filter(r)) continue;
      const id = side === "from" ? r.from : side === "to" ? r.to : r.from === person.id ? r.to : r.from;
      if (id !== person.id) ids.add(id);
    }
    return Array.from(ids);
  };

  const teachers = others(
    (r) => (r.from === person.id && r.type === "taught_by") || (r.to === person.id && r.type === "taught"),
    "other"
  );
  const students = others(
    (r) => (r.from === person.id && r.type === "taught") || (r.to === person.id && r.type === "taught_by"),
    "other"
  );
  const correspondents = others((r) => r.type === "corresponded", "other");
  const met = others((r) => r.type === "met", "other");
  const opponents = others((r) => r.type === "opposed", "other");
  const baptizer = others((r) => r.from === person.id && r.type === "baptized_by", "to");
  const ordainer = others((r) => r.from === person.id && r.type === "ordained_by", "to");
  const succeededWho = others((r) => r.from === person.id && r.type === "succeeded_in_see", "to");
  const successors = others((r) => r.to === person.id && r.type === "succeeded_in_see", "from");

  const dates = `${person.born ?? "?"}–${person.died ?? "?"}`;
  const faq: FaqEntry[] = [];

  const intro = `${person.name} (${dates}) — ${person.short_bio}`;
  faq.push({ q: `Who was ${person.name}?`, tokens: [{ kind: "text", value: intro }], plain: intro });

  const push = (q: string, ids: string[]) => {
    if (!ids.length) return;
    const { tokens, plain } = tokensFromIds(ids);
    faq.push({ q, tokens, plain });
  };

  push(`Who taught ${person.name}?`, teachers);
  push(`Who did ${person.name} teach?`, students);
  push(`Who did ${person.name} correspond with?`, correspondents);
  push(`Who did ${person.name} meet?`, met);
  push(`Who did ${person.name} oppose?`, opponents);
  push(`Who baptized ${person.name}?`, baptizer);
  push(`Who ordained ${person.name}?`, ordainer);
  if (person.see) {
    push(`Who did ${person.name} succeed as bishop of ${person.see}?`, succeededWho);
    push(`Who succeeded ${person.name} as bishop of ${person.see}?`, successors);
  }

  return faq.slice(0, 8);
}

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

export default async function FatherPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();
  const chains = buildChainsFor(person.id);

  const rels = getRelationshipsFor(person.id);
  const grouped = {
    documented: rels.filter((r) => r.strength === "documented"),
    tradition: rels.filter((r) => r.strength === "tradition"),
    disputed: rels.filter((r) => r.strength === "disputed"),
  };

  const sameAs = [person.wikipedia_url, person.wikidata_id ? `https://www.wikidata.org/wiki/${person.wikidata_id}` : null, person.ccel_url].filter(Boolean) as string[];
  const ldPerson = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `#${person.id}`,
    name: person.name,
    alternateName: person.alt_names?.length ? person.alt_names : undefined,
    description: person.short_bio,
    birthDate: person.born != null ? String(person.born) : undefined,
    deathDate: person.died != null ? String(person.died) : undefined,
    birthPlace: person.birth_place || undefined,
    deathPlace: person.death_place || undefined,
    jobTitle: person.role,
    sameAs: sameAs.length ? sameAs : undefined,
    citation: person.citations.map((c) => c.source),
  };

  const faq = buildFaq(person, rels);
  const ldFaq = faq.length > 1 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.plain },
    })),
  } : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldPerson) }}
      />
      {ldFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldFaq) }}
        />
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="text-sm text-ink/60 hover:text-accent">← Lineage</Link>
        <ShareBar
          path={`/fathers/${person.id}`}
          title={`${person.name} — Patristic Lineage`}
          compact
        />
      </div>
      <div className="flex gap-6 mt-4 mb-6 items-start flex-wrap sm:flex-nowrap">
        {person.image_url && (
          <figure className="shrink-0 w-32 sm:w-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={person.image_url}
              alt={`Portrait of ${person.name}`}
              loading="lazy"
              className="w-full h-auto rounded border border-ink/15 bg-ink/5 object-cover"
            />
            {(person.image_credit || person.image_license) && (
              <figcaption className="text-[10px] text-ink/50 mt-1 leading-tight">
                {person.image_credit}
                {person.image_credit && person.image_license ? " · " : ""}
                {person.image_license}
              </figcaption>
            )}
          </figure>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-5xl mb-2 leading-tight">{person.name}</h1>
          <div className="text-ink/60">
            <span title={dateRange(person).explanation || undefined}>
              {dateRange(person).text}
            </span>
            {person.birth_place ? ` · b. ${person.birth_place}` : ""}
            {person.see ? ` · Bishop of ${person.see}` : ""}
          </div>
          {(bornDisplay(person).isEstimate || diedDisplay(person).isEstimate) && (
            <p className="text-[11px] text-ink/45 italic mt-1">
              * Date marked with an asterisk is a placeholder estimate (lifespan
              heuristic), not a sourced claim. Hover for the derivation.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-6">
        {person.role.map((r) => (
          <span key={r} className="text-xs uppercase tracking-wide bg-ink/10 px-2 py-0.5 rounded">
            {r}
          </span>
        ))}
      </div>

      {/* Quick facts — biographical details broken out so they're easy to scan */}
      <section className="mb-8 border border-ink/10 rounded-md bg-ink/5 px-5 py-4">
        <h2 className="font-serif text-base text-ink/80 mb-3 uppercase tracking-wider text-[11px]">
          Quick facts
        </h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-ink/55 w-24 shrink-0">Born</dt>
            <dd
              className="text-ink/85"
              title={bornDisplay(person).explanation || undefined}
            >
              {bornDisplay(person).text}
              {person.birth_place ? `, ${person.birth_place}` : ""}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink/55 w-24 shrink-0">Died</dt>
            <dd
              className="text-ink/85"
              title={diedDisplay(person).explanation || undefined}
            >
              {diedDisplay(person).text}
              {person.death_place ? `, ${person.death_place}` : ""}
            </dd>
          </div>
          {person.see && (
            <div className="flex gap-2">
              <dt className="text-ink/55 w-24 shrink-0">See</dt>
              <dd className="text-ink/85">{person.see}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-ink/55 w-24 shrink-0">Region</dt>
            <dd className="text-ink/85 capitalize">
              {person.region.replace(/-/g, " ")}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink/55 w-24 shrink-0">Era</dt>
            <dd className="text-ink/85 capitalize">
              {person.tradition_status.replace(/-/g, " ")}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink/55 w-24 shrink-0">Significance</dt>
            <dd className="text-ink/85">
              {person.significance === 4
                ? "Apostolic / Christ"
                : person.significance === 3
                  ? "Major Father"
                  : person.significance === 2
                    ? "Notable"
                    : "Minor"}
              <span className="text-ink/40 ml-1">
                ({person.significance}/4)
              </span>
            </dd>
          </div>
          {person.alt_names && person.alt_names.length > 0 && (
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-ink/55 w-24 shrink-0">Also known as</dt>
              <dd className="text-ink/85">{person.alt_names.join(" · ")}</dd>
            </div>
          )}
        </dl>
      </section>

      <p className="text-lg leading-relaxed mb-8">{person.short_bio}</p>

      {person.why_matters && (
        <section className="mb-10 max-w-prose">
          <h2 className="font-serif text-2xl mb-3">Why {person.name.split(" of ")[0]} matters</h2>
          {person.why_matters.split(/\n\n+/).map((para, i) => (
            <p key={i} className="text-ink/85 leading-relaxed mb-3 text-[17px]">
              {para}
            </p>
          ))}
        </section>
      )}

      <Suspense
        fallback={
          <section className="mb-10 -mx-4 px-4 py-6 bg-ink/5 border-y border-ink/10">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-2xl mb-2">Chain to Jesus</h2>
              <p className="text-sm text-ink/50">Loading…</p>
            </div>
          </section>
        }
      >
        <ChainToJesus id={person.id} chains={chains} />
      </Suspense>

      {faq.length > 1 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl mb-3">Common questions</h2>
          <dl className="space-y-3">
            {faq.map((f, i) => (
              <div key={i}>
                <dt className="font-medium text-ink/85">{f.q}</dt>
                <dd className="text-ink/70 text-[15px] mt-0.5">
                  {f.tokens.map((t, j) =>
                    t.kind === "person" ? (
                      <Link
                        key={j}
                        href={`/fathers/${t.id}`}
                        className="font-medium text-ink hover:text-accent underline decoration-ink/30 hover:decoration-accent underline-offset-2"
                      >
                        {t.name}
                      </Link>
                    ) : (
                      <span key={j}>{t.value}</span>
                    )
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {person.works && person.works.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl mb-3">Works</h2>
          <ul className="space-y-3">
            {person.works.map((w, i) => {
              const azUrl =
                amazonUrl({ asin: w.amazon_asin }) ??
                amazonUrl({ query: w.amazon_query ?? `${w.title} ${person.name}` });
              return (
                <li key={i} className="border-l-2 border-ink/15 pl-4">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-serif text-lg">{w.title}</span>
                    {w.year != null && <span className="text-xs text-ink/50">c. {w.year}</span>}
                  </div>
                  {w.description && <p className="text-sm text-ink/70 mt-1">{w.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs mt-1.5">
                    {azUrl && (
                      <a
                        href={azUrl}
                        target="_blank"
                        rel="noopener sponsored"
                        className="text-accent hover:underline"
                      >
                        Buy on Amazon →
                      </a>
                    )}
                    {w.ccel_url && (
                      <a
                        href={w.ccel_url}
                        target="_blank"
                        rel="noopener"
                        className="text-ink/60 hover:text-accent underline"
                      >
                        Read free on CCEL
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-[10px] text-ink/40 mt-3 italic">
            As an Amazon Associate we earn from qualifying purchases.
          </p>
        </section>
      )}


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

      {(person.wikipedia_url || person.ccel_url || person.wikidata_id) && (
        <section className="mb-8">
          <h2 className="font-serif text-2xl mb-3">External resources</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {person.wikipedia_url && (
              <a
                href={person.wikipedia_url}
                target="_blank"
                rel="noopener"
                className="flex items-start gap-3 p-3 border border-ink/10 rounded hover:border-accent transition-colors group"
              >
                <span className="text-2xl shrink-0">📖</span>
                <span className="min-w-0">
                  <span className="block font-medium text-ink group-hover:text-accent">
                    Wikipedia
                  </span>
                  <span className="block text-xs text-ink/60">
                    Full encyclopedic biography with footnotes and further reading.
                  </span>
                </span>
              </a>
            )}
            {person.ccel_url && (
              <a
                href={person.ccel_url}
                target="_blank"
                rel="noopener"
                className="flex items-start gap-3 p-3 border border-ink/10 rounded hover:border-accent transition-colors group"
              >
                <span className="text-2xl shrink-0">📜</span>
                <span className="min-w-0">
                  <span className="block font-medium text-ink group-hover:text-accent">
                    Primary text on CCEL
                  </span>
                  <span className="block text-xs text-ink/60">
                    Christian Classics Ethereal Library — full text in English, free.
                  </span>
                </span>
              </a>
            )}
            {person.wikidata_id && (
              <a
                href={`https://www.wikidata.org/wiki/${person.wikidata_id}`}
                target="_blank"
                rel="noopener"
                className="flex items-start gap-3 p-3 border border-ink/10 rounded hover:border-accent transition-colors group"
              >
                <span className="text-2xl shrink-0">🔗</span>
                <span className="min-w-0">
                  <span className="block font-medium text-ink group-hover:text-accent">
                    Wikidata
                  </span>
                  <span className="block text-xs text-ink/60">
                    Structured data hub linking to library catalogues, archives, and
                    academic sources worldwide.
                  </span>
                </span>
              </a>
            )}
            <a
              href={`https://en.wikisource.org/wiki/Special:Search?search=${encodeURIComponent(person.name)}&go=Go`}
              target="_blank"
              rel="noopener"
              className="flex items-start gap-3 p-3 border border-ink/10 rounded hover:border-accent transition-colors group"
            >
              <span className="text-2xl shrink-0">🏛️</span>
              <span className="min-w-0">
                <span className="block font-medium text-ink group-hover:text-accent">
                  Wikisource
                </span>
                <span className="block text-xs text-ink/60">
                  Public-domain primary texts and translations (search).
                </span>
              </span>
            </a>
            <a
              href={`https://newadvent.org/cathen/index.html`}
              target="_blank"
              rel="noopener"
              className="flex items-start gap-3 p-3 border border-ink/10 rounded hover:border-accent transition-colors group"
            >
              <span className="text-2xl shrink-0">⛪</span>
              <span className="min-w-0">
                <span className="block font-medium text-ink group-hover:text-accent">
                  Catholic Encyclopedia
                </span>
                <span className="block text-xs text-ink/60">
                  1913 reference — long entries, useful for less-known figures (search for {person.name}).
                </span>
              </span>
            </a>
          </div>
        </section>
      )}

      <div className="mt-12">
        <ShareBar
          path={`/fathers/${person.id}`}
          title={`${person.name} — Patristic Lineage`}
        />
      </div>
    </div>
  );
}

