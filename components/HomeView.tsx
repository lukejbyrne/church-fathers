"use client";

import { useState } from "react";
import type { Person, Relationship } from "@/lib/schema";
import LineageGraph from "./LineageGraph";
import Timeline from "./Timeline";

type View = "timeline" | "graph";

export default function HomeView({
  people,
  relationships,
}: {
  people: Person[];
  relationships: Relationship[];
}) {
  const [view, setView] = useState<View>("timeline");

  return (
    <>
      <header className="mb-6 max-w-3xl">
        <h2 className="font-serif text-3xl mb-2">The full lineage</h2>
        <p className="text-ink/70 mb-4">
          {view === "timeline"
            ? "All 192 figures as a horizontal timeline. Each bar spans a person's lifespan, colored by region. Bishops have a gold border. Scroll right to walk through the centuries; hover to read the bio."
            : "All 192 figures as a network graph. Time flows downward; region columns left-to-right. Solid edges are documented in primary sources; dashed are traditional. Click a dot for the bio."}
        </p>
        <div className="inline-flex border border-ink/20 rounded overflow-hidden text-sm">
          <button
            onClick={() => setView("timeline")}
            className={`px-3 py-1.5 ${view === "timeline" ? "bg-ink text-parchment" : "hover:bg-ink/5"}`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView("graph")}
            className={`px-3 py-1.5 border-l border-ink/20 ${
              view === "graph" ? "bg-ink text-parchment" : "hover:bg-ink/5"
            }`}
          >
            Network graph
          </button>
        </div>
      </header>
      {view === "timeline" ? (
        <Timeline people={people} relationships={relationships} />
      ) : (
        <LineageGraph people={people} relationships={relationships} />
      )}
    </>
  );
}
