import Link from "next/link";
import type { Metadata } from "next";
import { featuredOfDay, parseIsoDate, isoDate, addDays } from "@/lib/featured";
import { dateRange } from "@/lib/dates";
import SubscribeForm from "@/components/SubscribeForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const { d } = await searchParams;
  const date = parseIsoDate(d) ?? new Date();
  const person = featuredOfDay(date);
  return {
    title: `Father of the Day: ${person.name}`,
    description: person.why_matters ?? person.short_bio,
  };
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
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

  const person = featuredOfDay(date);
  const yesterday = addDays(date, -1);
  const tomorrow = addDays(date, 1);
  const tomorrowPerson = featuredOfDay(tomorrow);

  const dr = dateRange(person);
  const primary = person.citations?.find((c) => c.kind === "primary");
  const body = person.why_matters ?? person.short_bio;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <div className="flex items-baseline justify-between mb-4">
        <Link href="/" className="text-sm text-ink/60 hover:text-accent">
          ← Lineage
        </Link>
        <span className="text-xs text-ink/50 uppercase tracking-wide">
          {isToday ? "Father of the Day" : "Father for"} · {formatLongDate(date)}
        </span>
      </div>

      <header className="mb-8">
        <h1 className="font-serif text-5xl mt-2 mb-2 text-ink">{person.name}</h1>
        <p
          className="text-ink/60 italic"
          title={dr.explanation || undefined}
        >
          {dr.text}
          {person.see ? <> · Bishop of {person.see}</> : null}
          {!person.see && person.birth_place ? <> · {person.birth_place}</> : null}
        </p>
      </header>

      {person.image_url ? (
        <div className="mb-8 overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.image_url}
            alt={person.name}
            className="w-full h-[420px] object-cover"
            style={{ objectPosition: "center 18%" }}
          />
          {person.image_credit ? (
            <div className="px-3 py-1.5 text-[11px] text-ink/50">
              {person.image_credit}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="prose-like text-lg mb-8">
        {body.split(/\n\n+/).map((para, i) => (
          <p key={i} className="mb-4">
            {para}
          </p>
        ))}
      </div>

      {primary ? (
        <blockquote className="border-l-4 border-accent/60 bg-ink/5 pl-5 py-3 my-8 italic text-ink/80">
          <p className="mb-1">Primary source for this figure.</p>
          <cite className="not-italic text-sm text-ink/60">— {primary.source}</cite>
        </blockquote>
      ) : null}

      <div className="flex flex-wrap gap-3 mt-10 mb-12">
        <Link
          href={`/fathers/${person.id}`}
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
        >
          See the full chain to Jesus →
        </Link>
        <Link
          href={`/today?d=${isoDate(yesterday)}`}
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          ← Yesterday's Father
        </Link>
        <Link
          href={`/today?d=${isoDate(tomorrow)}`}
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Next: {tomorrowPerson.name} →
        </Link>
      </div>

      <SubscribeForm />
    </article>
  );
}
