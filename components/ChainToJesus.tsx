"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Person, Relationship } from "@/lib/schema";
import type { ChainKind } from "@/lib/lineage";
import { dateRange } from "@/lib/dates";

const VALID_KINDS: ChainKind[] = ["all", "pedagogical", "episcopal", "documented_only"];

const KIND_LABEL: Record<ChainKind, string> = {
  all: "All transmission",
  pedagogical: "Pedagogical (taught)",
  episcopal: "Episcopal succession",
  documented_only: "Documented only",
};

const KIND_DESCRIPTION: Record<ChainKind, string> = {
  all:
    "Strongest path through any relationship — teaching, correspondence, succession, citation. Weighted to prefer documented evidence and direct discipleship over later citation.",
  pedagogical:
    "Strict teacher → student chain, the classic 'apostolic succession of doctrine.' Skips letters, citations, and metropolitan succession.",
  episcopal:
    "Bishop-to-bishop succession only — what Catholic and Orthodox readers usually mean by apostolic succession proper. Many figures will return no chain in this mode because they were not bishops.",
  documented_only:
    "Same as the default but ignores any link not directly attested in a primary source. The hardest test of evidence.",
};

export type ChainStep = {
  person: Pick<Person, "id" | "name" | "born" | "born_circa" | "died" | "died_circa" | "role" | "image_url">;
  edge: Pick<Relationship, "type" | "strength"> | null;
};

type Props = {
  id: string;
  chains: Partial<Record<ChainKind, ChainStep[] | null>>;
};

export default function ChainToJesus({ id, chains }: Props) {
  const searchParams = useSearchParams();
  const raw = searchParams.get("via");
  const kind: ChainKind = (VALID_KINDS as string[]).includes(raw ?? "")
    ? (raw as ChainKind)
    : "all";

  const chain = chains[kind];

  return (
    <section className="mb-10 -mx-4 px-4 py-6 bg-ink/5 border-y border-ink/10">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-serif text-2xl mb-1">Chain to Jesus</h2>
        <p className="text-xs text-ink/55 mb-3 max-w-prose">{KIND_DESCRIPTION[kind]}</p>

        <div className="flex flex-wrap gap-1 mb-5 text-[11px]">
          {VALID_KINDS.map((k) => (
            <Link
              key={k}
              href={k === "all" ? `/fathers/${id}` : `/fathers/${id}?via=${k}`}
              className={`px-2.5 py-1 rounded border transition-colors ${
                kind === k
                  ? "bg-ink text-parchment border-ink"
                  : "border-ink/20 hover:border-accent hover:text-accent"
              }`}
              scroll={false}
            >
              {KIND_LABEL[k]}
            </Link>
          ))}
        </div>

        {!chain || chain.length <= 1 ? (
          <p className="text-sm text-ink/60 italic">
            No chain to Jesus available via this route. Try{" "}
            <Link href={`/fathers/${id}`} className="underline hover:text-accent">
              all transmission
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="text-[11px] text-ink/55 mb-4">
              {chain.length - 1} step{chain.length === 2 ? "" : "s"}.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-stretch gap-3">
              {chain.map(({ person, edge }, i) => {
                const isAnchor = person.id === "jesus-of-nazareth";
                const isTarget = person.id === id;
                const ringClass =
                  person.role.includes("apostle") || isAnchor
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-ink/5"
                    : person.role.includes("bishop")
                      ? "ring-2 ring-yellow-600/70 ring-offset-2 ring-offset-ink/5"
                      : "ring-1 ring-ink/30 ring-offset-2 ring-offset-ink/5";
                return (
                  <div key={person.id} className="contents">
                    {i > 0 && edge && (
                      <div
                        aria-hidden="true"
                        className="flex sm:items-center sm:px-1 pl-16 sm:pl-0 -my-1 sm:my-0 text-[10px] uppercase tracking-wider text-ink/55 italic"
                      >
                        <span
                          className={`flex items-center gap-1 ${
                            edge.strength === "documented"
                              ? ""
                              : edge.strength === "tradition"
                                ? "text-ink/40 not-italic"
                                : "text-accent"
                          }`}
                        >
                          <span className="text-ink/30 sm:hidden">↓</span>
                          <span className="text-ink/30 hidden sm:inline">→</span>
                          <span>
                            {edge.type.replace(/_/g, " ")}
                            {edge.strength !== "documented" && (
                              <span className="ml-1 normal-case text-ink/35">
                                ({edge.strength})
                              </span>
                            )}
                          </span>
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/fathers/${person.id}`}
                      className="group flex items-center sm:flex-col gap-3 sm:gap-1.5 sm:text-center sm:max-w-[120px]"
                    >
                      <span
                        className={`relative block shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-ink/10 ${ringClass} transition-transform group-hover:scale-105`}
                      >
                        {person.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={person.image_url}
                            alt={person.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: "center 8%" }}
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center font-serif text-base text-ink/40">
                            {person.name.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="flex flex-col sm:items-center min-w-0">
                        <span
                          className={`font-serif text-sm sm:text-[13px] leading-tight group-hover:text-accent ${
                            isTarget ? "font-semibold" : ""
                          }`}
                        >
                          {person.name}
                        </span>
                        <span
                          className="text-[10px] text-ink/55 tabular-nums"
                          title={dateRange(person).explanation || undefined}
                        >
                          {dateRange(person).text}
                        </span>
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
