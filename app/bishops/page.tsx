import Link from "next/link";
import { getPeople } from "@/lib/data";
import { dateRange } from "@/lib/dates";
import type { Person, Region } from "@/lib/schema";

export const metadata = {
  title: "Bishops & their sees — Patristic Lineage",
  description:
    "Which bishops served which sees, and when. Apostolic succession proper, grouped by city, ordered by date.",
};

const REGION_LABEL: Record<Region, string> = {
  east: "East",
  west: "West",
  syria: "Syria",
  egypt: "Egypt",
  "asia-minor": "Asia Minor",
  gaul: "Gaul",
  africa: "Africa",
  palestine: "Palestine",
  other: "Other",
};

function sortKey(p: Person): number {
  return p.born ?? p.died ?? 9999;
}

function slugifySee(see: string): string {
  return see
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type SeeGroup = {
  see: string;
  region: Region;
  bishops: Person[];
  earliest: number;
};

export default function BishopsPage() {
  const people = getPeople();
  const bishops = people.filter((p) => p.role.includes("bishop") && p.see);

  // Group by see
  const bySee = new Map<string, Person[]>();
  for (const b of bishops) {
    const key = b.see!;
    if (!bySee.has(key)) bySee.set(key, []);
    bySee.get(key)!.push(b);
  }

  const groups: SeeGroup[] = [];
  for (const [see, list] of bySee) {
    const sorted = list.slice().sort((a, b) => sortKey(a) - sortKey(b));
    // Region: take the most common across the bishops (almost always uniform)
    const regionCounts = new Map<Region, number>();
    for (const b of sorted) regionCounts.set(b.region, (regionCounts.get(b.region) ?? 0) + 1);
    const region = [...regionCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    groups.push({
      see,
      region,
      bishops: sorted,
      earliest: sortKey(sorted[0]),
    });
  }

  groups.sort((a, b) => a.earliest - b.earliest);

  const totalBishops = bishops.length;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>
      <h1 className="font-serif text-5xl mt-4 mb-3 text-ink">Bishops &amp; their sees</h1>
      <p className="text-ink/60 italic mb-8">
        Apostolic succession proper. {totalBishops} bishops across {groups.length} cities, ordered
        by the date of their earliest known occupant.
      </p>

      <section className="mb-10 space-y-4">
        <p>
          A <Link href="/start-here#glossary" className="underline hover:text-accent">see</Link> is
          the city a bishop is bishop of. "The see of Antioch" means the bishopric of Antioch — the
          office, the chair, the man who sits in it. <em>Episcopal succession</em> is the chain of
          men who have sat in that chair, each (in tradition) ordained by the previous. For
          Catholics and Orthodox this chain, traced back to one of the apostles, is what guarantees
          a bishop's authority.
        </p>
        <p>
          Five sees become especially load-bearing in the first six centuries — Rome, Alexandria,
          Antioch, Jerusalem, and (later) Constantinople — and by the fifth century these are
          formally called <em>patriarchates</em>. They were the cities with apostolic foundation
          stories (Peter at Rome and Antioch, Mark at Alexandria, James at Jerusalem) and the
          political weight to convene councils and adjudicate disputes. The other sees on this page
          are smaller links in the same chain: a Hilary at Poitiers, an Ambrose at Milan, a Bede's
          bishop at Lindisfarne.
        </p>
        <p>
          The honest caveat: many of these lists are reconstructions. First-century Roman and
          Antiochene successions were assembled by Irenaeus and Eusebius from sources (Hegesippus's
          notebooks) we no longer have. Where a bishop appears with no dates, the data simply
          doesn't survive — we show what's there and leave the gaps visible.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-serif text-2xl mb-3 text-ink">Index</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
          {groups.map((g) => (
            <li key={g.see}>
              <a href={`#${slugifySee(g.see)}`} className="hover:text-accent">
                {g.see}{" "}
                <span className="text-ink/40">({g.bishops.length})</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-14">
        {groups.map((g) => {
          const first = g.bishops[0];
          const last = g.bishops[g.bishops.length - 1];
          const firstYear = first.born ?? first.died;
          const lastYear = last.died ?? last.born;
          return (
            <section key={g.see} id={slugifySee(g.see)} className="scroll-mt-20">
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="font-serif text-3xl text-ink">{g.see}</h2>
                <span className="text-xs uppercase tracking-widest text-ink/50">
                  {REGION_LABEL[g.region]}
                </span>
              </div>
              <p className="text-sm text-ink/60 mb-5">
                {g.bishops.length} {g.bishops.length === 1 ? "bishop" : "bishops"}
                {firstYear != null && lastYear != null && (
                  <>
                    {", c. "}
                    {firstYear}–{lastYear}
                  </>
                )}
                .
              </p>

              <ol className="border-l-2 border-ink/15 pl-4 space-y-4">
                {g.bishops.map((b) => {
                  const dr = dateRange(b);
                  const isApostle = b.role.includes("apostle");
                  const nameClass = isApostle
                    ? "text-accent"
                    : "text-yellow-600";
                  const briefBio =
                    b.short_bio.length <= 180
                      ? b.short_bio
                      : b.short_bio.slice(0, b.short_bio.indexOf(".") + 1) || b.short_bio.slice(0, 180) + "…";
                  return (
                    <li key={b.id} className="flex gap-3 items-start">
                      {b.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.image_url}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover shrink-0 mt-1"
                          style={{ objectPosition: "center 8%" }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-ink/10 shrink-0 mt-1" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <Link
                            href={`/fathers/${b.id}`}
                            className={`font-serif text-lg ${nameClass} hover:underline`}
                          >
                            {b.name}
                          </Link>
                          <span
                            className="text-xs text-ink/55"
                            title={dr.explanation || undefined}
                          >
                            {dr.text}
                          </span>
                        </div>
                        <p className="text-sm text-ink/70 mt-0.5">{briefBio}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="mt-20 border-t border-ink/15 pt-8">
        <h2 className="font-serif text-2xl mb-3 text-ink">Limits of this view</h2>
        <p className="mb-3">
          What you see here is incomplete by design. Many bishops we have on file have no dates at
          all — they sit in their see but we can't place them in time. Whole stretches of some
          succession lists are missing because the only ancient source for them (often Hegesippus,
          via Eusebius) is lost. First- and second-century Roman and Antiochene successions in
          particular are reconstructions, not contemporary records.
        </p>
        <p className="mb-3">
          We also only show bishops <em>we already track on the site</em>. The full episcopal
          succession of Rome runs to the present day; this page stops, like the rest of the site,
          around AD 750. And sees as institutions are not nodes in our graph — only the men who
          held them.
        </p>
        <p>
          For how each link is graded (documented vs tradition vs disputed), and which lists we
          flag as honest weak spots, see the{" "}
          <Link href="/about" className="underline hover:text-accent">
            methodology page
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
