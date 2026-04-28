"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Person, Region, Relationship } from "@/lib/schema";

const REGION_COLOR: Record<Region, string> = {
  palestine: "#8b1e2d",
  syria: "#b08940",
  "asia-minor": "#3a7a5e",
  egypt: "#c9a227",
  africa: "#7a4a2a",
  west: "#3a4a7a",
  gaul: "#5b3b8a",
  east: "#2a6a7a",
  other: "#666",
};

const REGION_LABEL: Record<Region, string> = {
  palestine: "Palestine",
  syria: "Syria",
  "asia-minor": "Asia Minor",
  egypt: "Egypt",
  africa: "N. Africa",
  west: "Rome / West",
  gaul: "Gaul",
  east: "East",
  other: "Other",
};

type Props = { people: Person[]; relationships: Relationship[] };

const YEAR_MIN = -10;
const YEAR_MAX = 760;
const PIXELS_PER_YEAR = 2.6;
const ROW_HEIGHT = 24;
const ROW_GAP = 4;
const HEADER = 28;

export default function Timeline({ people, relationships }: Props) {
  const [filterRegion, setFilterRegion] = useState<Region | "all">("all");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [showAllEdges, setShowAllEdges] = useState(false);

  const visible = useMemo(
    () => (filterRegion === "all" ? people : people.filter((p) => p.region === filterRegion)),
    [people, filterRegion]
  );

  const visibleIds = useMemo(() => new Set(visible.map((p) => p.id)), [visible]);

  // Greedy row packing
  const layout = useMemo(() => {
    const sorted = [...visible].sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999));
    const rows: { end: number }[] = [];
    const placed: { person: Person; row: number; x1: number; x2: number }[] = [];
    for (const p of sorted) {
      const born = p.born ?? (p.died ? p.died - 60 : 100);
      const died = p.died ?? born + 60;
      const labelWidth = (p.name.length * 6.5) / PIXELS_PER_YEAR;
      const start = born;
      const endWithLabel = died + labelWidth + 8;
      let row = rows.findIndex((r) => r.end <= start - 2);
      if (row === -1) {
        row = rows.length;
        rows.push({ end: endWithLabel });
      } else {
        rows[row].end = endWithLabel;
      }
      placed.push({ person: p, row, x1: born, x2: died });
    }
    return { placed, rowCount: rows.length };
  }, [visible]);

  const positions = useMemo(() => {
    const m = new Map<string, { cx: number; y: number; x1: number; x2: number; row: number }>();
    for (const item of layout.placed) {
      const left = (item.x1 - YEAR_MIN) * PIXELS_PER_YEAR;
      const right = (item.x2 - YEAR_MIN) * PIXELS_PER_YEAR;
      const cx = (left + right) / 2;
      const y = HEADER + item.row * (ROW_HEIGHT + ROW_GAP) + (ROW_HEIGHT - 6) / 2;
      m.set(item.person.id, { cx, y, x1: left, x2: right, row: item.row });
    }
    return m;
  }, [layout]);

  // Edges relevant to render
  const visibleEdges = useMemo(
    () =>
      relationships.filter(
        (r) => visibleIds.has(r.from) && visibleIds.has(r.to) && positions.has(r.from) && positions.has(r.to)
      ),
    [relationships, visibleIds, positions]
  );

  const hoverEdges = useMemo(() => {
    if (!hoverId) return [];
    return visibleEdges.filter((r) => r.from === hoverId || r.to === hoverId);
  }, [visibleEdges, hoverId]);

  const hoverNeighbors = useMemo(() => {
    const set = new Set<string>();
    if (!hoverId) return set;
    set.add(hoverId);
    for (const e of hoverEdges) {
      set.add(e.from);
      set.add(e.to);
    }
    return set;
  }, [hoverEdges, hoverId]);

  const totalWidth = (YEAR_MAX - YEAR_MIN) * PIXELS_PER_YEAR;
  const totalHeight = layout.rowCount * (ROW_HEIGHT + ROW_GAP) + 60;

  function yearToX(y: number) {
    return (y - YEAR_MIN) * PIXELS_PER_YEAR;
  }

  const regionsPresent = useMemo(() => {
    const set = new Set(people.map((p) => p.region));
    return Array.from(set);
  }, [people]);

  const eraBands = [
    { label: "Apostolic", from: 5, to: 100, color: "#8b1e2d10" },
    { label: "Apologists / Apostolic Fathers", from: 100, to: 200, color: "#b0894020" },
    { label: "Ante-Nicene", from: 200, to: 325, color: "#3a7a5e15" },
    { label: "Nicene", from: 325, to: 451, color: "#3a4a7a15" },
    { label: "Post-Nicene", from: 451, to: 600, color: "#5b3b8a15" },
    { label: "Early Medieval", from: 600, to: 760, color: "#7a4a2a15" },
  ];

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const hovered = hoverId ? peopleById.get(hoverId) : null;

  function edgePath(from: string, to: string): string {
    const a = positions.get(from)!;
    const b = positions.get(to)!;
    const x1 = a.cx;
    const y1 = a.y;
    const x2 = b.cx;
    const y2 = b.y;
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    // If same row, draw a low arc above; otherwise quadratic bezier with vertical bend
    if (a.row === b.row) {
      const lift = Math.max(15, Math.min(60, dx * 0.3));
      const mx = (x1 + x2) / 2;
      return `M${x1},${y1 - 4} Q${mx},${y1 - lift} ${x2},${y2 - 4}`;
    }
    const midY = (y1 + y2) / 2;
    const bend = dx * 0.15 + 10;
    return `M${x1},${y1} C${x1},${midY - bend / 2} ${x2},${midY + bend / 2} ${x2},${y2}`;
  }

  function strokeFor(s: Relationship["strength"]) {
    return s === "disputed" ? "#8b1e2d" : s === "tradition" ? "#1f1a1380" : "#1f1a13";
  }
  function dashFor(s: Relationship["strength"]) {
    return s === "documented" ? undefined : s === "tradition" ? "5,3" : "2,3";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <span className="text-ink/60 mr-1">Filter region:</span>
        <button
          onClick={() => setFilterRegion("all")}
          className={`px-2 py-1 rounded border ${
            filterRegion === "all" ? "bg-ink text-parchment border-ink" : "border-ink/20 hover:border-ink/40"
          }`}
        >
          All ({people.length})
        </button>
        {regionsPresent.map((r) => {
          const count = people.filter((p) => p.region === r).length;
          const active = filterRegion === r;
          return (
            <button
              key={r}
              onClick={() => setFilterRegion(r)}
              className={`px-2 py-1 rounded border ${
                active ? "text-parchment border-transparent" : "border-ink/20 hover:border-ink/40"
              }`}
              style={active ? { backgroundColor: REGION_COLOR[r] } : { color: REGION_COLOR[r] }}
            >
              <span
                className="inline-block w-2 h-2 rounded-sm align-middle mr-1"
                style={{ backgroundColor: REGION_COLOR[r] }}
              />
              {REGION_LABEL[r]} ({count})
            </button>
          );
        })}
        <label className="ml-auto flex items-center gap-1.5 text-ink/60">
          <input
            type="checkbox"
            checked={showAllEdges}
            onChange={(e) => setShowAllEdges(e.target.checked)}
          />
          Show all connections
        </label>
      </div>

      <div className="relative overflow-x-auto border border-ink/10 rounded bg-parchment">
        <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
          {eraBands.map((b) => (
            <div
              key={b.label}
              className="absolute top-0 bottom-0"
              style={{
                left: yearToX(b.from),
                width: (b.to - b.from) * PIXELS_PER_YEAR,
                backgroundColor: b.color,
              }}
            >
              <div className="text-[10px] uppercase tracking-wider text-ink/50 px-2 pt-1">
                {b.label}
              </div>
            </div>
          ))}

          {[0, 100, 200, 300, 400, 500, 600, 700].map((y) => (
            <div
              key={y}
              className="absolute top-0 bottom-0 border-l border-ink/15"
              style={{ left: yearToX(y) }}
            >
              <div className="text-[10px] text-ink/50 absolute bottom-1 left-1 bg-parchment px-1 rounded">
                AD {y}
              </div>
            </div>
          ))}

          {/* SVG edge layer */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={totalWidth}
            height={totalHeight}
            style={{ zIndex: 2 }}
          >
            {showAllEdges &&
              !hoverId &&
              visibleEdges.map((r, i) => (
                <path
                  key={`all-${i}`}
                  d={edgePath(r.from, r.to)}
                  fill="none"
                  stroke={strokeFor(r.strength)}
                  strokeWidth={r.strength === "documented" ? 0.6 : 0.4}
                  strokeDasharray={dashFor(r.strength)}
                  opacity={0.18}
                />
              ))}
            {hoverEdges.map((r, i) => (
              <path
                key={`h-${i}`}
                d={edgePath(r.from, r.to)}
                fill="none"
                stroke={strokeFor(r.strength)}
                strokeWidth={r.strength === "documented" ? 1.6 : 1.1}
                strokeDasharray={dashFor(r.strength)}
                opacity={0.85}
              />
            ))}
          </svg>

          {/* Person bars */}
          {layout.placed.map(({ person, x1, x2, row }) => {
            const left = yearToX(x1);
            const width = Math.max(8, (x2 - x1) * PIXELS_PER_YEAR);
            const top = HEADER + row * (ROW_HEIGHT + ROW_GAP);
            const color = REGION_COLOR[person.region];
            const isHover = hoverId === person.id;
            const isNeighbor = hoverId && hoverNeighbors.has(person.id) && !isHover;
            const dimmed = hoverId && !hoverNeighbors.has(person.id);
            return (
              <Link
                key={person.id}
                href={`/fathers/${person.id}`}
                onMouseEnter={() => setHoverId(person.id)}
                onMouseLeave={() => setHoverId(null)}
                className="absolute flex items-center group cursor-pointer"
                style={{
                  left,
                  top,
                  height: ROW_HEIGHT,
                  zIndex: isHover ? 5 : isNeighbor ? 4 : 3,
                  opacity: dimmed ? 0.18 : 1,
                  transition: "opacity 120ms",
                }}
              >
                <span
                  className="rounded-sm"
                  style={{
                    width,
                    height: ROW_HEIGHT - 6,
                    backgroundColor: color,
                    opacity: person.role.includes("apostle") ? 1 : 0.88,
                    border: isHover
                      ? "2px solid #1f1a13"
                      : isNeighbor
                        ? "1.5px solid #1f1a13"
                        : person.role.includes("bishop")
                          ? "1.5px solid #d4a017"
                          : "none",
                    boxShadow: isHover ? "0 0 0 2px rgba(139,30,45,0.3)" : undefined,
                  }}
                />
                <span
                  className="ml-2 text-[12px] whitespace-nowrap font-serif group-hover:text-accent"
                  style={{
                    color: "#1f1a13",
                    fontWeight: isHover ? 600 : isNeighbor ? 500 : 400,
                  }}
                >
                  {person.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-3 min-h-[80px]">
        {hovered ? (
          <div className="p-3 bg-ink/5 border border-ink/10 rounded text-sm">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <strong className="font-serif text-base">{hovered.name}</strong>
              <span className="text-ink/60 text-xs">
                {hovered.born ?? "?"} – {hovered.died ?? "?"}
                {hovered.see ? ` · Bishop of ${hovered.see}` : ""}
              </span>
              <span className="ml-auto text-xs text-ink/60">
                {hoverEdges.length} connection{hoverEdges.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-ink/75 mb-2">{hovered.short_bio}</p>
            {hoverEdges.length > 0 && (
              <ul className="text-xs text-ink/65 flex flex-wrap gap-x-3 gap-y-1">
                {hoverEdges.slice(0, 8).map((e, i) => {
                  const otherId = e.from === hovered.id ? e.to : e.from;
                  const other = peopleById.get(otherId);
                  const verb = e.from === hovered.id ? e.type : `${e.type} (from)`;
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
                {hoverEdges.length > 8 && (
                  <li className="text-ink/40">+ {hoverEdges.length - 8} more</li>
                )}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink/50">
            Each bar spans birth to death. Color = region. Gold border = bishop.{" "}
            <strong>Hover any bar</strong> to highlight everyone they knew. Click to open the full bio.
          </p>
        )}
      </div>
    </div>
  );
}
