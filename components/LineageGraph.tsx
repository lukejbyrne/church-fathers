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
  // If only died is known, place at the death year (latest known position)
  // rather than estimating backwards — prevents short-lived figures like
  // Judas (died ~30, born unknown) appearing earlier than Jesus.
  if (p.died != null) return p.died;
  if (p.born != null) return p.born + 30;
  return 100;
}

export default function LineageGraph({ people: allPeople, relationships }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [condensed, setCondensed] = useState(false);
  const [hover, setHover] = useState<{ p: Person; x: number; y: number } | null>(null);

  const lockedNeighbors = useMemo(() => {
    const set = new Set<string>();
    if (!lockedId) return set;
    set.add(lockedId);
    for (const r of relationships) {
      if (r.from === lockedId) set.add(r.to);
      if (r.to === lockedId) set.add(r.from);
    }
    return set;
  }, [lockedId, relationships]);

  const people = useMemo(
    () => (condensed && lockedId ? allPeople.filter((p) => lockedNeighbors.has(p.id)) : allPeople),
    [allPeople, condensed, lockedId, lockedNeighbors]
  );

  const peopleById = useMemo(() => new Map(allPeople.map((p) => [p.id, p])), [allPeople]);
  const lockedPerson = lockedId ? peopleById.get(lockedId) : null;

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
      .attr("stroke-width", (r) => {
        const involved = lockedId && (r.from === lockedId || r.to === lockedId);
        if (involved) return r.strength === "documented" ? 2 : 1.4;
        return r.strength === "documented" ? 1 : 0.7;
      })
      .attr("stroke-dasharray", (r) =>
        r.strength === "documented" ? null : r.strength === "tradition" ? "5,3" : "2,3"
      )
      .attr("opacity", (r) => {
        if (!lockedId) return 0.45;
        return r.from === lockedId || r.to === lockedId ? 0.95 : 0.06;
      });

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
      .attr("opacity", (p) => {
        if (!lockedId) return 1;
        return lockedNeighbors.has(p.id) ? 1 : 0.15;
      })
      .style("cursor", "pointer")
      .on("mouseenter", (event, p) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setHover({ p, x: (event as MouseEvent).clientX - rect.left, y: (event as MouseEvent).clientY - rect.top });
      })
      .on("mouseleave", () => setHover(null))
      .on("click", (event, p) => {
        event.stopPropagation();
        setLockedId((cur) => (cur === p.id ? null : p.id));
      });

    nodes
      .append("circle")
      .attr("r", (p) => {
        const base = 2.5 + p.significance * 1.5;
        return p.id === lockedId ? base + 3 : base;
      })
      .attr("fill", (p) =>
        p.role.includes("apostle") ? "#8b1e2d" : p.role.includes("emperor") ? "#5b3b8a" : "#1f1a13"
      )
      .attr("stroke", (p) => {
        if (p.id === lockedId) return "#8b1e2d";
        return p.role.includes("bishop") ? "#d4a017" : "none";
      })
      .attr("stroke-width", (p) => (p.id === lockedId ? 3 : 1.5));

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

  }, [people, relationships, positions, presentRegions, yScale, innerH, innerW, lockedId, lockedNeighbors]);

  const lockedEdges = useMemo(
    () => (lockedId ? relationships.filter((r) => r.from === lockedId || r.to === lockedId) : []),
    [relationships, lockedId]
  );

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

      {lockedPerson && (
        <div className="flex flex-wrap items-center gap-2 mb-3 px-3 py-2 bg-accent/10 border border-accent/30 rounded text-sm">
          <span className="font-serif text-base">{lockedPerson.name}</span>
          <span className="text-ink/60 text-xs">
            locked · {lockedEdges.length} connections highlighted
          </span>
          <button
            onClick={() => setCondensed((c) => !c)}
            className="ml-auto px-2 py-1 rounded border border-ink/20 hover:border-accent text-xs"
          >
            {condensed ? "Show full graph" : "Condense to chain only"}
          </button>
          <Link
            href={`/fathers/${lockedPerson.id}`}
            className="px-2 py-1 rounded bg-ink text-parchment hover:bg-accent text-xs"
          >
            Open page →
          </Link>
          <button
            onClick={() => {
              setLockedId(null);
              setCondensed(false);
            }}
            className="px-2 py-1 rounded border border-ink/20 hover:border-accent text-xs"
          >
            Clear
          </button>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-auto bg-parchment border border-ink/10 rounded" />

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

      {lockedPerson && (
        <div className="mt-3 p-3 bg-ink/5 border border-ink/10 rounded text-sm">
          <p className="text-ink/75 mb-2">{lockedPerson.short_bio}</p>
          <ul className="text-xs text-ink/65 flex flex-wrap gap-x-3 gap-y-1">
            {lockedEdges.slice(0, 12).map((e, i) => {
              const otherId = e.from === lockedPerson.id ? e.to : e.from;
              const other = peopleById.get(otherId);
              const verb = e.from === lockedPerson.id ? e.type : `${e.type} (from)`;
              return (
                <li key={i}>
                  <span className="text-ink/50">{verb.replace(/_/g, " ")}</span>{" "}
                  <span className="font-medium">{other?.name ?? otherId}</span>
                  <span
                    className={`ml-1 text-[10px] uppercase ${
                      e.strength === "disputed" ? "text-accent" : "text-ink/40"
                    }`}
                  >
                    {e.strength}
                  </span>
                </li>
              );
            })}
            {lockedEdges.length > 12 && (
              <li className="text-ink/40">+ {lockedEdges.length - 12} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// (PersonPanel removed — now handled inline as the lock bar)
function _unused() {
  return null;
}
