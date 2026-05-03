import Link from "next/link";
import type { Metadata } from "next";
import { pickContent, parseIsoDate, isoDate, addDays } from "@/lib/picker";
import { dateRange } from "@/lib/dates";
import SubscribeForm from "@/components/SubscribeForm";
import ShareBar from "@/components/ShareBar";
import { eventPath, eventSections, relatedPeople } from "@/lib/events";
import { firstSentenceSafe, personHighlights } from "@/lib/person-highlights";

export const dynamic = "force-dynamic";

const ERA_LABEL: Record<string, string> = {
  apostle: "Apostles",
  "apostolic-father": "Apostolic Fathers",
  apologist: "Apologists",
  "ante-nicene": "Ante-Nicene",
  nicene: "Nicene",
  "post-nicene": "Post-Nicene",
  "desert-father": "Desert Fathers",
};

const ERA_SLUG: Record<string, string> = {
  apostle: "apostolic",
  "apostolic-father": "apostolic-fathers",
  apologist: "apologists",
  "ante-nicene": "ante-nicene",
  nicene: "nicene",
  "post-nicene": "post-nicene",
  "desert-father": "desert-fathers",
};

const ERA_SUMMARY: Record<string, string> = {
  apostle:
    "This is the generation that touched Jesus and carried the gospel from Jerusalem into the wider Roman world.",
  "apostolic-father":
    "This is the generation that received the faith from the apostles and had to hand it on without them.",
  apologist:
    "This is when Christians began answering outsiders in public, before emperors, philosophers, Jews, pagans, and heretics.",
  "ante-nicene":
    "This is the church before Constantine and Nicaea: growing under persecution and forming its canon, creed, and theological language.",
  nicene:
    "This is the age of the great councils, when the church settled durable language for the Trinity and the person of Christ.",
  "post-nicene":
    "This is the aftermath of Chalcedon and the collapse of the Western empire, carried by bishops, monasteries, and pastoral institutions.",
  "desert-father":
    "This is where monasticism becomes a major Christian vocation: prayer, fasting, silence, and spiritual fatherhood in the wilderness.",
};

const MONTH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatMonthDay(mmdd?: string): string | null {
  if (!mmdd) return null;
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd);
  if (!m) return null;
  return `${Number(m[2])} ${MONTH[Number(m[1]) - 1]}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const { d } = await searchParams;
  const date = parseIsoDate(d) ?? new Date();
  const c = pickContent(date);
  const title =
    c.type === "father" || c.type === "heretic" || c.type === "quote"
      ? c.person.name
      : c.type === "council" || c.type === "schism"
        ? `${c.anniversary.title} (${c.anniversary.year})`
        : `${ERA_LABEL[c.era]} — this week`;
  const desc =
    c.type === "father"
      ? c.person.why_matters ?? c.person.short_bio
      : c.type === "heretic"
        ? c.anniversary?.blurb ?? c.person.short_bio
        : c.type === "council" || c.type === "schism"
          ? c.anniversary.blurb
          : c.type === "quote"
            ? `"${c.quote.text}" — ${c.person.name}`
            : `${ERA_LABEL[c.era]}, four representative figures.`;
  return { title: `Today: ${title}`, description: desc };
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const date = parseIsoDate(d) ?? new Date();
  const today = new Date();
  const isToday = isoDate(date) === isoDate(today);

  const content = pickContent(date);
  const yesterday = addDays(date, -1);
  const tomorrow = addDays(date, 1);

  const eyebrow =
    content.type === "father"
      ? content.reason === "feast-catholic" || content.reason === "feast-orthodox"
        ? "Feast Day"
        : "Father of the Day"
      : content.type === "council"
        ? "Council Anniversary"
        : content.type === "schism"
          ? "Schism Anniversary"
          : content.type === "heretic"
            ? "Heresy Condemnation"
            : content.type === "era"
              ? "Era Spotlight"
              : "From the Fathers";

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <div className="flex items-baseline justify-between mb-4">
        <Link href="/" className="text-sm text-ink/60 hover:text-accent">← Lineage</Link>
        <span className="text-xs text-ink/50 uppercase tracking-wide">
          {isToday ? eyebrow : `${eyebrow} for`} · {formatLongDate(date)}
        </span>
      </div>

      {content.type === "father" ? <FatherView person={content.person} reason={content.reason} /> : null}
      {content.type === "council" || content.type === "schism" ? (
        <AnniversaryView kind={content.type} anniv={content.anniversary} />
      ) : null}
      {content.type === "heretic" ? (
        <HereticView person={content.person} anniv={content.anniversary} />
      ) : null}
      {content.type === "era" ? <EraView era={content.era} figures={content.figures} /> : null}
      {content.type === "quote" ? <QuoteView quote={content.quote} person={content.person} /> : null}

      <div className="flex flex-wrap gap-3 mt-10 mb-6">
        <Link href={`/today?d=${isoDate(yesterday)}`} className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm">
          ← Yesterday
        </Link>
        <Link href={`/today?d=${isoDate(tomorrow)}`} className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm">
          Tomorrow →
        </Link>
        <Link href="/sent" className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm">
          Browse past sends →
        </Link>
      </div>

      <ShareBar
        path={`/today?d=${isoDate(date)}`}
        title={`${eyebrow} · ${formatLongDate(date)} — Patristic Lineage`}
      />

      <div className="mt-8">
        <SubscribeForm />
      </div>
    </article>
  );
}

function FatherView({
  person,
  reason,
}: {
  person: import("@/lib/schema").Person;
  reason: "override" | "feast-catholic" | "feast-orthodox" | "rotation";
}) {
  const dr = dateRange(person);
  const primaries = person.citations?.filter((c) => c.kind === "primary") ?? [];
  // Show why_matters if present; otherwise fall back to short_bio. When both
  // exist and differ, we already lean on why_matters as the longer piece.
  const body = person.why_matters ?? person.short_bio;
  const showShortAsLede = !!person.why_matters && person.short_bio && person.short_bio !== person.why_matters;
  const cat = formatMonthDay(person.feast_day_catholic);
  const orth = formatMonthDay(person.feast_day_orthodox);
  const feast =
    cat && orth && cat !== orth
      ? `Feast: ${cat} (Catholic) · ${orth} (Orthodox)`
      : cat
        ? `Feast: ${cat}${orth ? "" : " (Catholic)"}`
        : orth
          ? `Feast: ${orth} (Orthodox)`
          : null;

  void reason;
  const highlights = personHighlights(person);

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{person.name}</h1>
        <p className="text-ink/60 italic" title={dr.explanation || undefined}>
          {dr.text}
          {person.see ? <> · Bishop of {person.see}</> : null}
          {!person.see && person.birth_place ? <> · {person.birth_place}</> : null}
        </p>
        {person.alt_names && person.alt_names.length > 0 ? (
          <p className="mt-1 text-sm text-ink/55">Also known as {person.alt_names.join(" · ")}</p>
        ) : null}
        {feast ? <p className="mt-1 text-sm text-accent/80">{feast}</p> : null}
      </header>

      {person.image_url ? (
        <div className="mb-8 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={person.image_url} alt={person.name} className="w-full h-[420px] object-cover" style={{ objectPosition: "center 8%" }} />
          {person.image_credit ? <div className="px-3 py-1.5 text-[11px] text-ink/50">{person.image_credit}</div> : null}
        </div>
      ) : null}

      {showShortAsLede ? (
        <p className="text-xl text-ink/75 mb-6 leading-snug">{person.short_bio}</p>
      ) : null}

      {highlights.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">Highlights</h2>
          <dl className="grid sm:grid-cols-2 gap-4">
            {highlights.map((item) => (
              <div key={item.label} className="border-l-2 border-accent/35 pl-3">
                <dt className="text-[10px] uppercase tracking-wider text-ink/45 mb-1">{item.label}</dt>
                <dd className="text-ink/85">
                  {item.href ? (
                    <Link href={item.href} className="hover:text-accent underline decoration-ink/20 underline-offset-2">
                      {item.value}
                    </Link>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div className="prose-like text-lg mb-8">
        {body.split(/\n\n+/).map((para, i) => <p key={i} className="mb-4">{para}</p>)}
      </div>

      {person.works && person.works.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">Notable works</h2>
          <ul className="space-y-1 text-ink/80">
            {person.works.slice(0, 6).map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ink/40">·</span>
                <span>
                  <span className="italic">{w.title}</span>
                  {w.year ? <span className="text-ink/55"> · {w.year}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {primaries.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">Primary sources</h2>
          <ul className="space-y-1 text-ink/80 text-sm">
            {primaries.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ink/40">·</span>
                <span>{c.source}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 mt-10">
        <Link href={`/fathers/${person.id}`} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm">
          Open {person.name}&rsquo;s full page →
        </Link>
        {person.wikipedia_url ? (
          <a
            href={person.wikipedia_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
          >
            Wikipedia ↗
          </a>
        ) : null}
      </div>
    </>
  );
}

function AnniversaryView({
  kind,
  anniv,
}: {
  kind: "council" | "schism";
  anniv: import("@/lib/schema").Anniversary;
}) {
  const people = relatedPeople(anniv);
  const sections = eventSections(anniv);
  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">{kind === "schism" ? "Schism" : "Council"} · Today in {anniv.year}</p>
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{anniv.title}</h1>
      </header>
      <p className="text-lg mb-6 leading-relaxed">{anniv.blurb}</p>
      {anniv.key_line ? (
        <p className="font-serif text-2xl text-ink border-l-4 border-accent/50 pl-4 mb-8">
          {anniv.key_line}
        </p>
      ) : null}
      {anniv.highlights?.length ? (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">Highlights</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {anniv.highlights.map((item, i) => (
              <li key={i} className="border-l-2 border-accent/35 pl-3 text-ink/80">{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {sections.length ? (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">How it happened</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {sections.slice(0, 4).map((section) => (
              <div key={section.title} className="border-t border-ink/15 pt-3">
                <h3 className="font-serif text-lg text-ink mb-1">{section.title}</h3>
                <p className="text-sm text-ink/75">{section.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {people.length ? (
        <div className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">People in the story</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {people.map((p) => (
              <Link key={p.id} href={`/fathers/${p.id}`} className="flex gap-3 p-3 border border-ink/15 rounded hover:border-accent transition-colors">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ objectPosition: "center 8%" }} />
                ) : (
                  <span className="w-12 h-12 rounded-full bg-ink/10 shrink-0 flex items-center justify-center font-serif text-ink/50">{p.name.charAt(0)}</span>
                )}
                <span>
                  <span className="block font-serif text-ink">{p.name}</span>
                  <span className="block text-xs text-ink/60">{p.short_bio}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {anniv.citation ? (
        <blockquote className="border-l-4 border-accent/60 bg-ink/5 pl-5 py-3 my-8 italic text-ink/80 text-sm">
          {anniv.citation}
        </blockquote>
      ) : null}
      <Link href={eventPath(anniv)} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
        Open the full event page →
      </Link>
    </>
  );
}

function HereticView({
  person,
  anniv,
}: {
  person: import("@/lib/schema").Person;
  anniv?: import("@/lib/schema").Anniversary;
}) {
  const blurb = anniv?.blurb ?? person.short_bio;
  const year = anniv?.year ?? null;
  const sections = anniv ? eventSections(anniv) : [];
  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">Heresy Condemnation{year ? ` · ${year}` : ""}</p>
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{anniv?.title ?? person.name}</h1>
        <p className="text-ink/60 italic">{person.born ?? "?"}–{person.died ?? "?"}</p>
      </header>
      {person.image_url ? (
        <div className="mb-8 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={person.image_url} alt={person.name} className="w-full h-[360px] object-cover" style={{ objectPosition: "center 8%" }} />
        </div>
      ) : null}
      <p className="text-lg mb-8 leading-relaxed">{blurb}</p>
      {sections.length ? (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">How it happened</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {sections.slice(0, 4).map((section) => (
              <div key={section.title} className="border-t border-ink/15 pt-3">
                <h3 className="font-serif text-lg text-ink mb-1">{section.title}</h3>
                <p className="text-sm text-ink/75">{section.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {anniv ? (
          <Link href={eventPath(anniv)} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
            Open the full event page →
          </Link>
        ) : null}
        <Link href={`/fathers/${person.id}`} className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm inline-block">
          Open {person.name}'s page →
        </Link>
      </div>
    </>
  );
}

function EraView({
  era,
  figures,
}: {
  era: import("@/lib/schema").TraditionStatus;
  figures: import("@/lib/schema").Person[];
}) {
  const slug = ERA_SLUG[era] ?? era;
  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">This week</p>
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{ERA_LABEL[era]}</h1>
        <p className="text-lg text-ink/70 max-w-2xl">{ERA_SUMMARY[era]}</p>
      </header>
      <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">Four people to know</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {figures.map((p) => (
          <Link key={p.id} href={`/fathers/${p.id}`} className="flex gap-4 p-4 border border-ink/15 rounded hover:border-accent transition-colors">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-full object-cover shrink-0" style={{ objectPosition: "center 8%" }} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-ink/10 shrink-0 flex items-center justify-center font-serif text-xl text-ink/50">{p.name.charAt(0)}</div>
            )}
            <div>
              <div className="font-serif text-lg">{p.name}</div>
              <div className="text-xs text-ink/55">{p.born ?? "?"}–{p.died ?? "?"}</div>
              <div className="text-sm text-ink/70 mt-1 line-clamp-3">{p.short_bio}</div>
            </div>
          </Link>
        ))}
      </div>
      <Link href={`/eras/${slug}`} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
        Open the {ERA_LABEL[era]} page →
      </Link>
    </>
  );
}

function QuoteView({
  quote,
  person,
}: {
  quote: import("@/lib/schema").Quote;
  person: import("@/lib/schema").Person;
}) {
  const context = firstSentenceSafe(person.why_matters ?? person.short_bio, 240);
  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">From the Fathers</p>
      </header>
      <blockquote className="font-serif text-3xl italic leading-snug text-ink mb-6">
        “{quote.text}”
      </blockquote>
      <p className="mb-2">— <Link href={`/fathers/${person.id}`} className="hover:text-accent">{person.name}</Link></p>
      <p className="text-sm text-ink/60 italic mb-10">{quote.source}{quote.translation ? ` · ${quote.translation}` : ""}</p>
      {context ? (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">Why {person.name.split(" of ")[0]} matters</h2>
          <p className="text-lg leading-relaxed">{context}</p>
        </section>
      ) : null}
      {person.works?.[0] ? (
        <section className="mb-8 border-l-2 border-accent/35 pl-4">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-1">Best first read</h2>
          <p className="font-serif text-xl text-ink">{person.works[0].title}</p>
          {person.works[0].description ? <p className="text-sm text-ink/70 mt-1">{person.works[0].description}</p> : null}
        </section>
      ) : null}
      <Link href={`/fathers/${person.id}`} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
        Read more about {person.name} →
      </Link>
    </>
  );
}
