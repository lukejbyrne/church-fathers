"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Person } from "@/lib/schema";

// --- Map projection ----------------------------------------------------------
// Stylized parchment Mediterranean. We use a plain Mercator-ish projection
// over the box (lon -10..45, lat 25..55) mapped into 1200×600. Hand-coded;
// no external topojson required.
const VIEW_W = 1200;
const VIEW_H = 600;
const LON_MIN = -11;
const LON_MAX = 46;
const LAT_MIN = 24;
const LAT_MAX = 56;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VIEW_W;
  // simple Mercator y so high latitudes don't squash everything
  const toMerc = (l: number) =>
    Math.log(Math.tan(Math.PI / 4 + ((l * Math.PI) / 180) / 2));
  const yMin = toMerc(LAT_MIN);
  const yMax = toMerc(LAT_MAX);
  const y = VIEW_H - ((toMerc(lat) - yMin) / (yMax - yMin)) * VIEW_H;
  return [x, y];
}

// --- City lookup -------------------------------------------------------------
// Hardcoded coords for the cities most patristic figures are tied to.
// We match against birth_place / see / death_place by case-insensitive
// substring containment, longest-key first (so "Caesarea Cappadocia" beats
// plain "Caesarea").
const CITY_COORDS: Array<[string, [number, number]]> = [
  ["Wearmouth-Jarrow", [-1.45, 54.91]],
  ["Caesarea Cappadocia", [35.49, 38.72]],
  ["Caesarea Mazaca", [35.49, 38.72]],
  ["Caesarea Maritima", [34.89, 32.5]],
  ["Caesarea Palestine", [34.89, 32.5]],
  ["Caesarea (Palestine)", [34.89, 32.5]],
  ["Caesarea (Cappadocia)", [35.49, 38.72]],
  ["Constantinople", [28.98, 41.0]],
  ["Alexandria", [29.92, 31.2]],
  ["Antioch", [36.16, 36.2]],
  ["Jerusalem", [35.23, 31.78]],
  ["Bethlehem", [35.2, 31.7]],
  ["Damascus", [36.29, 33.51]],
  ["Edessa", [38.79, 37.16]],
  ["Nisibis", [41.21, 37.07]],
  ["Smyrna", [27.14, 38.42]],
  ["Ephesus", [27.34, 37.94]],
  ["Nazianzus", [34.29, 38.49]],
  ["Nyssa", [34.74, 38.86]],
  ["Cappadocia", [35.0, 38.7]],
  ["Athens", [23.73, 37.98]],
  ["Corinth", [22.93, 37.94]],
  ["Thessalonica", [22.95, 40.64]],
  ["Carthage", [10.32, 36.85]],
  ["Hippo Regius", [7.75, 36.9]],
  ["Hippo", [7.75, 36.9]],
  ["Tagaste", [7.95, 36.32]],
  ["Cyrene", [21.86, 32.82]],
  ["Rome", [12.5, 41.9]],
  ["Milan", [9.19, 45.46]],
  ["Aquileia", [13.37, 45.77]],
  ["Ravenna", [12.2, 44.42]],
  ["Cassino", [13.83, 41.49]],
  ["Monte Cassino", [13.83, 41.49]],
  ["Nursia", [12.99, 42.79]],
  ["Lyon", [4.83, 45.76]],
  ["Lyons", [4.83, 45.76]],
  ["Lugdunum", [4.83, 45.76]],
  ["Marseille", [5.37, 43.3]],
  ["Arles", [4.63, 43.68]],
  ["Tours", [0.69, 47.39]],
  ["Poitiers", [0.34, 46.58]],
  ["Vienne", [4.87, 45.52]],
  ["Cordoba", [-4.78, 37.89]],
  ["Hispalis", [-5.99, 37.39]],
  ["Seville", [-5.99, 37.39]],
  ["Iona", [-6.42, 56.33]],
  ["Lindisfarne", [-1.8, 55.68]],
  ["Canterbury", [1.08, 51.28]],
  ["Toledo", [-4.02, 39.86]],
  ["Tarsus", [34.9, 36.92]],
  ["Iconium", [32.49, 37.87]],
  ["Mopsuestia", [35.63, 36.96]],
  ["Salamis", [33.9, 35.18]],
  ["Cyprus", [33.43, 35.13]],
  ["Sinope", [35.16, 42.02]],
  ["Pontus", [37.0, 41.0]],
  ["Bithynia", [30.5, 40.5]],
  ["Galatia", [33.0, 39.5]],
  ["Phrygia", [30.5, 38.5]],
  ["Cilicia", [34.5, 36.8]],
  ["Lystra", [32.5, 37.58]],
  ["Pisidia", [31.0, 37.8]],
  ["Pamphylia", [30.7, 36.9]],
  ["Patmos", [26.55, 37.31]],
  ["Crete", [25.0, 35.2]],
  ["Sicily", [14.27, 37.6]],
  ["Syracuse", [15.29, 37.07]],
  ["Naples", [14.27, 40.85]],
  ["Hippo Diarrhytus", [9.87, 37.27]],
  ["Madaura", [7.78, 36.07]],
  ["Numidia", [6.6, 35.55]],
  ["Mauretania", [-1.6, 34.7]],
  ["Trier", [6.64, 49.75]],
  ["Cologne", [6.96, 50.94]],
  ["Augsburg", [10.9, 48.37]],
  ["Sirmium", [19.61, 44.97]],
  ["Naissus", [21.9, 43.32]],
  ["Nicomedia", [29.92, 40.76]],
  ["Nicaea", [29.72, 40.43]],
  ["Chalcedon", [29.05, 40.99]],
  ["Laodicea", [29.1, 37.84]],
  ["Hierapolis", [29.13, 37.93]],
  ["Sardis", [28.04, 38.49]],
  ["Pergamum", [27.18, 39.13]],
  ["Pergamon", [27.18, 39.13]],
  ["Philadelphia", [28.52, 38.34]],
  ["Tralles", [27.84, 37.85]],
  ["Magnesia", [27.52, 37.86]],
  ["Lampsacus", [26.7, 40.34]],
  ["Heraclea", [27.97, 40.96]],
  ["Adrianople", [26.55, 41.68]],
  ["Berea", [22.2, 40.52]],
  ["Beroea", [22.2, 40.52]],
  ["Philippi", [24.29, 41.01]],
  ["Tyana", [34.6, 37.85]],
  ["Tyre", [35.2, 33.27]],
  ["Sidon", [35.37, 33.56]],
  ["Beirut", [35.5, 33.89]],
  ["Berytus", [35.5, 33.89]],
  ["Gaza", [34.46, 31.5]],
  ["Petra", [35.45, 30.32]],
  ["Memphis", [31.25, 29.85]],
  ["Thebes", [32.64, 25.7]],
  ["Nitria", [30.42, 30.85]],
  ["Scetis", [30.35, 30.36]],
  ["Wadi Natrun", [30.35, 30.36]],
  ["Pispir", [31.7, 28.95]],
  ["Tabennisi", [32.65, 26.1]],
  ["Pachomius", [32.65, 26.1]],
  ["Oxyrhynchus", [30.65, 28.53]],
  ["Akhmim", [31.74, 26.56]],
  ["Panopolis", [31.74, 26.56]],
  ["Lycopolis", [31.18, 27.18]],
  ["Cucusus", [36.78, 38.36]],
  ["Comana", [36.55, 40.27]],
  ["Sebaste", [37.15, 39.75]],
  ["Annisi", [36.0, 40.5]],
  ["Stridon", [16.5, 45.4]],
  ["Cremona", [10.02, 45.13]],
  ["Aquae Sulis", [-2.36, 51.38]],
  ["Bath", [-2.36, 51.38]],
  ["Britain", [-1.5, 52.5]],
  ["Britannia", [-1.5, 52.5]],
  ["Ireland", [-8.0, 53.4]],
  ["Hibernia", [-8.0, 53.4]],
  ["Armagh", [-6.65, 54.35]],
  ["Whithorn", [-4.42, 54.73]],
  ["Galloway", [-4.42, 54.73]],
  // Regions, last (broadest fallback)
  ["Palestine", [35.0, 31.9]],
  ["Syria", [38.0, 35.0]],
  ["Egypt", [30.0, 28.0]],
  ["Asia Minor", [32.0, 39.0]],
  ["Anatolia", [32.0, 39.0]],
  ["Africa", [10.0, 35.5]],
  ["Gaul", [3.0, 46.5]],
  ["Italy", [12.5, 42.5]],
  ["Greece", [22.5, 39.0]],
  ["Spain", [-4.0, 40.0]],
  ["Hispania", [-4.0, 40.0]],
];

// Sort longest first so more specific keys win
const CITY_TABLE = [...CITY_COORDS].sort((a, b) => b[0].length - a[0].length);

function lookupCoords(s: string | undefined): [number, number] | null {
  if (!s) return null;
  const lower = s.toLowerCase();
  for (const [name, coord] of CITY_TABLE) {
    if (lower.includes(name.toLowerCase())) return coord;
  }
  return null;
}

function placeFor(p: Person): { coord: [number, number]; source: string } | null {
  // Prefer birth_place; fall back to see, then death_place
  const candidates: Array<[string | undefined, string]> = [
    [p.birth_place, "born"],
    [p.see, "see"],
    [p.death_place, "died"],
  ];
  for (const [val, src] of candidates) {
    const c = lookupCoords(val);
    if (c) return { coord: c, source: src };
  }
  return null;
}

// --- Eras --------------------------------------------------------------------
const ERAS = [
  { label: "Apostolic", from: 5, to: 100 },
  { label: "Apostolic Fathers", from: 100, to: 200 },
  { label: "Ante-Nicene", from: 200, to: 325 },
  { label: "Nicene", from: 325, to: 451 },
  { label: "Post-Nicene", from: 451, to: 600 },
  { label: "Early Medieval", from: 600, to: 760 },
];
function eraFor(year: number) {
  return ERAS.find((e) => year >= e.from && year < e.to) ?? ERAS[ERAS.length - 1];
}

// --- Stylized Mediterranean coastline ---------------------------------------
// A hand-traced approximate outline. Each polygon is [lon, lat] vertices.
const COASTLINES: Array<Array<[number, number]>> = [
  // North coast: Iberia, Gaul, Italy, Balkans, Greece, Asia Minor, Levant
  [
    [-9, 36],
    [-8, 37.2],
    [-9, 38.7],
    [-8.5, 41.2],
    [-9, 43],
    [-7, 43.7],
    [-4, 43.5],
    [-1.5, 43.4],
    [0.5, 42.7],
    [3, 42.5],
    [3.2, 43.4],
    [4.8, 43.3],
    [7, 43.6],
    [9, 44.1],
    [10.2, 43.9],
    [11.0, 42.5],
    [12.5, 41.5],
    [13.7, 40.7],
    [15.5, 40.0],
    [17.2, 40.4],
    [18.5, 40.1],
    [18.5, 41.5],
    [16.3, 41.9],
    [15.7, 43.0],
    [14.5, 43.5],
    [13.0, 45.5],
    [13.6, 45.7],
    [15.0, 44.3],
    [16.5, 43.0],
    [18.5, 42.6],
    [19.5, 41.8],
    [20.0, 39.5],
    [21.0, 38.5],
    [21.0, 37.0],
    [22.5, 36.7],
    [23.0, 37.6],
    [23.7, 38.0],
    [22.7, 38.5],
    [22.5, 39.5],
    [23.5, 40.3],
    [24.5, 40.7],
    [26.0, 40.5],
    [26.6, 40.8],
    [26.0, 41.5],
    [27.5, 41.0],
    [29.0, 41.0],
    [30.0, 41.2],
    [33.0, 42.0],
    [36.0, 41.3],
    [38.0, 41.0],
    [41.0, 41.5],
    [36.5, 36.6],
    [35.7, 36.0],
    [35.4, 35.0],
    [35.0, 33.0],
    [34.7, 31.6],
    [34.3, 31.2],
    [33.5, 31.1],
    [32.0, 31.2],
    [30.5, 31.4],
    [29.0, 31.0],
    [27.5, 31.3],
    [25.0, 31.5],
    [22.5, 32.7],
    [20.0, 32.0],
    [17.0, 31.0],
    [15.0, 31.2],
    [13.0, 32.7],
    [11.5, 33.5],
    [10.5, 34.5],
    [10.5, 36.5],
    [9.0, 37.3],
    [7.5, 37.0],
    [4.0, 36.5],
    [0.5, 35.8],
    [-2.0, 35.3],
    [-5.0, 35.7],
    [-5.5, 36.0],
    [-9, 36],
  ],
  // British Isles (rough)
  [
    [-5.5, 50.0],
    [-4.5, 51.7],
    [-5.0, 53.5],
    [-4.5, 54.8],
    [-3.0, 55.8],
    [-3.5, 58.5],
    [-1.5, 58.5],
    [-1.0, 56.5],
    [0.5, 53.5],
    [1.5, 52.5],
    [0.5, 51.0],
    [-1.5, 50.7],
    [-3.5, 50.5],
    [-5.5, 50.0],
  ],
  // Ireland
  [
    [-10.0, 51.5],
    [-9.5, 53.5],
    [-8.5, 55.0],
    [-6.5, 55.2],
    [-5.5, 54.5],
    [-6.5, 52.2],
    [-9.5, 51.5],
    [-10.0, 51.5],
  ],
];

function pathFromRing(ring: Array<[number, number]>): string {
  return (
    ring
      .map(([lon, lat], i) => {
        const [x, y] = project(lon, lat);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

// --- Component ---------------------------------------------------------------
type Props = { people: Person[] };

const YEAR_MIN = 30;
const YEAR_MAX = 760;
const PLAY_DURATION_MS = 30_000;

export default function MapView({ people }: Props) {
  const router = useRouter();
  const [year, setYear] = useState(200);
  const [playing, setPlaying] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const playStart = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  // Pre-compute placements
  const placed = useMemo(() => {
    const out: Array<{
      person: Person;
      coord: [number, number];
      x: number;
      y: number;
      bornEst: number;
      diedEst: number;
    }> = [];
    // Jitter map: cluster figures at same city so they don't perfectly overlap.
    const buckets = new Map<string, number>();
    for (const p of people) {
      const place = placeFor(p);
      if (!place) continue;
      const born = p.born ?? (p.died ? p.died - 60 : 100);
      const died = p.died ?? born + 70;
      const key = `${place.coord[0].toFixed(2)},${place.coord[1].toFixed(2)}`;
      const idx = buckets.get(key) ?? 0;
      buckets.set(key, idx + 1);
      // deterministic jitter ring
      const angle = (idx * 137.5 * Math.PI) / 180;
      const radius = idx === 0 ? 0 : 6 + Math.sqrt(idx) * 4;
      const [px, py] = project(place.coord[0], place.coord[1]);
      out.push({
        person: p,
        coord: place.coord,
        x: px + Math.cos(angle) * radius,
        y: py + Math.sin(angle) * radius,
        bornEst: born,
        diedEst: died,
      });
    }
    return out;
  }, [people]);

  // Auto-play loop
  useEffect(() => {
    if (!playing) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      playStart.current = null;
      return;
    }
    const startYear = year >= YEAR_MAX - 1 ? YEAR_MIN : year;
    playStart.current = performance.now();
    const startSnapshot = startYear;
    const tick = (t: number) => {
      const elapsed = t - (playStart.current ?? t);
      const frac = Math.min(
        1,
        elapsed /
          (PLAY_DURATION_MS *
            ((YEAR_MAX - startSnapshot) / (YEAR_MAX - YEAR_MIN)))
      );
      const next = startSnapshot + frac * (YEAR_MAX - startSnapshot);
      setYear(next);
      if (frac >= 1) {
        setPlaying(false);
        return;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const yearInt = Math.round(year);
  const era = eraFor(yearInt);

  const coastlinePaths = useMemo(() => COASTLINES.map(pathFromRing), []);

  const hovered = hoverId ? placed.find((p) => p.person.id === hoverId) : null;

  function fillFor(p: Person) {
    if (p.role.includes("apostle")) return "#8b1e2d";
    return "#1f1a13";
  }
  function strokeFor(p: Person) {
    if (p.role.includes("bishop")) return "#d4a017";
    return "transparent";
  }
  function radiusFor(p: Person) {
    if (p.significance >= 4) return 8;
    if (p.significance === 3) return 6;
    return 4;
  }

  return (
    <div className="bg-parchment">
      <div className="flex items-baseline gap-4 mb-4 flex-wrap">
        <div className="font-serif text-5xl tracking-tight">
          AD {yearInt}
        </div>
        <div className="text-sm uppercase tracking-widest text-ink/55 font-serif">
          {era.label}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-3 py-1.5 rounded border border-ink/30 hover:border-accent hover:text-accent text-sm font-medium"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setYear(YEAR_MIN);
            }}
            className="px-3 py-1.5 rounded border border-ink/20 hover:border-ink/40 text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      <input
        type="range"
        min={YEAR_MIN}
        max={YEAR_MAX}
        step={1}
        value={yearInt}
        onChange={(e) => {
          setPlaying(false);
          setYear(parseInt(e.target.value, 10));
        }}
        className="w-full accent-accent mb-4"
        aria-label="Year scrubber"
      />

      <div className="flex justify-between text-[10px] text-ink/45 mb-4 -mt-2 font-mono">
        {[30, 100, 200, 300, 400, 500, 600, 700, 760].map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>

      <div className="relative border border-ink/15 rounded overflow-hidden">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          className="block"
          style={{ background: "#ece3cc" }}
          onMouseLeave={() => {
            setHoverId(null);
            setTooltip(null);
          }}
        >
          <defs>
            <radialGradient id="parchmentBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#f5efe1" />
              <stop offset="100%" stopColor="#e4d8b8" />
            </radialGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Sea/background */}
          <rect width={VIEW_W} height={VIEW_H} fill="url(#parchmentBg)" />

          {/* Lat/lon grid (subtle) */}
          {[-10, 0, 10, 20, 30, 40].map((lon) => {
            const [x] = project(lon, 0);
            return (
              <line
                key={`lon-${lon}`}
                x1={x}
                x2={x}
                y1={0}
                y2={VIEW_H}
                stroke="#1f1a13"
                strokeOpacity={0.05}
                strokeDasharray="2,4"
              />
            );
          })}
          {[30, 35, 40, 45, 50, 55].map((lat) => {
            const [, y] = project(0, lat);
            return (
              <line
                key={`lat-${lat}`}
                x1={0}
                x2={VIEW_W}
                y1={y}
                y2={y}
                stroke="#1f1a13"
                strokeOpacity={0.05}
                strokeDasharray="2,4"
              />
            );
          })}

          {/* Land */}
          {coastlinePaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#f5efe1"
              stroke="#1f1a13"
              strokeOpacity={0.55}
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
          ))}

          {/* Region labels */}
          {[
            { label: "GAUL", lon: 3, lat: 47 },
            { label: "ITALIA", lon: 13.5, lat: 43.5 },
            { label: "GRAECIA", lon: 22, lat: 39.7 },
            { label: "ASIA MINOR", lon: 32, lat: 39 },
            { label: "SYRIA", lon: 38, lat: 35.3 },
            { label: "PALESTINA", lon: 35.5, lat: 32.0 },
            { label: "AEGYPTUS", lon: 29.5, lat: 28.5 },
            { label: "AFRICA", lon: 10, lat: 34.0 },
            { label: "HISPANIA", lon: -4, lat: 40 },
            { label: "BRITANNIA", lon: -2, lat: 53.5 },
          ].map((r) => {
            const [x, y] = project(r.lon, r.lat);
            return (
              <text
                key={r.label}
                x={x}
                y={y}
                fontSize={11}
                fontFamily="Cormorant Garamond, Georgia, serif"
                fill="#1f1a13"
                opacity={0.35}
                textAnchor="middle"
                style={{ letterSpacing: "0.15em" }}
              >
                {r.label}
              </text>
            );
          })}

          {/* Figure circles */}
          {placed.map((item) => {
            const { person, x, y, bornEst, diedEst } = item;
            const active = yearInt >= bornEst && yearInt <= diedEst;
            const isHover = hoverId === person.id;
            const r = radiusFor(person);
            return (
              <g
                key={person.id}
                style={{
                  cursor: "pointer",
                  transition: "opacity 240ms",
                  opacity: active ? 1 : 0.08,
                }}
                onMouseEnter={(e) => {
                  setHoverId(person.id);
                  const svg = (
                    e.currentTarget.ownerSVGElement as SVGSVGElement
                  ).getBoundingClientRect();
                  const ratio = VIEW_W / svg.width;
                  setTooltip({
                    x: x / ratio,
                    y: y / ratio,
                  });
                }}
                onMouseLeave={() => {
                  setHoverId(null);
                  setTooltip(null);
                }}
                onClick={() => router.push(`/fathers/${person.id}`)}
              >
                {active && (
                  <circle
                    cx={x}
                    cy={y}
                    r={r + 4}
                    fill={fillFor(person)}
                    opacity={0.25}
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="r"
                      values={`${r + 2};${r + 7};${r + 2}`}
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.35;0.05;0.35"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isHover ? r + 1.5 : r}
                  fill={fillFor(person)}
                  stroke={strokeFor(person)}
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>

        {hovered && tooltip && (
          <div
            className="absolute pointer-events-none bg-ink text-parchment text-xs px-2 py-1.5 rounded shadow-lg max-w-xs"
            style={{
              left: `calc(${(tooltip.x / VIEW_W) * 100}% + 12px)`,
              top: `calc(${(tooltip.y / VIEW_H) * 100}% + 12px)`,
              zIndex: 10,
            }}
          >
            <div className="font-serif text-sm">{hovered.person.name}</div>
            <div className="text-parchment/70 text-[10px]">
              {hovered.person.born ?? "?"} – {hovered.person.died ?? "?"}
              {hovered.person.see ? ` · Bishop of ${hovered.person.see}` : ""}
            </div>
            {hovered.person.birth_place && (
              <div className="text-parchment/60 text-[10px] italic">
                b. {hovered.person.birth_place}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/65">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: "#8b1e2d" }}
          />
          Apostle
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-full border-2"
            style={{ borderColor: "#d4a017", backgroundColor: "#1f1a13" }}
          />
          Bishop
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: "#1f1a13" }}
          />
          Other
        </span>
        <span className="ml-auto text-ink/45 italic">
          {placed.filter((p) => yearInt >= p.bornEst && yearInt <= p.diedEst).length}{" "}
          alive in AD {yearInt} of {placed.length} mapped
        </span>
      </div>
    </div>
  );
}
