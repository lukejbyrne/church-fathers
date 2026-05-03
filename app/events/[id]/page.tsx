import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { dateRange } from "@/lib/dates";
import { eventPath, eventSections, eventTitle, EVENT_KIND_DESCRIPTION, EVENT_KIND_LABEL, getEvent, relatedPeople } from "@/lib/events";
import { getAnniversaries } from "@/lib/data";
import ShareBar from "@/components/ShareBar";

const MONTH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatMonthDay(mmdd: string): string {
  const [month, day] = mmdd.split("-").map(Number);
  return `${day} ${MONTH[month - 1]}`;
}

export function generateStaticParams() {
  return getAnniversaries().map((event) => ({ id: event.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = getEvent(id);
  if (!event) return {};
  return {
    title: `${event.title} (${event.year}) — Patristic Lineage`,
    description: event.why_it_matters ?? event.blurb,
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = getEvent(id);
  if (!event) notFound();

  const people = relatedPeople(event);
  const sections = eventSections(event);

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <Link href="/today" className="text-sm text-ink/60 hover:text-accent">
          ← Today
        </Link>
        <ShareBar
          path={eventPath(event)}
          title={`${event.title} — Patristic Lineage`}
          compact
        />
      </div>

      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-accent/80 mb-2">
          {EVENT_KIND_LABEL[event.kind]} · {event.year} · {formatMonthDay(event.date)}
        </p>
        <h1 className="font-serif text-5xl mt-2 mb-3 text-ink leading-tight">
          {event.title}
        </h1>
        <p className="text-lg text-ink/70 max-w-3xl">
          {event.blurb}
        </p>
      </header>

      <section className="mb-10 border border-ink/10 rounded-md bg-ink/5 px-5 py-4">
        <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">
          At a glance
        </h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-ink/50">Type</dt>
            <dd className="text-ink/85">{EVENT_KIND_LABEL[event.kind]}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Date remembered</dt>
            <dd className="text-ink/85">{formatMonthDay(event.date)}, AD {event.year}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink/50">What kind of event is this?</dt>
            <dd className="text-ink/85">{EVENT_KIND_DESCRIPTION[event.kind]}</dd>
          </div>
          {event.key_line ? (
            <div className="sm:col-span-2 border-t border-ink/10 pt-3">
              <dt className="text-ink/50">Key line</dt>
              <dd className="font-serif text-xl text-ink mt-1">{event.key_line}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {event.highlights && event.highlights.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-ink mb-3">Highlights</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {event.highlights.map((item, i) => (
              <li key={i} className="border-l-2 border-accent/35 pl-3 text-ink/80">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="font-serif text-2xl text-ink mb-4">How it happened</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-ink/15 pt-3">
              <h3 className="text-sm uppercase tracking-widest text-ink/55 mb-2">
                {section.title}
              </h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </section>

      {people.length > 0 ? (
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-ink mb-4">People in the story</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {people.map((p) => (
              <Link
                key={p.id}
                href={`/fathers/${p.id}`}
                className="group flex gap-4 p-4 border border-ink/15 rounded-md hover:border-accent transition-colors"
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-16 h-16 rounded-full object-cover shrink-0 border border-ink/10"
                    style={{ objectPosition: "center 8%" }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-ink/10 shrink-0 flex items-center justify-center font-serif text-xl text-ink/50">
                    {p.name.charAt(0)}
                  </div>
                )}
                <span className="min-w-0">
                  <span className="block font-serif text-lg text-ink group-hover:text-accent">
                    {p.name}
                  </span>
                  <span className="block text-xs text-ink/55">{dateRange(p).text}</span>
                  <span className="block text-sm text-ink/70 mt-1 line-clamp-3">
                    {p.short_bio}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {event.citation ? (
        <section className="mb-10">
          <h2 className="text-sm uppercase tracking-widest text-ink/60 mb-3">
            Source
          </h2>
          <blockquote className="border-l-4 border-accent/60 bg-ink/5 pl-5 py-3 italic text-ink/80 text-sm">
            {event.citation}
          </blockquote>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 mt-12 pt-8 border-t border-ink/10">
        <Link
          href="/today"
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
        >
          Today's email
        </Link>
        <Link
          href="/schisms"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Schism timeline
        </Link>
        <Link
          href="/eras"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Eras
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: eventTitle(event),
            description: event.why_it_matters ?? event.blurb,
            url: eventPath(event),
            datePublished: `${event.year.toString().padStart(4, "0")}-${event.date}`,
          }),
        }}
      />
    </article>
  );
}
