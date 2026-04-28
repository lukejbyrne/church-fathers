// Pure utilities (no fs) for computing lineage sets client-side.
import type { Person, Relationship } from "./schema";

export function buildChainsToAnchor(
  people: Person[],
  relationships: Relationship[],
  anchor = "jesus-of-nazareth"
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const p of people) adj.set(p.id, []);
  for (const r of relationships) {
    adj.get(r.from)?.push(r.to);
    adj.get(r.to)?.push(r.from);
  }

  const chains = new Map<string, string[]>();
  for (const start of people) {
    const prev = new Map<string, string | null>([[start.id, null]]);
    const queue: string[] = [start.id];
    let found = start.id === anchor;
    while (queue.length && !found) {
      const cur = queue.shift()!;
      for (const next of adj.get(cur) ?? []) {
        if (prev.has(next)) continue;
        prev.set(next, cur);
        if (next === anchor) {
          found = true;
          break;
        }
        queue.push(next);
      }
    }
    if (!found) {
      chains.set(start.id, [start.id]);
      continue;
    }
    const path: string[] = [];
    let c: string | null = anchor;
    while (c) {
      path.push(c);
      c = prev.get(c) ?? null;
    }
    // path is anchor → start; reverse so start comes first if you prefer
    chains.set(start.id, path);
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
