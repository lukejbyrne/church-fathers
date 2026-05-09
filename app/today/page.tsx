import Link from "next/link";
import type { Metadata } from "next";
import { pickContent, parseIsoDate, isoDate, addDays } from "@/lib/picker";
import { dateRange } from "@/lib/dates";
import SubscribeForm from "@/components/SubscribeForm";
import ShareBar from "@/components/ShareBar";
import BookFeature from "@/components/BookFeature";
import { getBookForContent } from "@/lib/books";
import { eraForTraditionStatus } from "@/lib/eras";
import { quoteIssueTitle, quotePreviewText } from "@/lib/quote-copy";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const MONTH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const REGION_LABEL: Record<string, string> = {
  palestine: "Palestine",
  syria: "Syria",
  "asia-minor": "Asia Minor",
  egypt: "Egypt",
  west: "Roman West",
  gaul: "Gaul",
  africa: "North Africa",
  east: "Eastern empire",
  other: "Other",
};

function formatMonthDay(mmdd?: string): string | null {
  if (!mmdd) return null;
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd);
  if (!m) return null;
  return `${Number(m[2])} ${MONTH[Number(m[1]) - 1]}`;
}

function formatRegion(region?: string): string | null {
  if (!region) return null;
  return REGION_LABEL[region] ?? region.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const { d } = await searchParams;
  const requestedDate = parseIsoDate(d);
  const hasDateParam = Boolean(d);
  const date = requestedDate ?? new Date();
  const c = pickContent(date);
  const title =
    c.type === "quote"
      ? quoteIssueTitle(c.quote, c.person)
      : c.type === "father" || c.type === "heretic"
      ? c.person.name
      : c.type === "council" || c.type === "schism"
        ? `${c.anniversary.title} (${c.anniversary.year})`
        : `${eraForTraditionStatus(c.era).label} — this week`;
  const desc =
    c.type === "father"
      ? c.person.why_matters ?? c.person.short_bio
      : c.type === "heretic"
        ? c.anniversary?.blurb ?? c.person.short_bio
        : c.type === "council" || c.type === "schism"
          ? c.anniversary.blurb
          : c.type === "quote"
            ? quotePreviewText(c.quote, c.person)
            : eraForTraditionStatus(c.era).blurb;
  const pageTitle = `Today: ${title}`;
  const url = requestedDate ? canonicalUrl(`/today?d=${isoDate(requestedDate)}`) : canonicalUrl("/today");
  return {
    title: pageTitle,
    description: desc,
    alternates: { canonical: url },
    robots: hasDateParam ? { index: false, follow: true } : undefined,
    openGraph: {
      title: pageTitle,
      description: desc,
      url,
      type: "article",
    },
  };
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
  const bookOfDay = getBookForContent(content, date);
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
  const shareTitle =
    content.type === "quote"
      ? `${quoteIssueTitle(content.quote, content.person)} — Patristic Lineage`
      : `${eyebrow} · ${formatLongDate(date)} — Patristic Lineage`;

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

      <BookFeature
        book={bookOfDay}
        eyebrow="Daily reading"
        title="Book of the day"
        className="px-0 mt-10"
      />

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
        title={shareTitle}
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
          <img src={person.image_url} alt={person.name} className="w-full h-[360px] object-cover" style={{ objectPosition: "center 8%" }} />
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
  const eraDef = eraForTraditionStatus(era);
  const slug = eraDef.slug;
  const label = eraDef.label;
  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">This week</p>
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{label}</h1>
        <p className="text-ink/60 italic">
          {eraDef.yearLabel} · {eraDef.blurb}
        </p>
      </header>

      <div className="prose-like text-lg mb-8">
        <p className="mb-4">{eraDef.intro[0]}</p>
      </div>

      {eraDef.decided.length > 0 ? (
        <section className="mb-10 border border-accent/15 bg-accent/5 rounded p-5">
          <h2 className="text-sm uppercase tracking-widest text-accent/80 mb-3">Why it matters</h2>
          <ul className="space-y-2 text-ink/80">
            {eraDef.decided.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-accent">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
        Open the {label} page →
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
  const title = quoteIssueTitle(quote, person);
  const dr = dateRange(person);
  const about = person.why_matters ?? person.short_bio;
  const region = formatRegion(person.region);

  return (
    <>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">Quote in context</p>
        <h1 className="font-serif text-5xl mt-2 mb-3 text-ink">{title}</h1>
        <p className="text-ink/60 italic">
          {person.name} · {quote.source}{quote.translation ? ` · ${quote.translation}` : ""}
        </p>
      </header>
      <blockquote className="font-serif text-3xl italic leading-snug text-ink mb-6">
        “{quote.text}”
      </blockquote>
      <p className="mb-8">— <Link href={`/fathers/${person.id}`} className="hover:text-accent">{person.name}</Link></p>

      {quote.context || quote.impact ? (
        <section className="mb-10 border border-accent/15 bg-accent/5 rounded p-5">
          {quote.context ? (
            <>
              <h2 className="text-sm uppercase tracking-widest text-accent/80 mb-3">Plain English</h2>
              <p className="text-lg leading-relaxed mb-5">{quote.context}</p>
            </>
          ) : null}
          {quote.impact ? (
            <>
              <h2 className="text-sm uppercase tracking-widest text-accent/80 mb-3">Why it matters</h2>
              <p className="text-lg leading-relaxed">{quote.impact}</p>
            </>
          ) : null}
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-4">Who said it</h2>
        <div className="flex gap-5 items-start">
          {person.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.image_url} alt={person.name} className="w-20 h-20 rounded-full object-cover shrink-0 border border-ink/10" style={{ objectPosition: "center 8%" }} />
          ) : null}
          <div>
            <h3 className="font-serif text-2xl text-ink mb-1">{person.name}</h3>
            <p className="text-sm text-ink/60 mb-3" title={dr.explanation || undefined}>
              {dr.text}
              {person.birth_place ? <> · Born in {person.birth_place}</> : null}
              {region ? <> · {region}</> : null}
            </p>
            <p className="leading-relaxed">{about}</p>
          </div>
        </div>
      </section>

      <Link href={`/fathers/${person.id}`} className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm inline-block">
        Read more about {person.name} →
      </Link>
    </>
  );
}
