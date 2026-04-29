import Link from "next/link";
import { getPerson } from "@/lib/data";
import { dateRange } from "@/lib/dates";
import SubscribeForm from "@/components/SubscribeForm";

const ANCHORS = [
  { id: "jesus-of-nazareth", era: "Apostolic" },
  { id: "john-the-apostle" },
  { id: "polycarp-of-smyrna", era: "Apostolic Fathers" },
  { id: "irenaeus-of-lyons" },
  { id: "origen-of-alexandria", era: "Ante-Nicene" },
  { id: "athanasius-of-alexandria" },
  { id: "augustine-of-hippo", era: "Patristic" },
  { id: "bede-the-venerable", era: "Early Medieval" },
];

export default function HeroChain() {
  const figures = ANCHORS.map((a) => ({
    person: getPerson(a.id),
    era: a.era,
  })).filter((f) => f.person);

  return (
    <section className="relative max-w-7xl mx-auto px-4 pt-12 pb-10">
      <div className="text-center mb-16 sm:mb-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50 mb-3 font-serif italic">
          Anno Domini xxx — dccl
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl mb-4 leading-[1.05]">
          From Jesus to the Fathers
        </h1>
        <p className="text-base sm:text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
          The human chain that carried the faith for seven centuries — apostles,
          bishops, theologians, martyrs. Every link sourced from primary texts.
        </p>

        <div className="mt-8 max-w-xl mx-auto">
          <SubscribeForm variant="compact" />
          <p className="text-[12px] text-ink/55 mt-2">
            Daily Patristic Wisdom — one Father, council, schism, or quote each morning. Free.
          </p>
        </div>
      </div>

      {/* Portrait strip */}
      <div className="relative -mx-4 sm:mx-0 overflow-x-auto pt-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-start gap-2 sm:gap-3 px-4 sm:justify-between min-w-[640px] sm:min-w-0">
          {figures.map(({ person, era }, i) => {
            if (!person) return null;
            const isApostle = person.role.includes("apostle") || person.id === "jesus-of-nazareth";
            const isBishop = person.role.includes("bishop");
            const ringClass = isApostle
              ? "ring-2 ring-accent ring-offset-2 ring-offset-parchment"
              : isBishop
                ? "ring-2 ring-yellow-600/70 ring-offset-2 ring-offset-parchment"
                : "ring-1 ring-ink/30 ring-offset-2 ring-offset-parchment";
            return (
              <div key={person.id} className="relative flex-1 min-w-0 flex flex-col items-center text-center">
                {/* Connecting line — extends from this medallion's left to previous */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-[44px] sm:top-[56px] right-1/2 left-[-50%] h-px bg-ink/30"
                    style={{ marginRight: "44px", marginLeft: "44px" }}
                  />
                )}
                <Link
                  href={`/fathers/${person.id}`}
                  className="group relative flex flex-col items-center"
                >
                  <span
                    className={`relative block w-[88px] h-[88px] sm:w-[112px] sm:h-[112px] rounded-full overflow-hidden bg-ink/5 ${ringClass} transition-transform group-hover:scale-105`}
                  >
                    {person.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.image_url}
                        alt={person.name}
                        loading={i < 4 ? "eager" : "lazy"}
                        className="w-full h-full object-contain bg-parchment p-0.5"
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center font-serif text-2xl text-ink/40">
                        {person.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="font-serif text-sm sm:text-base mt-2 leading-tight group-hover:text-accent">
                    {person.name.split(" of ")[0]}
                  </span>
                  <span
                    className="text-[10px] sm:text-xs text-ink/55 tabular-nums mt-0.5"
                    title={dateRange(person).explanation || undefined}
                  >
                    {dateRange(person).text}
                  </span>
                  {era && (
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-ink/45 mt-1.5 italic">
                      {era}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-3 mt-10 text-sm">
        <Link
          href="/directory"
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors"
        >
          Browse all 192
        </Link>
        <Link
          href="/about"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors"
        >
          Methodology
        </Link>
      </div>
    </section>
  );
}
