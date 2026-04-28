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
            ? "All 192 figures as a horizontal timeline. Each bar spans a lifespan, colored by region. Hover to highlight connections. Click any bar to lock the chain — then scroll to trace it across the centuries, or condense to just the chain."
            : "All 192 figures as a network graph. Time flows downward; region columns left-to-right. Hover for the name; click to lock and highlight the chain. Solid edges are documented in primary sources; dashed are traditional."}
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
