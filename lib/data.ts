import fs from "node:fs";
import path from "node:path";
import { Person, Relationship } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");

let _people: Person[] | null = null;
let _rels: Relationship[] | null = null;

export function getPeople(): Person[] {
  if (_people) return _people;
  const file = path.join(DATA_DIR, "people.json");
  if (!fs.existsSync(file)) return (_people = []);
  _people = JSON.parse(fs.readFileSync(file, "utf8"));
  return _people!;
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
 * Shortest path from `id` back to Jesus (or any anchor). Returns the chain
 * as a list of {person, edge} pairs starting at `id` and ending at the anchor.
 * Returns null if no path exists.
 */
export function chainTo(id: string, anchor = "jesus-of-nazareth"): { person: Person; edge: Relationship | null }[] | null {
  if (id === anchor) {
    const p = getPerson(anchor);
    return p ? [{ person: p, edge: null }] : null;
  }
  const adj = getAdj();
  const prev = new Map<string, { from: string; edge: Relationship } | null>([[id, null]]);
  const queue: string[] = [id];
  let found = false;
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === anchor) {
      found = true;
      break;
    }
    for (const { to, rel } of adj.get(cur) ?? []) {
      if (!prev.has(to)) {
        prev.set(to, { from: cur, edge: rel });
        queue.push(to);
      }
    }
  }
  if (!found) return null;

  const path: { person: Person; edge: Relationship | null }[] = [];
  let cur: string | null = anchor;
  while (cur) {
    const p = getPerson(cur);
    if (!p) return null;
    const step = prev.get(cur);
    path.push({ person: p, edge: step?.edge ?? null });
    cur = step?.from ?? null;
  }
  return path; // anchor first → id last
}
