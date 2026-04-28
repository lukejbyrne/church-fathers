"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Person } from "@/lib/schema";
import { dateRange } from "@/lib/dates";

// --- Map projection ----------------------------------------------------------
// Equirectangular projection over the bounding box [lon -12..50, lat 25..60]
// mapped into a 1200×600 SVG viewBox. Adequate for this latitude range and
// avoids the visual oddities of a hand-coded coastline.
const VIEW_W = 1200;
const VIEW_H = 600;
const LON_MIN = -12;
const LON_MAX = 50;
const LAT_MIN = 25;
const LAT_MAX = 60;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VIEW_W;
  const y = VIEW_H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * VIEW_H;
  return [x, y];
}

// --- City lookup -------------------------------------------------------------
// Coordinates as [lon, lat] (note: lon first).
// Matched against birth_place / see / death_place by case-insensitive
// substring containment, longest-key first (so "Caesarea Cappadocia"
// beats plain "Caesarea").
const CITY_COORDS: Array<[string, [number, number]]> = [
  // Major cities (canonical, with explicit labels on the map)
  ["Wearmouth-Jarrow", [-1.46, 54.99]],
  ["Caesarea Cappadocia", [35.48, 38.72]],
  ["Caesarea Mazaca", [35.48, 38.72]],
  ["Caesarea Maritima", [34.9, 32.5]],
  ["Caesarea Palestine", [34.9, 32.5]],
  ["Caesarea (Palestine)", [34.9, 32.5]],
  ["Caesarea (Cappadocia)", [35.48, 38.72]],
  ["Constantinople", [28.95, 41.0]],
  ["Alexandria", [29.92, 31.2]],
  ["Antioch", [36.16, 36.2]],
  ["Jerusalem", [35.22, 31.78]],
  ["Bethlehem", [35.2, 31.7]],
  ["Damascus", [36.3, 33.51]],
  ["Edessa", [38.79, 37.16]],
  ["Nisibis", [41.21, 37.07]],
  ["Smyrna", [27.14, 38.42]],
  ["Ephesus", [27.34, 37.95]],
  ["Nazianzus", [34.45, 38.42]],
  ["Nyssa", [34.74, 38.86]],
  ["Cappadocia", [35.0, 38.7]],
  ["Athens", [23.73, 37.98]],
  ["Corinth", [22.93, 37.94]],
  ["Thessalonica", [22.95, 40.64]],
  ["Carthage", [10.32, 36.85]],
  ["Hippo Regius", [7.77, 36.9]],
  ["Hippo", [7.77, 36.9]],
  ["Tagaste", [7.95, 36.28]],
  ["Cyrene", [21.86, 32.82]],
  ["Rome", [12.5, 41.9]],
  ["Milan", [9.19, 45.46]],
  ["Aquileia", [13.37, 45.77]],
  ["Ravenna", [12.2, 44.42]],
  ["Cassino", [13.83, 41.49]],
  ["Monte Cassino", [13.83, 41.49]],
  ["Nursia", [12.99, 42.79]],
  ["Lyon", [4.84, 45.76]],
  ["Lyons", [4.84, 45.76]],
  ["Lugdunum", [4.84, 45.76]],
  ["Marseille", [5.37, 43.3]],
  ["Massilia", [5.37, 43.3]],
  ["Arles", [4.63, 43.68]],
  ["Tours", [0.69, 47.39]],
  ["Poitiers", [0.34, 46.58]],
  ["Vienne", [4.87, 45.52]],
  ["Cordoba", [-4.78, 37.88]],
  ["Hispalis", [-5.99, 37.39]],
  ["Seville", [-5.99, 37.39]],
  ["Lisbon", [-9.14, 38.72]],
  ["Iona", [-6.39, 56.33]],
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
  ["Nazareth", [35.3, 32.7]],
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

function lookupCityName(s: string | undefined): string | null {
  if (!s) return null;
  const lower = s.toLowerCase();
  for (const [name] of CITY_TABLE) {
    if (lower.includes(name.toLowerCase())) return name;
  }
  return null;
}

function placeFor(p: Person): {
  coord: [number, number];
  city: string;
  source: string;
} | null {
  const candidates: Array<[string | undefined, string]> = [
    [p.birth_place, "born"],
    [p.see, "see"],
    [p.death_place, "died"],
  ];
  for (const [val, src] of candidates) {
    const c = lookupCoords(val);
    const name = lookupCityName(val);
    if (c && name) return { coord: c, city: name, source: src };
  }
  return null;
}

// --- Landmasses (approximate coastline polygons in [lon, lat]) --------------
function pathFromCoords(coords: Array<[number, number]>): string {
  if (coords.length === 0) return "";
  const parts = coords.map(([lon, lat], i) => {
    const [x, y] = project(lon, lat);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return parts.join(" ") + " Z";
}

const LANDMASSES: Array<Array<[number, number]>> = [
  // Iberian peninsula (Spain + Portugal)
  [
    [-9.5, 36.0], [-8.9, 37.0], [-9.0, 38.7], [-9.5, 39.4], [-8.9, 41.7],
    [-8.8, 43.4], [-7.6, 43.8], [-5.5, 43.6], [-3.8, 43.5], [-1.8, 43.4],
    [-0.5, 43.3], [0.7, 42.7], [2.0, 42.4], [3.2, 41.9], [2.1, 41.3],
    [0.7, 40.6], [-0.5, 39.4], [0.2, 38.7], [-0.7, 37.6], [-2.1, 36.7],
    [-4.4, 36.7], [-5.6, 36.0], [-6.5, 36.2], [-7.4, 37.2], [-8.8, 37.0],
    [-9.0, 36.2],
  ],
  // France / Gaul
  [
    [-1.8, 43.4], [-1.2, 44.7], [-1.1, 46.2], [-2.2, 47.3], [-4.7, 48.4],
    [-1.6, 48.6], [-1.3, 49.7], [0.2, 49.7], [1.6, 50.1], [1.85, 50.95],
    [2.6, 51.0], [4.0, 51.4], [5.1, 51.4], [6.2, 50.9], [6.6, 49.8],
    [7.6, 49.0], [8.2, 48.9], [7.8, 47.6], [7.1, 46.3], [6.8, 45.9],
    [7.0, 44.2], [7.5, 43.8], [6.0, 43.2], [4.6, 43.5], [3.0, 43.2],
    [1.5, 42.7], [0.7, 42.7], [-0.5, 43.3], [-1.5, 43.3],
  ],
  // Britain
  [
    [-5.7, 50.1], [-4.0, 50.4], [-3.0, 50.7], [-1.5, 50.7], [0.7, 50.8],
    [1.4, 51.4], [1.1, 52.0], [1.7, 52.8], [0.4, 53.2], [0.2, 54.0],
    [-1.4, 54.6], [-1.6, 55.6], [-2.2, 56.4], [-3.1, 56.0], [-3.8, 56.1],
    [-5.6, 55.4], [-5.1, 56.7], [-5.8, 57.6], [-3.0, 58.6], [-3.0, 60.0],
    [-1.0, 60.0], [-1.1, 58.5], [-2.1, 57.7], [-3.1, 57.7], [-2.0, 56.8],
    [-1.4, 54.6], [-3.0, 54.0], [-3.5, 53.4], [-4.7, 53.4], [-3.1, 51.5],
    [-4.2, 51.2], [-5.0, 51.6], [-4.6, 50.4],
  ],
  // Ireland
  [
    [-10.4, 51.5], [-9.9, 52.2], [-9.9, 53.1], [-10.0, 54.3], [-8.6, 54.7],
    [-7.3, 55.3], [-5.9, 55.2], [-6.1, 54.4], [-5.4, 54.2], [-6.0, 53.4],
    [-6.2, 52.2], [-7.6, 51.7], [-9.5, 51.5],
  ],
  // Italian peninsula
  [
    [7.5, 43.8], [8.95, 44.4], [10.0, 44.0], [12.2, 44.0], [12.5, 44.5],
    [13.5, 45.7], [13.37, 45.77], [13.6, 45.6], [13.8, 45.5], [13.8, 44.9],
    [14.5, 42.4], [15.5, 41.9], [16.0, 41.9], [17.0, 41.0], [18.4, 40.1],
    [18.4, 39.8], [17.9, 40.5], [17.2, 40.4], [16.5, 39.8], [17.1, 38.9],
    [16.6, 38.4], [16.1, 37.9], [15.65, 38.2], [15.6, 38.7], [14.0, 40.0],
    [13.8, 41.1], [12.0, 41.0], [11.0, 42.4], [10.0, 42.9], [9.8, 43.9],
    [8.5, 44.0],
  ],
  // Sicily
  [
    [12.4, 37.8], [13.5, 38.2], [15.1, 38.3], [15.65, 38.2], [15.3, 37.4],
    [15.2, 36.7], [14.5, 36.7], [12.7, 37.6],
  ],
  // Sardinia
  [
    [8.4, 39.1], [8.4, 40.0], [8.2, 40.8], [9.0, 41.2], [9.6, 40.9],
    [9.7, 40.0], [9.5, 39.2], [8.8, 38.9],
  ],
  // Corsica
  [
    [8.6, 41.4], [8.7, 42.4], [9.3, 43.0], [9.5, 42.5], [9.4, 41.8],
    [9.0, 41.4],
  ],
  // Balkans (Greece + Macedonia + Albania) - simplified, includes Peloponnese
  [
    [13.6, 45.6], [14.5, 45.5], [15.2, 44.3], [16.2, 43.5], [17.5, 42.9],
    [18.5, 42.4], [19.3, 41.9], [19.4, 41.3], [19.5, 40.0], [20.0, 39.6],
    [20.7, 38.8], [21.1, 38.3], [21.6, 38.3], [22.6, 38.3], [22.9, 38.0],
    [22.5, 37.6], [23.2, 37.5], [22.8, 36.8], [22.48, 36.39], [22.1, 36.7],
    [21.7, 37.0], [21.1, 37.5], [21.4, 38.1], [22.9, 38.4], [23.1, 38.0],
    [23.7, 37.98], [24.0, 38.3], [23.5, 38.6], [22.95, 40.65], [23.7, 40.6],
    [24.3, 40.7], [24.29, 41.01], [25.5, 40.9], [26.55, 41.68], [26.4, 41.3],
    [27.0, 41.5], [27.4, 42.4], [28.0, 43.4], [27.5, 44.0], [25.0, 43.7],
    [22.5, 44.2], [22.4, 44.8], [21.5, 45.0], [20.0, 45.0], [19.0, 44.9],
    [18.0, 45.1], [16.5, 45.3], [15.5, 45.5],
  ],
  // Crete
  [
    [23.5, 35.3], [24.5, 35.6], [25.7, 35.4], [26.3, 35.3], [25.7, 34.95],
    [24.5, 34.95], [23.5, 35.2],
  ],
  // Cyprus
  [
    [32.3, 34.7], [32.5, 35.1], [33.5, 35.4], [34.55, 35.7], [34.0, 35.0],
    [33.0, 34.6],
  ],
  // Anatolia (Turkey)
  [
    [26.1, 40.0], [26.1, 40.6], [26.7, 40.4], [27.2, 40.4], [28.95, 41.0],
    [29.5, 41.2], [31.0, 41.3], [32.5, 42.0], [35.16, 42.02], [37.0, 41.0],
    [39.5, 41.1], [41.5, 41.4], [41.5, 41.0], [42.5, 40.0], [43.5, 39.7],
    [44.5, 38.5], [44.0, 37.5], [42.5, 37.3], [41.21, 37.07], [40.0, 37.1],
    [38.79, 37.16], [37.5, 36.9], [36.6, 36.5], [36.16, 36.2], [35.9, 36.6],
    [35.5, 36.6], [34.9, 36.92], [33.5, 36.2], [32.0, 36.3], [31.0, 36.4],
    [30.7, 36.9], [30.0, 36.8], [29.0, 36.7], [28.2, 36.8], [27.4, 37.0],
    [27.34, 37.95], [26.7, 38.4], [27.14, 38.42], [26.6, 39.0], [26.7, 40.34],
  ],
  // Levant (coast from Antakya to Sinai)
  [
    [36.16, 36.2], [36.0, 35.5], [35.9, 34.9], [35.7, 34.5], [35.5, 33.89],
    [35.37, 33.56], [35.2, 33.27], [35.1, 32.9], [34.95, 32.5], [34.9, 32.5],
    [34.7, 32.0], [34.46, 31.5], [34.2, 31.2], [34.5, 30.5], [35.0, 29.5],
    [35.45, 30.32], [36.0, 31.5], [36.3, 33.51], [37.0, 34.5], [37.5, 35.5],
    [37.5, 36.5], [36.6, 36.5],
  ],
  // North Africa (Morocco -> Egypt, closing south of viewBox)
  [
    [-9.5, 32.5], [-7.5, 33.5], [-5.83, 35.78], [-5.0, 35.9], [-3.0, 35.5],
    [-1.5, 35.3], [0.0, 35.7], [1.5, 36.5], [3.04, 36.78], [5.0, 36.8],
    [7.0, 37.0], [8.5, 36.9], [9.5, 37.3], [10.18, 36.8], [10.5, 36.0],
    [11.0, 35.0], [10.5, 34.0], [10.5, 33.5], [11.5, 33.2], [13.18, 32.89],
    [15.0, 32.4], [17.0, 31.2], [19.0, 30.8], [20.5, 30.9], [21.86, 32.82],
    [22.5, 32.5], [23.5, 32.2], [25.0, 31.5], [26.5, 31.4], [28.0, 31.0],
    [29.92, 31.2], [30.5, 31.5], [31.5, 31.5], [32.5, 31.3], [34.0, 31.3],
    [34.2, 31.2], [34.5, 30.5], [34.0, 29.5], [33.0, 28.0], [32.0, 26.0],
    [31.0, 24.5], [29.0, 24.0], [25.0, 24.0], [20.0, 24.0], [15.0, 24.0],
    [10.0, 24.0], [5.0, 24.0], [0.0, 24.0], [-5.0, 25.0], [-9.5, 27.0],
    [-10.0, 30.0],
  ],
  // Black Sea north coast (Crimea / Pontus shelf, top of viewBox)
  [
    [28.0, 60.0], [28.0, 46.5], [29.5, 45.5], [31.0, 46.5], [32.5, 46.0],
    [33.5, 44.4], [35.0, 45.0], [36.5, 45.3], [37.5, 47.0], [39.0, 47.2],
    [40.5, 46.0], [42.0, 45.5], [42.5, 43.5], [41.5, 41.4], [50.0, 41.4],
    [50.0, 60.0],
  ],
];

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

// --- Component ---------------------------------------------------------------
type Props = { people: Person[] };

const YEAR_MIN = 30;
const YEAR_MAX = 760;
const PLAY_DURATION_MS = 30_000;
const DEFAULT_YEAR = 50;

export default function MapView({ people }: Props) {
  const router = useRouter();
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [playing, setPlaying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverCity, setHoverCity] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const playStart = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  // Pre-compute placements for ALL people (we filter at render-time)
  const placedAll = useMemo(() => {
    const out: Array<{
      person: Person;
      coord: [number, number];
      city: string;
      x: number;
      y: number;
      bornEst: number;
      diedEst: number;
    }> = [];
    const buckets = new Map<string, number>();
    for (const p of people) {
      const place = placeFor(p);
      if (!place) continue;
      const born = p.born ?? (p.died ? p.died - 60 : 100);
      const died = p.died ?? born + 70;
      const key = `${place.coord[0].toFixed(2)},${place.coord[1].toFixed(2)}`;
      const idx = buckets.get(key) ?? 0;
      buckets.set(key, idx + 1);
      const angle = (idx * 137.5 * Math.PI) / 180;
      const radius = idx === 0 ? 0 : 6 + Math.sqrt(idx) * 4;
      const [px, py] = project(place.coord[0], place.coord[1]);
      out.push({
        person: p,
        coord: place.coord,
        city: place.city,
        x: px + Math.cos(angle) * radius,
        y: py + Math.sin(angle) * radius,
        bornEst: born,
        diedEst: died,
      });
    }
    return out;
  }, [people]);

  // Apply significance filter
  const placed = useMemo(
    () => placedAll.filter((p) => showAll || p.person.significance >= 2),
    [placedAll, showAll]
  );

  // Cities that have any plotted figure — these are the labels we render
  const cityLabels = useMemo(() => {
    const map = new Map<
      string,
      { name: string; lon: number; lat: number; count: number }
    >();
    for (const item of placed) {
      const existing = map.get(item.city);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(item.city, {
          name: item.city,
          lon: item.coord[0],
          lat: item.coord[1],
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [placed]);

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

  const hovered = hoverId ? placed.find((p) => p.person.id === hoverId) : null;
  const hoveredCity = hoverCity
    ? cityLabels.find((c) => c.name === hoverCity)
    : null;

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
        <div className="font-serif text-5xl tracking-tight">AD {yearInt}</div>
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
              setYear(DEFAULT_YEAR);
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

      <div className="flex justify-between text-[10px] text-ink/45 mb-3 -mt-2 font-mono">
        {[30, 100, 200, 300, 400, 500, 600, 700, 760].map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-xs text-ink/65">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="accent-accent"
          />
          Show all figures (including minor)
        </label>
        <span className="text-ink/50 italic">
          Drag to set year. Press Play for a 30-second sweep. Hover any figure
          for details, click to open their page.
        </span>
      </div>

      <div className="relative border border-ink/15 rounded overflow-hidden">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          className="block"
          style={{ background: "#ece3cc" }}
          onMouseLeave={() => {
            setHoverId(null);
            setHoverCity(null);
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

          {/* Parchment background */}
          <rect width={VIEW_W} height={VIEW_H} fill="url(#parchmentBg)" />

          {/* Sea tint */}
          <rect width={VIEW_W} height={VIEW_H} fill="#dbe4ea" opacity={0.75} />

          {/* Land polygons */}
          {LANDMASSES.map((coords, i) => (
            <path
              key={`land-${i}`}
              d={pathFromCoords(coords)}
              fill="#f5efe0"
              stroke="#1f1a13"
              strokeOpacity={0.13}
              strokeWidth={0.7}
            />
          ))}

          {/* Faint lat/lon grid */}
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

          {/* Region labels (very faint, just orientation) */}
          {[
            { label: "GAUL", lon: 3, lat: 47.5 },
            { label: "ITALIA", lon: 13.5, lat: 43 },
            { label: "GRAECIA", lon: 22, lat: 39.7 },
            { label: "ASIA MINOR", lon: 32, lat: 39 },
            { label: "SYRIA", lon: 38, lat: 35.3 },
            { label: "AEGYPTUS", lon: 29.5, lat: 27.5 },
            { label: "AFRICA", lon: 10, lat: 33.5 },
            { label: "HISPANIA", lon: -4, lat: 40 },
            { label: "BRITANNIA", lon: -2.5, lat: 53.5 },
          ].map((r) => {
            const [x, y] = project(r.lon, r.lat);
            return (
              <text
                key={r.label}
                x={x}
                y={y}
                fontSize={13}
                fontFamily="Cormorant Garamond, Georgia, serif"
                fill="#1f1a13"
                opacity={0.18}
                textAnchor="middle"
                style={{ letterSpacing: "0.2em" }}
              >
                {r.label}
              </text>
            );
          })}

          {/* City labels — these ARE the geography */}
          {cityLabels.map((c) => {
            const [x, y] = project(c.lon, c.lat);
            const isHover = hoverCity === c.name;
            return (
              <g
                key={c.name}
                style={{ cursor: "default" }}
                onMouseEnter={(e) => {
                  setHoverCity(c.name);
                  setHoverId(null);
                  const svg = (
                    e.currentTarget.ownerSVGElement as SVGSVGElement
                  ).getBoundingClientRect();
                  const ratio = VIEW_W / svg.width;
                  setTooltip({ x: x / ratio, y: y / ratio });
                }}
                onMouseLeave={() => {
                  setHoverCity(null);
                  setTooltip(null);
                }}
              >
                {/* tiny tick at the actual coord */}
                <circle
                  cx={x}
                  cy={y}
                  r={1.6}
                  fill="#1f1a13"
                  opacity={0.55}
                />
                <text
                  x={x + 5}
                  y={y - 5}
                  fontSize={11}
                  fontFamily="Cormorant Garamond, Georgia, serif"
                  fontStyle="italic"
                  fill="#1f1a13"
                  opacity={isHover ? 0.95 : 0.55}
                  style={{ pointerEvents: "none" }}
                >
                  {c.name}
                </text>
                {/* invisible larger hit-target */}
                <rect
                  x={x - 6}
                  y={y - 16}
                  width={Math.max(80, c.name.length * 6.5)}
                  height={22}
                  fill="transparent"
                />
              </g>
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
                  cursor: active ? "pointer" : "default",
                  transition: "opacity 240ms",
                  opacity: active ? 1 : 0.08,
                  pointerEvents: active ? "auto" : "none",
                }}
                onMouseEnter={(e) => {
                  setHoverId(person.id);
                  setHoverCity(null);
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
              {dateRange(hovered.person).text}
              {hovered.person.see ? ` · Bishop of ${hovered.person.see}` : ""}
            </div>
            {hovered.person.birth_place && (
              <div className="text-parchment/60 text-[10px] italic">
                b. {hovered.person.birth_place}
              </div>
            )}
          </div>
        )}

        {hoveredCity && tooltip && !hovered && (
          <div
            className="absolute pointer-events-none bg-ink text-parchment text-xs px-2 py-1.5 rounded shadow-lg"
            style={{
              left: `calc(${(tooltip.x / VIEW_W) * 100}% + 12px)`,
              top: `calc(${(tooltip.y / VIEW_H) * 100}% + 12px)`,
              zIndex: 10,
            }}
          >
            <div className="font-serif text-sm">{hoveredCity.name}</div>
            <div className="text-parchment/70 text-[10px]">
              {hoveredCity.count} figure{hoveredCity.count === 1 ? "" : "s"}
            </div>
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
          {!showAll && placedAll.length > placed.length
            ? ` (${placedAll.length - placed.length} minor hidden)`
            : ""}
        </span>
      </div>
    </div>
  );
}
