import Link from "next/link";
import type { Metadata } from "next";
import { getAnniversaries } from "@/lib/data";
import { EVENT_KIND_LABEL, eventPath } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events — Patristic Lineage",
  description:
    "Councils, schisms, condemnations, and turning points featured in the Patristic Lineage daily emails.",
};

export default function EventsPage() {
  const events = getAnniversaries().slice().sort((a, b) => a.year - b.year || a.date.localeCompare(b.date));

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>
      <h1 className="font-serif text-5xl mt-4 mb-3 text-ink">Events</h1>
      <p className="text-ink/70 mb-10 max-w-2xl">
        Councils, schisms, condemnations, and turning points from the daily emails. Each page explains what happened, what was being argued, what changed, and why it mattered.
      </p>

      <div className="space-y-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={eventPath(event)}
            className="block border-l-4 border-accent/35 pl-4 py-2 hover:border-accent transition-colors"
          >
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="font-serif text-2xl text-ink hover:text-accent">{event.title}</h2>
              <span className="text-xs uppercase tracking-wider text-ink/45">
                {EVENT_KIND_LABEL[event.kind]} · AD {event.year}
              </span>
            </div>
            <p className="text-sm text-ink/70 mt-1 line-clamp-2">{event.why_it_matters ?? event.blurb}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}
