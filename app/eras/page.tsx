import Link from "next/link";
import type { Metadata } from "next";
import { getPeople } from "@/lib/data";
import { ERAS_DATA, ERA_ORDER, inEra } from "@/lib/eras";
import { dateRange } from "@/lib/dates";
import { getEraImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Eras of the Patristic Age",
  description:
    "Eight overlapping eras from Jesus to John of Damascus — each with its own controversies, councils, and major figures. Apostolic, Apostolic Fathers, Apologists, Ante-Nicene, Desert Fathers, Nicene, Post-Nicene, Early Medieval.",
};

const TIMELINE_MIN = 0;
const TIMELINE_MAX = 760;
const TIMELINE_W = 100; // percent

function pctFor(year: number) {
  return ((year - TIMELINE_MIN) / (TIMELINE_MAX - TIMELINE_MIN)) * TIMELINE_W;
}

const ERA_BAND_COLOR: Record<string, string> = {
  apostolic: "#8b1e2d",
  "apostolic-fathers": "#b08940",
  apologists: "#3a7a5e",
  "ante-nicene": "#3a7a5e",
  "desert-fathers": "#c9a227",
  nicene: "#3a4a7a",
  "post-nicene": "#5b3b8a",
  "early-medieval": "#7a4a2a",
};

export default function ErasIndex() {
  const all = getPeople();

  return (
    <article className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">← Lineage</Link>
      <h1 className="font-serif text-5xl mt-4 mb-3 text-ink">Eras of the Patristic Age</h1>
      <p className="text-ink/70 max-w-2xl mb-2 leading-relaxed">
        Seven hundred and fifty years, eight overlapping chapters. Each era has its own crisis,
        its own controversies, its own settlement. Click any band to dive in.
      </p>
      <p className="text-ink/55 text-sm italic mb-10 max-w-2xl">
        These divisions are conventional — historians draw the lines slightly differently. We
        follow the standard pattern, with one addition: the Desert Fathers run as a parallel
        movement from the late Ante-Nicene through the Post-Nicene, so they get their own band.
      </p>

      {/* Top-level visual: stacked era bands on a shared timeline */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl mb-1 text-ink">All eight at a glance</h2>
        <p className="text-ink/55 text-sm mb-6">
          Each band's width on the axis is its real year span. Bands stack vertically when they
          overlap (the Desert movement runs through three of the others).
        </p>
        <div className="relative border border-ink/10 rounded bg-parchment overflow-hidden">
          {/* AD year ruler at top */}
          <div className="relative h-6 border-b border-ink/10">
            {[0, 100, 200, 300, 400, 500, 600, 700].map((y) => (
              <div
                key={y}
                className="absolute top-0 bottom-0 border-l border-ink/15"
                style={{ left: `${pctFor(y)}%` }}
              >
                <span className="absolute top-0.5 left-1 text-[10px] text-ink/55 tabular-nums">
                  AD {y}
                </span>
              </div>
            ))}
          </div>
          {/* Era bands */}
          <div className="space-y-1.5 py-3 px-1">
            {ERA_ORDER.map((slug) => {
              const era = ERAS_DATA[slug];
              const left = pctFor(era.years[0]);
              const width = pctFor(era.years[1]) - pctFor(era.years[0]);
              const figureCount = all.filter((p) => inEra(p, era)).length;
              return (
                <Link
                  key={slug}
                  href={`/eras/${slug}`}
                  className="group relative block h-9"
                  style={{ marginLeft: `${left}%`, width: `${width}%` }}
                >
                  <div
                    className="absolute inset-0 rounded transition-all group-hover:brightness-95 group-hover:shadow-sm"
                    style={{
                      backgroundColor: `${ERA_BAND_COLOR[slug]}`,
                      opacity: 0.18,
                    }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ backgroundColor: ERA_BAND_COLOR[slug] }}
                  />
                  <div className="relative z-10 px-3 h-full flex items-center justify-between gap-2 overflow-hidden">
                    <span className="font-serif text-sm text-ink truncate group-hover:text-accent">
                      {era.label}
                    </span>
                    <span className="text-[10px] tabular-nums text-ink/55 shrink-0">
                      {era.years[0]}–{era.years[1]} · {figureCount}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-ink/45 italic mt-2">
          Number after the year range = figures we've placed in that era. Some figures appear in
          more than one (e.g. Athanasius bridges Ante-Nicene and Nicene).
        </p>
      </section>

      {/* Per-era summary cards */}
      <section className="space-y-8">
        {ERA_ORDER.map((slug) => {
          const era = ERAS_DATA[slug];
          const figures = all
            .filter((p) => inEra(p, era))
            .sort((a, b) => (b.significance ?? 0) - (a.significance ?? 0))
            .slice(0, 6);
          const eraImage = getEraImage(slug);

          return (
            <article
              key={slug}
              className="border border-ink/10 rounded-lg bg-parchment hover:border-accent/40 transition-colors"
            >
              <Link href={`/eras/${slug}`} className="group block p-6">
                <div className="flex items-baseline gap-3 flex-wrap mb-1">
                  <h3 className="font-serif text-2xl text-ink group-hover:text-accent">
                    {era.label}
                  </h3>
                  <span className="text-xs tabular-nums text-ink/55">{era.yearLabel}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-ink/45">
                    {figures.length > 0 ? `${all.filter((p) => inEra(p, era)).length} figures` : ""}
                  </span>
                </div>
                <p className="text-ink/65 text-sm italic mb-4">{era.blurb}</p>

                <p className="text-ink/85 leading-relaxed mb-4 line-clamp-3">{era.intro[0]}</p>

                {eraImage ? (
                  <div className="mb-4 h-36 overflow-hidden rounded-md border border-ink/10 bg-ink/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={eraImage.src}
                      alt={eraImage.alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition"
                      style={{ objectPosition: eraImage.object_position ?? "center" }}
                    />
                  </div>
                ) : null}

                {/* Mini-axis showing era span */}
                <div className="relative h-1.5 bg-ink/8 rounded mb-4 overflow-hidden">
                  <div
                    className="absolute inset-y-0 rounded"
                    style={{
                      left: `${pctFor(era.years[0])}%`,
                      width: `${pctFor(era.years[1]) - pctFor(era.years[0])}%`,
                      backgroundColor: ERA_BAND_COLOR[slug],
                      opacity: 0.7,
                    }}
                  />
                </div>

                {/* Top figures portrait strip */}
                {figures.length > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 mt-4">
                    {figures.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex flex-col items-center min-w-0 flex-1 max-w-[80px]">
                        <span className="block w-12 h-12 rounded-full overflow-hidden bg-ink/5 border border-ink/15">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image_url}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              style={{ objectPosition: "center 8%" }}
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center font-serif text-xs text-ink/40">
                              {p.name.charAt(0)}
                            </span>
                          )}
                        </span>
                        <span className="font-serif text-[10px] mt-1 leading-tight truncate w-full text-center text-ink/80">
                          {p.name.split(" of ")[0]}
                        </span>
                        <span className="text-[9px] text-ink/45 tabular-nums">
                          {dateRange(p).text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 text-xs text-accent group-hover:underline">
                  Read about the {era.label.toLowerCase()} →
                </div>
              </Link>
            </article>
          );
        })}
      </section>

      <div className="flex flex-wrap gap-3 mt-12 pt-8 border-t border-ink/10">
        <Link
          href="/"
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
        >
          See the full lineage
        </Link>
        <Link
          href="/start-here"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Start here
        </Link>
        <Link
          href="/bishops"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Bishops & their sees
        </Link>
      </div>
    </article>
  );
}
