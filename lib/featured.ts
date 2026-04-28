// Daily-rotating "Father of the Day" picker.
//
// Deterministic by date: the same calendar day always returns the same figure,
// so newsletter sends and cached pages are reproducible across rebuilds.
//
// Algorithm:
//   1. Filter to significance >= 2 (skip the truly minor figures).
//   2. Sort by significance DESC, then by (born ?? died) ASC. Stable order.
//   3. Compute a day index from the date (UTC, YYYY-MM-DD → days since epoch).
//      featured = list[dayIndex % list.length].

import { getPeople } from "./data";
import type { Person } from "./schema";

function rankedPool(): Person[] {
  return getPeople()
    .filter((p) => (p.significance ?? 0) >= 2)
    .slice()
    .sort((a, b) => {
      if (b.significance !== a.significance) return b.significance - a.significance;
      const ay = a.born ?? a.died ?? 9999;
      const by = b.born ?? b.died ?? 9999;
      if (ay !== by) return ay - by;
      return a.id.localeCompare(b.id);
    });
}

// Days since 1970-01-01 in UTC. Stable across timezones / rebuilds.
function dayIndex(date: Date): number {
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor(utc / 86_400_000);
}

export function featuredOfDay(date: Date = new Date()): Person {
  const pool = rankedPool();
  if (pool.length === 0) {
    throw new Error("featuredOfDay: no figures with significance >= 2 found");
  }
  const idx = ((dayIndex(date) % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

export function featuredQueue(days: number, startDate: Date = new Date()): Person[] {
  const out: Person[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    out.push(featuredOfDay(d));
  }
  return out;
}

// Helpers used by the page + API route.

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
