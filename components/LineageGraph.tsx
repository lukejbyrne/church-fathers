"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import Link from "next/link";
import type { Person, Relationship, Region } from "@/lib/schema";

const REGION_ORDER: Region[] = [
  "palestine",
  "syria",
  "asia-minor",
  "egypt",
  "africa",
  "west",
  "gaul",
  "east",
  "other",
];

const REGION_LABEL: Record<Region, string> = {
  palestine: "Palestine",
  syria: "Syria",
  "asia-minor": "Asia Minor",
  egypt: "Egypt",
  africa: "N. Africa",
  west: "Rome / West",
  gaul: "Gaul",
  east: "East (other)",
  other: "Other",
};

type Props = { people: Person[]; relationships: Relationship[] };

function midYear(p: Person): number {
  if (p.born != null && p.died != null) return (p.born + p.died) / 2;
  if (p.died != null) return p.died - 30;
  if (p.born != null) return p.born + 30;
  return 100;
}

export default function LineageGraph({ people, relationships }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selected, setSelected] = useState<Person | null>(null);
  const [hover, setHover] = useState<{ p: Person; x: number; y: number } | null>(null);

  const width = 1280;
  const height = 2400;
  const margin = { top: 56, right: 24, bottom: 24, left: 80 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const yScale = useMemo(() => {
    return d3
      .scaleLinear<number, number>()
      .domain([0, 100, 250, 500, 760])
      .range([0, innerH * 0.25, innerH * 0.5, innerH * 0.78, innerH]);
  }, [innerH]);

  // Weight Palestine wider — it carries Jesus + Twelve and is densest at the top
  const presentRegions = useMemo(() => {
    const set = new Set(people.map((p) => p.region));
    return REGION_ORDER.filter((r) => set.has(r));
  }, [people]);

  const xScale = useMemo(() => {
    const counts = Object.fromEntries(presentRegions.map((r) => [r, 0])) as Record<Region, number>;
    people.forEach((p) => (counts[p.region] += 1));
    const max = Math.max(...Object.values(counts));
    const weights = presentRegions.map((r) => 0.5 + (counts[r] / max) * 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let cursor = 0;
    const ranges = new Map<Region, [number, number]>();
    presentRegions.forEach((r, i) => {
      const w = (weights[i] / total) * innerW;
      ranges.set(r, [cursor, cursor + w]);
      cursor += w;
    });
    return ranges;
  }, [people, presentRegions, innerW]);

  const regionCenter = (r: Region) => {
    const range = xScale.get(r);
    if (!range) return innerW / 2;
    return (range[0] + range[1]) / 2;
  };
  const regionWidth = (r: Region) => {
    const range = xScale.get(r);
    if (!range) return 100;
    return range[1] - range[0];
  };

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    // Bucket by (region, 12-yr window)
    const buckets = new Map<string, Person[]>();
    people.forEach((p) => {
      const yBucket = Math.round(midYear(p) / 12);
      const key = `${p.region}:${yBucket}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(p);
    });

    for (const [, ppl] of buckets) {
      ppl.sort((a, b) => b.significance - a.significance);
      const w = regionWidth(ppl[0].region) - 30;
      const xc = regionCenter(ppl[0].region);
      ppl.forEach((p, i) => {
        const span = Math.min(w, ppl.length * 22);
        const fraction = ppl.length === 1 ? 0 : i / (ppl.length - 1) - 0.5;
        map.set(p.id, {
          x: xc + fraction * span,
          y: yScale(midYear(p)),
        });
      });
    }

    // Iterative collision relax: 60 iterations, push apart any two dots within 14px
    const ids = Array.from(map.keys());
    for (let iter = 0; iter < 80; iter++) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = map.get(ids[i])!;
          const b = map.get(ids[j])!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const minD = 13;
          if (d < minD) {
            const push = (minD - d) / 2;
            const ux = dx / d;
            const uy = dy / d;
            // Push more horizontally than vertically (preserve year ordering)
            a.x -= ux * push * 0.9;
            b.x += ux * push * 0.9;
            a.y -= uy * push * 0.3;
            b.y += uy * push * 0.3;
          }
        }
      }
    }

    return map;
  }, [people, xScale, yScale]);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("user-select", "none");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([30, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700])
      .tickFormat((d) => `AD ${d}`);
    g.append("g").attr("class", "axis-y").call(yAxis);
    g.selectAll(".axis-y text").attr("font-family", "Cormorant Garamond, serif").attr("font-size", 11);
    g.selectAll(".axis-y line, .axis-y path").attr("stroke", "#1f1a1340");

    g.append("g")
      .selectAll("text.region")
      .data(presentRegions)
      .join("text")
      .attr("class", "region")
      .attr("x", (r) => regionCenter(r))
      .attr("y", -28)
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .attr("font-family", "Cormorant Garamond, serif")
      .attr("fill", "#1f1a13cc")
      .text((r) => REGION_LABEL[r]);

    // Vertical region dividers
    g.append("g")
      .selectAll("line.region-div")
      .data(presentRegions.slice(1))
      .join("line")
      .attr("class", "region-div")
      .attr("x1", (r) => xScale.get(r)![0])
      .attr("x2", (r) => xScale.get(r)![0])
      .attr("y1", -10)
      .attr("y2", innerH)
      .attr("stroke", "#1f1a1308");

    g.append("g")
      .selectAll("line.gridY")
      .data([100, 200, 300, 400, 500, 600, 700])
      .join("line")
      .attr("class", "gridY")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#1f1a1310")
      .attr("stroke-dasharray", "2,4");

    const edgesG = g.append("g").attr("class", "edges");
    edgesG
      .selectAll("path")
      .data(relationships.filter((r) => positions.has(r.from) && positions.has(r.to)))
      .join("path")
      .attr("d", (r) => {
        const a = positions.get(r.from)!;
        const b = positions.get(r.to)!;
        const my = (a.y + b.y) / 2;
        return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
      })
      .attr("fill", "none")
      .attr("stroke", (r) =>
        r.strength === "disputed" ? "#8b1e2d" : r.strength === "tradition" ? "#1f1a1370" : "#1f1a13"
      )
      .attr("stroke-width", (r) => (r.strength === "documented" ? 1 : 0.7))
      .attr("stroke-dasharray", (r) =>
        r.strength === "documented" ? null : r.strength === "tradition" ? "5,3" : "2,3"
      )
      .attr("opacity", 0.45);

    const nodesG = g.append("g").attr("class", "nodes");
    const nodes = nodesG
      .selectAll("g.node")
      .data(people.filter((p) => positions.has(p.id)))
      .join("g")
      .attr("class", "node")
      .attr("transform", (p) => {
        const pos = positions.get(p.id)!;
        return `translate(${pos.x},${pos.y})`;
      })
      .style("cursor", "pointer")
      .on("mouseenter", (event, p) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setHover({ p, x: (event as MouseEvent).clientX - rect.left, y: (event as MouseEvent).clientY - rect.top });
      })
      .on("mouseleave", () => setHover(null))
      .on("click", (event, p) => {
        event.stopPropagation();
        setSelected(p);
      });

    nodes
      .append("circle")
      .attr("r", (p) => 2.5 + p.significance * 1.5)
      .attr("fill", (p) =>
        p.role.includes("apostle") ? "#8b1e2d" : p.role.includes("emperor") ? "#5b3b8a" : "#1f1a13"
      )
      .attr("stroke", (p) => (p.role.includes("bishop") ? "#d4a017" : "none"))
      .attr("stroke-width", 1.5);

    // Label placement: use simple anti-overlap by dy offset for clusters
    const labelData = people
      .filter((p) => positions.has(p.id) && p.significance >= 3)
      .map((p) => ({ p, pos: positions.get(p.id)! }));

    const labelG = g.append("g").attr("class", "labels").style("pointer-events", "none");
    labelG
      .selectAll("text")
      .data(labelData)
      .join("text")
      .attr("x", (d) => d.pos.x + 11)
      .attr("y", (d) => d.pos.y + 3)
      .attr("font-size", (d) => (d.p.significance >= 4 ? 13 : 11))
      .attr("font-weight", (d) => (d.p.significance >= 4 ? 600 : 400))
      .attr("font-family", "Cormorant Garamond, serif")
      .attr("fill", (d) => (d.p.significance >= 4 ? "#1f1a13" : "#1f1a13cc"))
      .text((d) => d.p.name);

  }, [people, relationships, positions, presentRegions, yScale, innerH, innerW]);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-4 mb-3 text-xs text-ink/70 items-center">
        <span>
          <span className="inline-block w-6 border-t-2 border-ink align-middle mr-1" /> documented
        </span>
        <span>
          <span className="inline-block w-6 border-t-2 border-dashed border-ink/60 align-middle mr-1" /> tradition
        </span>
        <span>
          <span className="inline-block w-6 border-t-2 border-dotted border-accent align-middle mr-1" /> disputed
        </span>
        <span>
          <span className="inline-block w-3 h-3 rounded-full border-2 border-yellow-600 align-middle mr-1" /> bishop
        </span>
        <span>
          <span className="inline-block w-3 h-3 rounded-full bg-accent align-middle mr-1" /> apostle
        </span>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-auto bg-parchment border border-ink/10 rounded"
      />
      {hover && (
        <div
          className="absolute pointer-events-none bg-ink text-parchment text-xs px-2 py-1 rounded shadow-lg z-10"
          style={{ left: hover.x + 12, top: hover.y + 30 }}
        >
          <div className="font-serif text-sm">{hover.p.name}</div>
          <div className="text-parchment/70">
            {hover.p.born ?? "?"} – {hover.p.died ?? "?"}
            {hover.p.see ? ` · Bishop of ${hover.p.see}` : ""}
          </div>
        </div>
      )}
      {selected && (
        <PersonPanel
          person={selected}
          relationships={relationships.filter((r) => r.from === selected.id || r.to === selected.id)}
          peopleById={peopleById}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function PersonPanel({
  person,
  relationships,
  peopleById,
  onClose,
}: {
  person: Person;
  relationships: Relationship[];
  peopleById: Map<string, Person>;
  onClose: () => void;
}) {
  return (
    <div className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-parchment border-l border-ink/15 shadow-2xl overflow-y-auto z-30 p-6">
      <button onClick={onClose} className="absolute top-3 right-4 text-ink/50 hover:text-accent text-lg">
        ×
      </button>
      <h2 className="font-serif text-3xl mb-1">{person.name}</h2>
      <div className="text-sm text-ink/60 mb-4">
        {person.born ?? "?"} – {person.died ?? "?"}
        {person.see ? ` · Bishop of ${person.see}` : ""}
      </div>
      <p className="text-sm leading-relaxed mb-4">{person.short_bio}</p>
      <div className="flex flex-wrap gap-1 mb-4">
        {person.role.map((r) => (
          <span key={r} className="text-[10px] uppercase tracking-wide bg-ink/10 px-2 py-0.5 rounded">
            {r}
          </span>
        ))}
      </div>
      <Link href={`/fathers/${person.id}`} className="inline-block text-sm text-accent hover:underline mb-6">
        Full page →
      </Link>
      <h3 className="font-serif text-lg mt-4 mb-2">Connections ({relationships.length})</h3>
      <ul className="space-y-3 text-sm">
        {relationships.map((r, i) => {
          const otherId = r.from === person.id ? r.to : r.from;
          const other = peopleById.get(otherId);
          const direction = r.from === person.id ? r.type : `${r.type} (from)`;
          return (
            <li key={i} className="border-l-2 border-ink/15 pl-3">
              <div>
                <span className="text-ink/60">{direction.replace(/_/g, " ")}</span>{" "}
                <Link href={`/fathers/${otherId}`} className="font-medium hover:text-accent">
                  {other?.name ?? otherId}
                </Link>{" "}
                <span
                  className={`text-[10px] uppercase ml-1 ${
                    r.strength === "disputed" ? "text-accent" : "text-ink/50"
                  }`}
                >
                  {r.strength}
                </span>
              </div>
              {r.notes && <div className="text-ink/60 text-xs mt-0.5">{r.notes}</div>}
              <div className="text-[11px] text-ink/50 mt-0.5">
                {r.citations.map((c) => c.source).join(" · ")}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
