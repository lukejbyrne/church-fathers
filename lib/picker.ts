// Daily content picker — discriminated union of content types.
//
// Priority chain (first match wins):
//   1. Manual override   (data/send-overrides.json)
//   2. Feast day match   (Catholic primary, Orthodox secondary)
//   3. Anniversary match (council / schism / heresy-condemnation)
//   4. Era spotlight     (Monday slot, no other type fired)
//   5. Quote rotation    (deterministic by dayIndex)
//
// Pure function of date — same date always returns the same Content.

import {
  getPeople,
  getPerson,
  getAnniversaries,
  getQuotes,
  getHereticIds,
  getOverrides,
} from "./data";
import type { Person, Anniversary, Quote, TraditionStatus } from "./schema";

// Reorder quotes so the same author never appears in two adjacent slots
// (which is what makes the calendar show e.g. "Benedict, Benedict" on
// consecutive days). Greedy: at each step pick the author with the most
// remaining quotes that isn't the previous author. Stable across runs.
let _spreadQuotes: Quote[] | null = null;
function getSpreadQuotes(): Quote[] {
  if (_spreadQuotes) return _spreadQuotes;
  const quotes = getQuotes();
  if (quotes.length <= 1) return (_spreadQuotes = quotes.slice());

  const buckets = new Map<string, Quote[]>();
  for (const q of quotes) {
    if (!buckets.has(q.person_id)) buckets.set(q.person_id, []);
    buckets.get(q.person_id)!.push(q);
  }
  for (const arr of buckets.values()) {
    arr.sort((a, b) => (a.source ?? "").localeCompare(b.source ?? "") || a.text.localeCompare(b.text));
  }

  const out: Quote[] = [];
  let prev = "";
  while (out.length < quotes.length) {
    const candidates = [...buckets.entries()].filter(([id, arr]) => arr.length > 0 && id !== prev);
    const pool = candidates.length > 0
      ? candidates
      : [...buckets.entries()].filter(([, arr]) => arr.length > 0);
    pool.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const [id, arr] = pool[0];
    out.push(arr.shift()!);
    prev = id;
  }
  _spreadQuotes = out;
  return out;
}

export type Content =
  | {
      type: "father";
      date: string;
      person: Person;
      reason: "override" | "feast-catholic" | "feast-orthodox" | "rotation";
    }
  | { type: "council"; date: string; anniversary: Anniversary }
  | { type: "schism"; date: string; anniversary: Anniversary }
  | {
      type: "heretic";
      date: string;
      anniversary?: Anniversary;
      person: Person;
    }
  | {
      type: "era";
      date: string;
      era: TraditionStatus;
      figures: Person[];
    }
  | { type: "quote"; date: string; quote: Quote; person: Person };

export function isoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (isNaN(d.getTime())) return null;
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export function dayIndex(date: Date): number {
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor(utc / 86_400_000);
}

const ERA_ORDER: TraditionStatus[] = [
  "apostle",
  "apostolic-father",
  "apologist",
  "ante-nicene",
  "nicene",
  "post-nicene",
  "desert-father",
];

function sigSort(a: Person, b: Person): number {
  if (b.significance !== a.significance) return b.significance - a.significance;
  const ay = a.born ?? a.died ?? 9999;
  const by = b.born ?? b.died ?? 9999;
  if (ay !== by) return ay - by;
  return a.id.localeCompare(b.id);
}

function lookupFeast(mmdd: string, calendar: "catholic" | "orthodox", excluded: Set<string>): Person | null {
  const key = calendar === "catholic" ? "feast_day_catholic" : "feast_day_orthodox";
  const matches = getPeople().filter((p) => p[key] === mmdd && !excluded.has(p.id));
  if (matches.length === 0) return null;
  matches.sort(sigSort);
  return matches[0];
}

function pickAnniversary(mmdd: string): Anniversary | null {
  const matches = getAnniversaries().filter((a) => a.date === mmdd);
  if (matches.length === 0) return null;
  // Lowest year wins (the original event).
  matches.sort((a, b) => a.year - b.year);
  return matches[0];
}

function rotationFallback(date: Date, pinnedIds: Set<string>): Person {
  // Same algorithm as the legacy featuredOfDay, but excludes pinned figures
  // (anyone with a feast day) so we don't double-feature them.
  const pool = getPeople()
    .filter((p) => (p.significance ?? 0) >= 2)
    .filter((p) => !pinnedIds.has(p.id))
    .slice()
    .sort(sigSort);
  if (pool.length === 0) {
    // Defensive: if everyone is pinned (shouldn't happen) fall back to full pool.
    const full = getPeople().filter((p) => (p.significance ?? 0) >= 2).sort(sigSort);
    return full[((dayIndex(date) % full.length) + full.length) % full.length];
  }
  return pool[((dayIndex(date) % pool.length) + pool.length) % pool.length];
}

function pinnedFeastIds(): Set<string> {
  const ids = new Set<string>();
  for (const p of getPeople()) {
    if (p.feast_day_catholic || p.feast_day_orthodox) ids.add(p.id);
  }
  return ids;
}

function isMonday(date: Date): boolean {
  return date.getUTCDay() === 1;
}

function pickEraForWeek(date: Date): TraditionStatus {
  // ISO week index → era slot.
  const week = Math.floor(dayIndex(date) / 7);
  return ERA_ORDER[((week % ERA_ORDER.length) + ERA_ORDER.length) % ERA_ORDER.length];
}

function eraFigures(era: TraditionStatus, n = 4): Person[] {
  return getPeople()
    .filter((p) => p.tradition_status === era)
    .slice()
    .sort(sigSort)
    .slice(0, n);
}

export function pickContent(date: Date = new Date()): Content {
  const iso = isoDate(date);
  const mmdd = iso.slice(5);

  // 1. Manual override — explicit pin wins always.
  const overrides = getOverrides();
  const overrideId = overrides[iso];
  if (overrideId) {
    const p = getPerson(overrideId);
    if (p) return { type: "father", date: iso, person: p, reason: "override" };
  }

  // Heretics never win the feast slot.
  const heretics = getHereticIds();

  // 2. Feast day — Catholic first, then Orthodox.
  const cat = lookupFeast(mmdd, "catholic", heretics);
  if (cat) return { type: "father", date: iso, person: cat, reason: "feast-catholic" };
  const orth = lookupFeast(mmdd, "orthodox", heretics);
  if (orth) return { type: "father", date: iso, person: orth, reason: "feast-orthodox" };

  // 3. Anniversary — council / schism / heresy-condemnation.
  const anniv = pickAnniversary(mmdd);
  if (anniv) {
    if (anniv.kind === "council") return { type: "council", date: iso, anniversary: anniv };
    if (anniv.kind === "schism") return { type: "schism", date: iso, anniversary: anniv };
    // heresy-condemnation — pull the named heretic.
    const personId = anniv.related_person_ids?.find((id) => heretics.has(id));
    const person = personId ? getPerson(personId) : undefined;
    if (person) {
      return { type: "heretic", date: iso, anniversary: anniv, person };
    }
    // Fall through if heretic record missing — treat as schism.
    return { type: "schism", date: iso, anniversary: anniv };
  }

  // 4. Era spotlight — Monday only.
  if (isMonday(date)) {
    const era = pickEraForWeek(date);
    const figures = eraFigures(era, 4);
    if (figures.length > 0) {
      return { type: "era", date: iso, era, figures };
    }
  }

  // 5. Quote rotation — deterministic by day, with author-spread ordering
  // so consecutive days don't show the same author.
  const quotes = getSpreadQuotes();
  if (quotes.length > 0) {
    const idx = ((dayIndex(date) % quotes.length) + quotes.length) % quotes.length;
    const q = quotes[idx];
    const person = getPerson(q.person_id);
    if (person) return { type: "quote", date: iso, quote: q, person };
  }

  // Last resort — rotation Father. Should rarely fire; only if quotes are all
  // pointing at missing person ids.
  const person = rotationFallback(date, pinnedFeastIds());
  return { type: "father", date: iso, person, reason: "rotation" };
}

// Back-compat shim — preserves existing call sites that just want a Person.
export function featuredOfDay(date: Date = new Date()): Person {
  const c = pickContent(date);
  if (c.type === "father" || c.type === "heretic") return c.person;
  if (c.type === "quote") return c.person;
  if (c.type === "era") return c.figures[0];
  // Council / schism — return the first related person if we can, else fall
  // back to the deterministic rotation. Legacy callers expect a Person.
  if (c.type === "council" || c.type === "schism") {
    const first = c.anniversary.related_person_ids?.[0];
    if (first) {
      const p = getPerson(first);
      if (p) return p;
    }
  }
  return rotationFallback(date, pinnedFeastIds());
}

export function featuredQueue(days: number, startDate: Date = new Date()): Person[] {
  const out: Person[] = [];
  for (let i = 0; i < days; i++) {
    out.push(featuredOfDay(addDays(startDate, i)));
  }
  return out;
}
