import fs from "node:fs";
import path from "node:path";
import { Person, Relationship, Work, type Anniversary, type Quote } from "./schema";
import { strongestPath, type ChainKind } from "./lineage";

const DATA_DIR = path.join(process.cwd(), "data");

let _people: Person[] | null = null;
let _rels: Relationship[] | null = null;
let _anniv: Anniversary[] | null = null;
let _quotes: Quote[] | null = null;
let _heretics: Set<string> | null = null;
let _overrides: Record<string, string> | null = null;

type ImageEntry = { url: string; credit?: string; license?: string };
type FeastEntry = { catholic?: string; orthodox?: string };

function readJsonIfExists<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function getPeople(): Person[] {
  if (_people) return _people;
  const file = path.join(DATA_DIR, "people.json");
  if (!fs.existsSync(file)) return (_people = []);
  const base = JSON.parse(fs.readFileSync(file, "utf8")) as Person[];

  // Sidecar overlays — survive `pnpm merge` because they live alongside, not inside, sources.
  const images = readJsonIfExists<Record<string, ImageEntry>>(path.join(DATA_DIR, "images.json")) ?? {};
  const works = readJsonIfExists<Record<string, Work[]>>(path.join(DATA_DIR, "works.json")) ?? {};
  const whyMatters = readJsonIfExists<Record<string, string>>(path.join(DATA_DIR, "why-matters.json")) ?? {};
  const feastDays = readJsonIfExists<Record<string, FeastEntry>>(path.join(DATA_DIR, "feast-days.json")) ?? {};

  _people = base.map((p) => {
    const img = images[p.id];
    const w = works[p.id];
    const wm = whyMatters[p.id];
    const fd = feastDays[p.id];
    return {
      ...p,
      image_url: p.image_url ?? img?.url,
      image_credit: p.image_credit ?? img?.credit,
      image_license: p.image_license ?? img?.license,
      works: p.works ?? w,
      why_matters: p.why_matters ?? wm,
      feast_day_catholic: p.feast_day_catholic ?? fd?.catholic,
      feast_day_orthodox: p.feast_day_orthodox ?? fd?.orthodox,
    };
  });
  return _people!;
}

export function getAnniversaries(): Anniversary[] {
  if (_anniv) return _anniv;
  _anniv = readJsonIfExists<Anniversary[]>(path.join(DATA_DIR, "anniversaries.json")) ?? [];
  return _anniv;
}

export function getQuotes(): Quote[] {
  if (_quotes) return _quotes;
  _quotes = readJsonIfExists<Quote[]>(path.join(DATA_DIR, "quotes.json")) ?? [];
  return _quotes;
}

export function getHereticIds(): Set<string> {
  if (_heretics) return _heretics;
  const ids = readJsonIfExists<string[]>(path.join(DATA_DIR, "heretics.json")) ?? [];
  _heretics = new Set(ids);
  return _heretics;
}

export function getOverrides(): Record<string, string> {
  if (_overrides) return _overrides;
  _overrides = readJsonIfExists<Record<string, string>>(path.join(DATA_DIR, "send-overrides.json")) ?? {};
  return _overrides;
}

export function getRelationships(): Relationship[] {
  if (_rels) return _rels;
  const file = path.join(DATA_DIR, "relationships.json");
  if (!fs.existsSync(file)) return (_rels = []);
  _rels = JSON.parse(fs.readFileSync(file, "utf8"));
  return _rels!;
}

export function getPerson(id: string): Person | undefined {
  return getPeople().find((p) => p.id === id);
}

export function getRelationshipsFor(id: string): Relationship[] {
  return getRelationships().filter((r) => r.from === id || r.to === id);
}

let _adj: Map<string, { to: string; rel: Relationship }[]> | null = null;
function getAdj() {
  if (_adj) return _adj;
  _adj = new Map();
  for (const p of getPeople()) _adj.set(p.id, []);
  for (const r of getRelationships()) {
    _adj.get(r.from)?.push({ to: r.to, rel: r });
    _adj.get(r.to)?.push({ to: r.from, rel: r });
  }
  return _adj;
}

/**
 * Strongest-evidence path from `anchor` to `id`. Returns the chain as a list
 * of {person, edge} pairs, anchor first → id last. Edge on first entry is null.
 * Weighted by relationship type (taught/succeeded > corresponded > met > cited)
 * and strength (documented < tradition < disputed). `kind` filters which edges
 * count: "all" (default), "pedagogical" (taught only), "episcopal" (sees only),
 * "documented_only".
 */
export function chainTo(
  id: string,
  anchor = "jesus-of-nazareth",
  kind: ChainKind = "all"
): { person: Person; edge: Relationship | null }[] | null {
  if (id === anchor) {
    const p = getPerson(anchor);
    return p ? [{ person: p, edge: null }] : null;
  }
  const path = strongestPath(id, anchor, getPeople(), getRelationships(), kind);
  if (!path) return null;
  // path is start → anchor. We want anchor → start (anchor first).
  const ordered = path.slice().reverse();

  // Re-derive the edge between each consecutive pair for rendering.
  const result: { person: Person; edge: Relationship | null }[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const p = getPerson(ordered[i]);
    if (!p) return null;
    let edge: Relationship | null = null;
    if (i > 0) {
      const a = ordered[i - 1];
      const b = ordered[i];
      edge = getRelationships().find(
        (r) =>
          (r.from === a && r.to === b) || (r.from === b && r.to === a)
      ) ?? null;
    }
    result.push({ person: p, edge });
  }
  return result;
}

/**
 * The full "lineage view" of a person:
 * - ancestors: everyone on the shortest path from this person back to Jesus (chain-to-Jesus).
 * - descendants: everyone whose own chain-to-Jesus passes through this person.
 * Returns the union as a set of person ids; the visualization highlights all of them.
 */
let _chainCache: Map<string, string[]> | null = null;
function buildChainCache() {
  if (_chainCache) return _chainCache;
  _chainCache = new Map();
  for (const p of getPeople()) {
    const c = chainTo(p.id);
    _chainCache.set(p.id, c ? c.map((s) => s.person.id) : [p.id]);
  }
  return _chainCache;
}

export function lineageOf(id: string, anchor = "jesus-of-nazareth"): {
  ancestors: Set<string>;
  descendants: Set<string>;
  all: Set<string>;
} {
  const cache = buildChainCache();
  const myChain = cache.get(id) ?? [id];
  const ancestors = new Set(myChain); // includes Jesus + intermediaries + self

  const descendants = new Set<string>([id]);
  for (const [pid, chain] of cache) {
    if (pid === id) continue;
    if (chain.includes(id)) descendants.add(pid);
  }
  // self is in both — union
  const all = new Set<string>([...ancestors, ...descendants]);
  // Anchor is always ancestor
  if (anchor) all.add(anchor);
  return { ancestors, descendants, all };
}
