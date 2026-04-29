import Link from "next/link";
import type { Metadata } from "next";
import { pickContent, isoDate, type Content } from "@/lib/picker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "What lands in your inbox each day — feast days, council anniversaries, schism dates, era spotlights, and primary-source quotes across the patristic year.",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TYPE_STYLE: Record<Content["type"], { label: string; cell: string; dot: string }> = {
  father: {
    label: "Father",
    cell: "bg-accent/5 border-accent/20 hover:border-accent/60",
    dot: "bg-accent",
  },
  council: {
    label: "Council",
    cell: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
    dot: "bg-yellow-600",
  },
  schism: {
    label: "Schism",
    cell: "bg-rose-50 border-rose-200 hover:border-rose-400",
    dot: "bg-rose-700",
  },
  heretic: {
    label: "Heretic",
    cell: "bg-slate-100 border-slate-300 hover:border-slate-500",
    dot: "bg-slate-700",
  },
  era: {
    label: "Era",
    cell: "bg-stone-100 border-stone-300 hover:border-stone-500",
    dot: "bg-stone-700",
  },
  quote: {
    label: "Quote",
    cell: "bg-ink/5 border-ink/15 hover:border-ink/40",
    dot: "bg-ink/60",
  },
};

function titleOf(c: Content): string {
  switch (c.type) {
    case "father":
      return c.person.name;
    case "council":
    case "schism":
      return c.anniversary.title;
    case "heretic":
      return c.person.name;
    case "era":
      return `${c.era.replace(/-/g, " ")}`;
    case "quote":
      return `${c.person.name}`;
  }
}

function isFeastFather(c: Content): boolean {
  return c.type === "father" && (c.reason === "feast-catholic" || c.reason === "feast-orthodox");
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const todayIso = isoDate(today);
  const year = sp.y ? parseInt(sp.y, 10) : today.getUTCFullYear();
  const validYear = Number.isFinite(year) && year >= 2025 && year <= 2030 ? year : today.getUTCFullYear();

  // Build 12 months for the chosen year.
  const months = Array.from({ length: 12 }, (_, m) => {
    const days: { iso: string; day: number; content: Content; isToday: boolean }[] = [];
    const lastDay = new Date(Date.UTC(validYear, m + 1, 0)).getUTCDate();
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(Date.UTC(validYear, m, d));
      const iso = isoDate(date);
      days.push({
        iso,
        day: d,
        content: pickContent(date),
        isToday: iso === todayIso,
      });
    }
    return { name: MONTH_NAMES[m], index: m, days };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-ink/85">
      <div className="mb-6">
        <Link href="/today" className="text-sm text-ink/60 hover:text-accent">← Today</Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
        <div>
          <h1 className="font-serif text-4xl text-ink">Patristic calendar</h1>
          <p className="text-ink/65 mt-2 max-w-2xl">
            Each day shows what we send to subscribers — feast day, council or schism anniversary,
            era spotlight, or a primary-source quote. Click any day to read it on the web.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/calendar?y=${validYear - 1}`}
            className="px-3 py-1.5 border border-ink/20 rounded hover:border-accent"
          >
            ← {validYear - 1}
          </Link>
          <span className="px-3 py-1.5 font-serif text-lg">{validYear}</span>
          <Link
            href={`/calendar?y=${validYear + 1}`}
            className="px-3 py-1.5 border border-ink/20 rounded hover:border-accent"
          >
            {validYear + 1} →
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8 text-xs text-ink/65">
        {(Object.entries(TYPE_STYLE) as [Content["type"], (typeof TYPE_STYLE)[Content["type"]]][]).map(
          ([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${v.dot}`} />
              {v.label}
            </span>
          )
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full ring-2 ring-accent" />
          Feast day
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((m) => (
          <section key={m.name} className="border border-ink/10 rounded">
            <header className="px-3 py-2 border-b border-ink/10 bg-ink/5 flex items-baseline justify-between">
              <h2 className="font-serif text-lg text-ink">{m.name}</h2>
              <span className="text-[10px] uppercase tracking-widest text-ink/45">{validYear}</span>
            </header>
            <ol className="divide-y divide-ink/5">
              {m.days.map((d) => {
                const style = TYPE_STYLE[d.content.type];
                const feast = isFeastFather(d.content);
                return (
                  <li key={d.iso}>
                    <Link
                      href={`/today?d=${d.iso}`}
                      className={`flex items-center gap-3 px-3 py-1.5 text-sm hover:bg-ink/5 transition-colors ${
                        d.isToday ? "bg-accent/10" : ""
                      }`}
                    >
                      <span
                        className={`shrink-0 w-7 text-right font-mono text-xs ${
                          d.isToday ? "text-accent font-bold" : "text-ink/50"
                        }`}
                      >
                        {d.day}
                      </span>
                      <span
                        className={`shrink-0 w-2 h-2 rounded-full ${style.dot} ${
                          feast ? "ring-2 ring-accent ring-offset-1 ring-offset-parchment" : ""
                        }`}
                        title={feast ? "Feast day" : style.label}
                      />
                      <span className="truncate text-ink/80">{titleOf(d.content)}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-ink/50 italic">
        Picker priority: manual override → feast day (Catholic, then Orthodox) → council / schism /
        condemnation anniversary → era spotlight (Mondays) → primary-source quote rotation.
      </p>
    </div>
  );
}

