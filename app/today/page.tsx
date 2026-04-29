import Link from "next/link";
import type { Metadata } from "next";
import { pickContent, parseIsoDate, isoDate, addDays } from "@/lib/picker";
import { dateRange } from "@/lib/dates";
import SubscribeForm from "@/components/SubscribeForm";
import ShareBar from "@/components/ShareBar";

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
        <HereticView person={content.person} blurb={content.anniversary?.blurb ?? content.person.short_bio} year={content.anniversary?.year ?? null} />
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
  const primary = person.citations?.find((c) => c.kind === "primary");
  const body = person.why_matters ?? person.short_bio;
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

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{person.name}</h1>
        <p className="text-ink/60 italic" title={dr.explanation || undefined}>
          {dr.text}
          {person.see ? <> · Bishop of {person.see}</> : null}
          {!person.see && person.birth_place ? <> · {person.birth_place}</> : null}
        </p>
        {feast ? <p className="mt-1 text-sm text-accent/80">{feast}</p> : null}
      </header>

      {person.image_url ? (
        <div className="mb-8 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={person.image_url} alt={person.name} className="w-full h-[420px] object-cover" style={{ objectPosition: "center 18%" }} />
          {person.image_credit ? <div className="px-3 py-1.5 text-[11px] text-ink/50">{person.image_credit}</div> : null}
        </div>
      ) : null}

      <div className="prose-like text-lg mb-8">
        {body.split(/\n\n+/).map((para, i) => <p key={i} className="mb-4">{para}</p>)}
      </div>

      {primary ? (
        <blockquote className="border-l-4 border-accent/60 bg-ink/5 pl-5 py-3 my-8 italic text-ink/80">
          <p className="mb-1">Primary source for this figure.</p>
          <cite className="not-italic text-sm text-ink/60">— {primary.source}</cite>
        </blockquote>
      ) : null}

      <div className="flex flex-wrap gap-3 mt-10">
        <Link href={`/fathers/${person.id}`} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm">
          See the full chain to Jesus →
        </Link>
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
  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">{kind === "schism" ? "Schism" : "Council"} · Today in {anniv.year}</p>
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{anniv.title}</h1>
      </header>
      <p className="text-lg mb-8 leading-relaxed">{anniv.blurb}</p>
      {anniv.related_person_ids?.length ? (
        <div className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">Figures involved</h2>
          <ul className="space-y-1">
            {anniv.related_person_ids.map((id) => (
              <li key={id}>
                <Link href={`/fathers/${id}`} className="hover:text-accent">{id.replace(/-/g, " ")}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {anniv.citation ? (
        <blockquote className="border-l-4 border-accent/60 bg-ink/5 pl-5 py-3 my-8 italic text-ink/80 text-sm">
          {anniv.citation}
        </blockquote>
      ) : null}
      <Link href={kind === "schism" ? "/schisms" : "/eras"} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
        Browse the {kind === "schism" ? "schisms" : "eras"} →
      </Link>
    </>
  );
}

function HereticView({
  person,
  blurb,
  year,
}: {
  person: import("@/lib/schema").Person;
  blurb: string;
  year: number | null;
}) {
  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">Heresy Condemnation{year ? ` · ${year}` : ""}</p>
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{person.name}</h1>
        <p className="text-ink/60 italic">{person.born ?? "?"}–{person.died ?? "?"}</p>
      </header>
      {person.image_url ? (
        <div className="mb-8 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={person.image_url} alt={person.name} className="w-full h-[360px] object-cover" style={{ objectPosition: "center 18%" }} />
        </div>
      ) : null}
      <p className="text-lg mb-8 leading-relaxed">{blurb}</p>
      <Link href={`/fathers/${person.id}`} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
        Open {person.name}'s page →
      </Link>
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
      </header>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {figures.map((p) => (
          <Link key={p.id} href={`/fathers/${p.id}`} className="flex gap-4 p-4 border border-ink/15 rounded hover:border-accent transition-colors">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-full object-cover shrink-0" style={{ objectPosition: "center 18%" }} />
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
      <Link href={`/fathers/${person.id}`} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
        Read more about {person.name} →
      </Link>
    </>
  );
}
