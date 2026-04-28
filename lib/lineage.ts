// Pure utilities (no fs) for computing lineage and chain paths.
import type { Person, Relationship, RelationshipType, Strength } from "./schema";

// Lower = stronger preference. The intent: a 4-hop chain entirely through "taught"
// is stronger evidence of transmission than a 2-hop chain that includes a "met (tradition)" link.
const TYPE_WEIGHT: Record<RelationshipType, number> = {
  taught: 1,
  taught_by: 1,
  succeeded_in_see: 2,
  baptized_by: 2,
  ordained_by: 2,
  corresponded: 3,
  met: 4,
  cited: 5,
  knew_of: 6,
  opposed: 100, // never preferred for transmission chains
};

const STRENGTH_MULT: Record<Strength, number> = {
  documented: 1,
  tradition: 1.8,
  disputed: 4,
};

export type ChainKind = "all" | "pedagogical" | "episcopal" | "documented_only";

const ALLOWED_TYPES: Record<ChainKind, ReadonlySet<RelationshipType> | null> = {
  all: null, // no restriction (we still de-prefer opposed via weight)
  pedagogical: new Set<RelationshipType>(["taught", "taught_by"]),
  episcopal: new Set<RelationshipType>(["succeeded_in_see", "ordained_by", "baptized_by"]),
  documented_only: null, // any type, but only documented strength
};

function edgeAllowed(rel: Relationship, kind: ChainKind): boolean {
  if (kind === "documented_only" && rel.strength !== "documented") return false;
  const set = ALLOWED_TYPES[kind];
  if (set && !set.has(rel.type)) return false;
  if (rel.type === "opposed") return false;
  return true;
}

function edgeWeight(rel: Relationship): number {
  return TYPE_WEIGHT[rel.type] * STRENGTH_MULT[rel.strength];
}

type Adj = Map<string, { to: string; rel: Relationship }[]>;

function buildAdj(people: Person[], rels: Relationship[]): Adj {
  const adj: Adj = new Map();
  for (const p of people) adj.set(p.id, []);
  for (const r of rels) {
    adj.get(r.from)?.push({ to: r.to, rel: r });
    adj.get(r.to)?.push({ to: r.from, rel: r });
  }
  return adj;
}

// Dijkstra — finds the lowest-weight path from `start` to `target`.
// Returns the ordered list of person ids (anchor-first → start-last) or null.
export function strongestPath(
  start: string,
  target: string,
  people: Person[],
  rels: Relationship[],
  kind: ChainKind = "all"
): string[] | null {
  if (start === target) return [start];
  const adj = buildAdj(people, rels);

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const p of people) dist.set(p.id, Infinity);
  dist.set(start, 0);
  prev.set(start, null);

  // Simple priority queue (sorted array). Fine for ~200 nodes.
  const queue: { id: string; d: number }[] = [{ id: start, d: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.d - b.d);
    const cur = queue.shift()!;
    if (cur.id === target) break;
    if (cur.d > (dist.get(cur.id) ?? Infinity)) continue;
    for (const { to, rel } of adj.get(cur.id) ?? []) {
      if (!edgeAllowed(rel, kind)) continue;
      const w = cur.d + edgeWeight(rel);
      if (w < (dist.get(to) ?? Infinity)) {
        dist.set(to, w);
        prev.set(to, cur.id);
        queue.push({ id: to, d: w });
      }
    }
  }

  if (!Number.isFinite(dist.get(target) ?? Infinity)) return null;

  const path: string[] = [];
  let c: string | null = target;
  while (c) {
    path.push(c);
    c = prev.get(c) ?? null;
  }
  path.reverse(); // start → target
  return path;
}

// Backwards-compat: produce a Map<personId, chainToAnchor> for visualization
// highlighting (used by Timeline + LineageGraph).
export function buildChainsToAnchor(
  people: Person[],
  relationships: Relationship[],
  anchor = "jesus-of-nazareth"
): Map<string, string[]> {
  const chains = new Map<string, string[]>();
  for (const p of people) {
    const path = strongestPath(p.id, anchor, people, relationships, "all");
    chains.set(p.id, path ? path.slice().reverse() : [p.id]); // anchor-first per legacy
  }
  return chains;
}

export function lineageOf(
  id: string,
  chains: Map<string, string[]>
): { ancestors: Set<string>; descendants: Set<string>; all: Set<string> } {
  const myChain = chains.get(id) ?? [id];
  const ancestors = new Set(myChain);

  const descendants = new Set<string>([id]);
  for (const [pid, chain] of chains) {
    if (pid === id) continue;
    if (chain.includes(id)) descendants.add(pid);
  }
  const all = new Set<string>([...ancestors, ...descendants]);
  return { ancestors, descendants, all };
}
