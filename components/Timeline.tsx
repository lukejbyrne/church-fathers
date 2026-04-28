"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Person, Region, Relationship } from "@/lib/schema";
import { buildChainsToAnchor, lineageOf } from "@/lib/lineage";

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

type Props = {
  people: Person[];
  relationships: Relationship[];
  lockedId: string | null;
  setLockedId: (id: string | null) => void;
};

const YEAR_MIN = -10;
const YEAR_MAX = 760;
const ROW_HEIGHT = 16;
const ROW_GAP = 2;
const HEADER = 24;

export default function Timeline({ people, relationships, lockedId, setLockedId }: Props) {
  const router = useRouter();
  const [filterRegion, setFilterRegion] = useState<Region | "all">("all");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [condensed, setCondensed] = useState(false);
  const [showAllEdges, setShowAllEdges] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clearTimer = useRef<number | null>(null);

  function setHoverDelayed(id: string | null) {
    if (clearTimer.current) {
      window.clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    if (id === null) {
      clearTimer.current = window.setTimeout(() => setHoverId(null), 180);
    } else {
      setHoverId(id);
    }
  }

  // Pixels per year auto-fits to container width on mount
  const [pxPerYear, setPxPerYear] = useState(1.6);
  useEffect(() => {
    const fit = () => {
      const w = containerRef.current?.clientWidth ?? 1200;
      // Fill container width on desktop. Floor at 1.2 so mobile/narrow screens
      // still pack legibly (and scroll horizontally past the floor).
      setPxPerYear(Math.max(1.2, (w - 24) / (YEAR_MAX - YEAR_MIN)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const activeId = lockedId ?? hoverId;
  const [hoveredEdge, setHoveredEdge] = useState<{ rel: Relationship; x: number; y: number } | null>(null);

  // Both hover and lock now use the full lineage (ancestors + descendants).
  const chains = useMemo(() => buildChainsToAnchor(people, relationships), [people, relationships]);
  const lockedLineage = useMemo(() => (lockedId ? lineageOf(lockedId, chains) : null), [lockedId, chains]);
  const hoverLineage = useMemo(
    () => (hoverId && hoverId !== lockedId ? lineageOf(hoverId, chains) : null),
    [hoverId, lockedId, chains]
  );
  const activeLineage = lockedLineage ?? hoverLineage;
  const highlight = activeLineage?.all ?? null;

  const allEdges = useMemo(() => relationships, [relationships]);
  const activeEdges = useMemo(
    () => (activeId ? allEdges.filter((r) => r.from === activeId || r.to === activeId) : []),
    [allEdges, activeId]
  );

  // For locked mode, also compute the full chain edges (the path back to Jesus)
  const lineageEdges = useMemo(() => {
    if (!lockedId || !lockedLineage) return [];
    return relationships.filter((r) => lockedLineage.all.has(r.from) && lockedLineage.all.has(r.to));
  }, [lockedId, lockedLineage, relationships]);

  // Visible people: filtered by region, then optionally condensed to lineage only
  const visible = useMemo(() => {
    let out = filterRegion === "all" ? people : people.filter((p) => p.region === filterRegion);
    if (condensed && lockedLineage) {
      out = out.filter((p) => lockedLineage.all.has(p.id));
    }
    return out;
  }, [people, filterRegion, condensed, lockedLineage]);

  const visibleIds = useMemo(() => new Set(visible.map((p) => p.id)), [visible]);

  // Greedy row packing — labels only reserve space when shown (sig>=3 OR condensed)
  const layout = useMemo(() => {
    const sorted = [...visible].sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999));
    const rows: { end: number }[] = [];
    const placed: { person: Person; row: number; x1: number; x2: number }[] = [];
    for (const p of sorted) {
      const born = p.born ?? (p.died ? p.died - 30 : 100);
      const died = p.died ?? born + 60;
      const showsLabel = condensed || p.significance >= 3;
      const labelWidth = showsLabel ? (p.name.length * 5.5) / pxPerYear : 0;
      const start = born;
      const endWithLabel = died + labelWidth + 4;
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
  }, [visible, condensed, pxPerYear]);

  const positions = useMemo(() => {
    const m = new Map<string, { cx: number; y: number; x1: number; x2: number; row: number }>();
    for (const item of layout.placed) {
      const left = (item.x1 - YEAR_MIN) * pxPerYear;
      const right = (item.x2 - YEAR_MIN) * pxPerYear;
      const cx = (left + right) / 2;
      const y = HEADER + item.row * (ROW_HEIGHT + ROW_GAP) + (ROW_HEIGHT - 4) / 2;
      m.set(item.person.id, { cx, y, x1: left, x2: right, row: item.row });
    }
    return m;
  }, [layout, pxPerYear]);

  const visibleEdges = useMemo(
    () =>
      allEdges.filter(
        (r) => visibleIds.has(r.from) && visibleIds.has(r.to) && positions.has(r.from) && positions.has(r.to)
      ),
    [allEdges, visibleIds, positions]
  );

  const renderEdges = useMemo(() => {
    if (!activeLineage) return [];
    return visibleEdges.filter((r) => activeLineage.all.has(r.from) && activeLineage.all.has(r.to));
  }, [visibleEdges, activeLineage]);

  // Per-person sequential anchor offsets — each connection exits a different
  // point along the bar, sorted by chronology of the connected person, so
  // edges don't overlap on a single midpoint.
  const peopleByIdLocal = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const anchorMap = useMemo(() => {
    const personEdges = new Map<string, Relationship[]>();
    const ensure = (id: string) => {
      if (!personEdges.has(id)) personEdges.set(id, []);
      return personEdges.get(id)!;
    };
    for (const e of visibleEdges) {
      ensure(e.from).push(e);
      ensure(e.to).push(e);
    }
    for (const [pid, edges] of personEdges) {
      edges.sort((a, b) => {
        const ao = a.from === pid ? a.to : a.from;
        const bo = b.from === pid ? b.to : b.from;
        const ay = peopleByIdLocal.get(ao)?.born ?? peopleByIdLocal.get(ao)?.died ?? 9999;
        const by = peopleByIdLocal.get(bo)?.born ?? peopleByIdLocal.get(bo)?.died ?? 9999;
        return ay - by;
      });
    }
    const m = new Map<string, { fromFrac: number; toFrac: number }>();
    for (const e of visibleEdges) {
      const key = `${e.from}__${e.type}__${e.to}`;
      const fl = personEdges.get(e.from)!;
      const tl = personEdges.get(e.to)!;
      const fi = fl.indexOf(e);
      const ti = tl.indexOf(e);
      m.set(key, {
        fromFrac: (fi + 1) / (fl.length + 1),
        toFrac: (ti + 1) / (tl.length + 1),
      });
    }
    return m;
  }, [visibleEdges, peopleByIdLocal]);

  const totalWidth = (YEAR_MAX - YEAR_MIN) * pxPerYear;
  const totalHeight = layout.rowCount * (ROW_HEIGHT + ROW_GAP) + 50;

  function yearToX(y: number) {
    return (y - YEAR_MIN) * pxPerYear;
  }

  const regionsPresent = useMemo(() => Array.from(new Set(people.map((p) => p.region))), [people]);

  const eraBands = [
    { label: "Apostolic", from: 5, to: 100, color: "#8b1e2d10" },
    { label: "Apologists / Apostolic Fathers", from: 100, to: 200, color: "#b0894020" },
    { label: "Ante-Nicene", from: 200, to: 325, color: "#3a7a5e15" },
    { label: "Nicene", from: 325, to: 451, color: "#3a4a7a15" },
    { label: "Post-Nicene", from: 451, to: 600, color: "#5b3b8a15" },
    { label: "Early Medieval", from: 600, to: 760, color: "#7a4a2a15" },
  ];

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const active = activeId ? peopleById.get(activeId) : null;

  // When a person gets locked, scroll their bar into view
  useEffect(() => {
    if (!lockedId || !scrollRef.current) return;
    const pos = positions.get(lockedId);
    if (!pos) return;
    const container = scrollRef.current;
    const target = pos.x1 - container.clientWidth / 4;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [lockedId, positions]);

  function edgePath(rel: Relationship): string {
    const a = positions.get(rel.from)!;
    const b = positions.get(rel.to)!;
    const anchors = anchorMap.get(`${rel.from}__${rel.type}__${rel.to}`) ?? { fromFrac: 0.5, toFrac: 0.5 };
    const ax = a.x1 + anchors.fromFrac * (a.x2 - a.x1);
    const bx = b.x1 + anchors.toFrac * (b.x2 - b.x1);
    if (a.row === b.row) {
      const dx = Math.abs(bx - ax);
      const lift = Math.max(15, Math.min(60, dx * 0.3));
      const mx = (ax + bx) / 2;
      return `M${ax},${a.y - 4} Q${mx},${a.y - lift} ${bx},${b.y - 4}`;
    }
    const midY = (a.y + b.y) / 2;
    const bend = Math.abs(bx - ax) * 0.15 + 10;
    return `M${ax},${a.y} C${ax},${midY - bend / 2} ${bx},${midY + bend / 2} ${bx},${b.y}`;
  }
  function strokeFor(s: Relationship["strength"]) {
    return s === "disputed" ? "#8b1e2d" : s === "tradition" ? "#1f1a1380" : "#1f1a13";
  }
  function dashFor(s: Relationship["strength"]) {
    return s === "documented" ? undefined : s === "tradition" ? "5,3" : "2,3";
  }

  function handleBarClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    if (lockedId === id) {
      setLockedId(null);
      setCondensed(false);
    } else {
      setLockedId(id);
    }
  }

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <span className="text-ink/60 mr-1">Region:</span>
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
          const isActive = filterRegion === r;
          return (
            <button
              key={r}
              onClick={() => setFilterRegion(r)}
              className={`px-2 py-1 rounded border ${
                isActive ? "text-parchment border-transparent" : "border-ink/20 hover:border-ink/40"
              }`}
              style={isActive ? { backgroundColor: REGION_COLOR[r] } : { color: REGION_COLOR[r] }}
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
          <input type="checkbox" checked={showAllEdges} onChange={(e) => setShowAllEdges(e.target.checked)} />
          Show all connections
        </label>
      </div>

      {lockedId && lockedLineage && (
        <div className="sticky top-14 z-10 flex flex-wrap items-center gap-2 mb-3 px-3 py-2 bg-accent/15 backdrop-blur border border-accent/40 rounded text-sm shadow-sm">
          <Link
            href={`/fathers/${lockedId}`}
            className="font-serif text-base hover:text-accent underline decoration-ink/20 hover:decoration-accent underline-offset-2"
          >
            {peopleById.get(lockedId)?.name}
          </Link>
          <span className="text-ink/60 text-xs">
            lineage · {lockedLineage.ancestors.size - 1} ancestors back to Jesus ·{" "}
            {lockedLineage.descendants.size - 1} descendants
          </span>
          <button
            onClick={() => setCondensed((c) => !c)}
            className="ml-auto px-2 py-1 rounded border border-ink/20 hover:border-accent text-xs"
          >
            {condensed ? "Show full timeline" : "Condense to chain only"}
          </button>
          <Link
            href={`/fathers/${lockedId}`}
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

      <div
        ref={scrollRef}
        className="relative overflow-x-auto border border-ink/10 rounded bg-parchment"
      >
        <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
          {eraBands.map((b) => (
            <div
              key={b.label}
              className="absolute top-0 bottom-0"
              style={{
                left: yearToX(b.from),
                width: (b.to - b.from) * pxPerYear,
                backgroundColor: b.color,
              }}
            >
              <div className="text-[10px] uppercase tracking-wider text-ink/55 px-2 pt-1">
                {b.label}
              </div>
            </div>
          ))}

          {[0, 100, 200, 300, 400, 500, 600, 700].map((y) => (
            <div key={y} className="absolute top-0 bottom-0 border-l border-ink/15" style={{ left: yearToX(y) }}>
              <div className="text-[10px] text-ink/55 absolute bottom-1 left-1 bg-parchment px-1 rounded">
                AD {y}
              </div>
            </div>
          ))}

          <svg className="absolute inset-0" width={totalWidth} height={totalHeight} style={{ zIndex: 2, pointerEvents: "none" }}>
            {showAllEdges &&
              !activeId &&
              visibleEdges.map((r, i) => (
                <path
                  key={`all-${i}`}
                  d={edgePath(r)}
                  fill="none"
                  stroke={strokeFor(r.strength)}
                  strokeWidth={r.strength === "documented" ? 0.6 : 0.4}
                  strokeDasharray={dashFor(r.strength)}
                  opacity={0.18}
                />
              ))}
            {renderEdges.map((r, i) => (
              <g key={`h-${i}`} style={{ pointerEvents: "auto" }}>
                {/* Wide invisible hit area for easy hover */}
                <path
                  d={edgePath(r)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={10}
                  onMouseMove={(e) => {
                    if (clearTimer.current) {
                      window.clearTimeout(clearTimer.current);
                      clearTimer.current = null;
                    }
                    const svg = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHoveredEdge({ rel: r, x: e.clientX - svg.left, y: e.clientY - svg.top });
                  }}
                  onMouseLeave={() => setHoveredEdge(null)}
                  style={{ cursor: "help" }}
                />
                <path
                  d={edgePath(r)}
                  fill="none"
                  stroke={strokeFor(r.strength)}
                  strokeWidth={hoveredEdge?.rel === r ? (r.strength === "documented" ? 2.6 : 2) : r.strength === "documented" ? 1.6 : 1.1}
                  strokeDasharray={dashFor(r.strength)}
                  opacity={0.85}
                  style={{ pointerEvents: "none" }}
                />
              </g>
            ))}
          </svg>
          {hoveredEdge && (
            <div
              className="absolute pointer-events-none bg-ink text-parchment text-xs px-2 py-1.5 rounded shadow-lg max-w-xs"
              style={{ left: hoveredEdge.x + 12, top: hoveredEdge.y + 12, zIndex: 10 }}
            >
              <div className="font-medium">
                {peopleByIdLocal.get(hoveredEdge.rel.from)?.name}
                <span className="text-parchment/60 mx-1">— {hoveredEdge.rel.type.replace(/_/g, " ")} →</span>
                {peopleByIdLocal.get(hoveredEdge.rel.to)?.name}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-parchment/60 mt-0.5">
                {hoveredEdge.rel.strength}
              </div>
              {hoveredEdge.rel.notes && (
                <div className="text-parchment/85 mt-1 italic">{hoveredEdge.rel.notes}</div>
              )}
              <div className="text-parchment/60 mt-1 text-[10px]">
                {hoveredEdge.rel.citations.map((c) => c.source).join(" · ")}
              </div>
            </div>
          )}

          {layout.placed.map(({ person, x1, x2, row }) => {
            const left = yearToX(x1);
            const width = Math.max(8, (x2 - x1) * pxPerYear);
            const top = HEADER + row * (ROW_HEIGHT + ROW_GAP);
            const color = REGION_COLOR[person.region];
            const isActive = activeId === person.id;
            const isLocked = lockedId === person.id;
            const inHighlight = highlight?.has(person.id) ?? false;
            const isNeighbor = highlight && inHighlight && !isActive;
            const dimmed = highlight && !inHighlight;
            const showsLabel = condensed || person.significance >= 3 || isLocked || isNeighbor;
            return (
              <a
                key={person.id}
                href={`/fathers/${person.id}`}
                onClick={(e) => handleBarClick(e, person.id)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  router.push(`/fathers/${person.id}`);
                }}
                onMouseEnter={() => setHoverDelayed(person.id)}
                onMouseLeave={() => setHoverDelayed(null)}
                className="absolute flex items-center group cursor-pointer"
                style={{
                  left,
                  top,
                  height: ROW_HEIGHT,
                  zIndex: isActive ? 5 : isNeighbor ? 4 : 3,
                  opacity: dimmed ? 0.18 : 1,
                  transition: "opacity 120ms",
                }}
                title="Click to lock chain · double-click to open page"
              >
                <span
                  className="rounded-sm"
                  style={{
                    width,
                    height: ROW_HEIGHT - 6,
                    backgroundColor: color,
                    opacity: person.role.includes("apostle") ? 1 : 0.88,
                    border: isLocked
                      ? "2px solid #8b1e2d"
                      : isActive
                        ? "2px solid #1f1a13"
                        : isNeighbor
                          ? "1.5px solid #1f1a13"
                          : person.role.includes("bishop")
                            ? "1.5px solid #d4a017"
                            : "none",
                    boxShadow: isLocked
                      ? "0 0 0 2px rgba(139,30,45,0.3)"
                      : isActive
                        ? "0 0 0 2px rgba(31,26,19,0.2)"
                        : undefined,
                  }}
                />
                {showsLabel && (
                  <span
                    className="ml-1.5 text-[10px] whitespace-nowrap font-serif group-hover:text-accent"
                    style={{
                      color: "#1f1a13",
                      fontWeight: isActive || isLocked ? 600 : isNeighbor ? 500 : 400,
                    }}
                  >
                    {person.name}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-3 min-h-[80px]">
        {active ? (
          <div className="p-3 bg-ink/5 border border-ink/10 rounded text-sm">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <Link
                href={`/fathers/${active.id}`}
                className="font-serif text-base font-semibold hover:text-accent underline decoration-ink/20 hover:decoration-accent underline-offset-2"
              >
                {active.name}
              </Link>
              <span className="text-ink/60 text-xs">
                {active.born ?? "?"} – {active.died ?? "?"}
                {active.see ? ` · Bishop of ${active.see}` : ""}
              </span>
              <span className="ml-auto text-xs text-ink/60">
                {activeEdges.length} connection{activeEdges.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-ink/75 mb-2">{active.short_bio}</p>
            {activeEdges.length > 0 && (
              <ul className="text-xs text-ink/65 flex flex-wrap gap-x-3 gap-y-1">
                {activeEdges.slice(0, 12).map((e, i) => {
                  const otherId = e.from === active.id ? e.to : e.from;
                  const other = peopleById.get(otherId);
                  const verb = e.from === active.id ? e.type : `${e.type} (from)`;
                  return (
                    <li key={i}>
                      <span className="text-ink/50">{verb.replace(/_/g, " ")}</span>{" "}
                      <Link
                        href={`/fathers/${otherId}`}
                        className="font-medium hover:text-accent underline decoration-ink/15 hover:decoration-accent underline-offset-2"
                      >
                        {other?.name ?? otherId}
                      </Link>
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
                {activeEdges.length > 12 && (
                  <li className="text-ink/40">+ {activeEdges.length - 12} more</li>
                )}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink/50">
            Each bar spans birth to death. Color = region. Gold border = bishop.{" "}
            <strong>Hover</strong> to highlight connections temporarily.{" "}
            <strong>Click</strong> to lock and scroll horizontally to trace the chain.
          </p>
        )}
      </div>
    </div>
  );
}
