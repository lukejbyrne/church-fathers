import Link from "next/link";
import type { RecommendedWork } from "@/lib/recommendations";

export default function RecommendedReading({
  works,
  title = "Recommended reading",
  intro,
}: {
  works: RecommendedWork[];
  title?: string;
  intro?: string;
}) {
  if (works.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-serif text-2xl text-ink mb-2">{title}</h2>
      {intro ? <p className="text-sm text-ink/60 mb-4 max-w-2xl">{intro}</p> : null}
      <div className="grid sm:grid-cols-2 gap-3">
        {works.map((work) => (
          <article key={`${work.personId}:${work.title}`} className="border border-ink/15 rounded-md bg-ink/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-ink/45 mb-1">
              {work.personName}
            </p>
            <h3 className="font-serif text-lg text-ink leading-snug">
              {work.title}
              {work.year ? <span className="text-sm text-ink/50"> · {work.year}</span> : null}
            </h3>
            {work.description ? (
              <p className="text-sm text-ink/70 mt-2 line-clamp-3">{work.description}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              {work.readUrl ? (
                <a
                  href={work.readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 border border-ink/25 rounded hover:border-accent hover:text-accent"
                >
                  Read online
                </a>
              ) : null}
              {work.editionUrl ? (
                <a
                  href={work.editionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 border border-ink/25 rounded hover:border-accent hover:text-accent"
                >
                  Find an edition
                </a>
              ) : null}
              <Link
                href={`/fathers/${work.personId}#works`}
                className="px-2.5 py-1 border border-ink/25 rounded hover:border-accent hover:text-accent"
              >
                More by {work.personName.split(" of ")[0]}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
