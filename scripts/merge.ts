import fs from "node:fs";
import path from "node:path";
import { EraFile, Person, Relationship, relationshipId } from "../lib/schema";

const SOURCES = path.join(process.cwd(), "data", "sources");
const OUT_DIR = path.join(process.cwd(), "data");

const eras = ["apostolic", "ante-nicene", "nicene", "post-nicene"] as const;

// Cross-era slug aliases — agents sometimes used short forms.
// Maps non-canonical → canonical id.
const ALIASES: Record<string, string> = {
  origen: "origen-of-alexandria",
  ambrose: "ambrose-of-milan",
  jerome: "jerome-of-stridon",
  augustine: "augustine-of-hippo",
  basil: "basil-of-caesarea",
  athanasius: "athanasius-of-alexandria",
  ephrem: "ephrem-the-syrian",
  patrick: "patrick-of-ireland",
  cyril: "cyril-of-alexandria",
  "john-the-apostle": "john-the-apostle",
};
const canon = (id: string) => ALIASES[id] ?? id;

const peopleById = new Map<string, Person>();
const relsById = new Map<string, Relationship>();

for (const era of eras) {
  const file = path.join(SOURCES, `${era}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`[merge] missing ${file}, skipping`);
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const parsed = EraFile.safeParse(raw);
  if (!parsed.success) {
    console.error(`[merge] schema fail in ${era}.json:`);
    console.error(parsed.error.issues.slice(0, 10));
    process.exit(1);
  }
  const { people, relationships } = parsed.data;

  for (const rawP of people) {
    const p = { ...rawP, id: canon(rawP.id) };
    const existing = peopleById.get(p.id);
    if (!existing) {
      peopleById.set(p.id, p);
    } else {
      // Merge: union citations, prefer existing non-null fields, otherwise take new
      const merged: Person = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(p).filter(([k, v]) => v != null && (existing as any)[k] == null)
        ),
        citations: dedupeCitations([...existing.citations, ...p.citations]),
        alt_names: Array.from(new Set([...(existing.alt_names ?? []), ...(p.alt_names ?? [])])),
      } as Person;
      peopleById.set(p.id, merged);
    }
  }

  for (const rawR of relationships) {
    const r = { ...rawR, from: canon(rawR.from), to: canon(rawR.to) };
    const id = relationshipId(r);
    const existing = relsById.get(id);
    if (!existing) {
      relsById.set(id, r);
    } else {
      relsById.set(id, {
        ...existing,
        citations: dedupeCitations([...existing.citations, ...r.citations]),
        notes: existing.notes ?? r.notes,
        strength: strongerStrength(existing.strength, r.strength),
      });
    }
  }
}

function dedupeCitations<T extends { source: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const c of arr) {
    if (seen.has(c.source)) continue;
    seen.add(c.source);
    out.push(c);
  }
  return out;
}

function strongerStrength(a: Relationship["strength"], b: Relationship["strength"]) {
  const order = { documented: 3, tradition: 2, disputed: 1 } as const;
  return order[a] >= order[b] ? a : b;
}

const people = Array.from(peopleById.values()).sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999));
const allRels = Array.from(relsById.values());

// Drop dangling refs (e.g. references to "groups" like corinthian-church) with a warning
const ids = new Set(people.map((p) => p.id));
const relationships = allRels.filter((r) => {
  const ok = ids.has(r.from) && ids.has(r.to);
  if (!ok) {
    console.warn(`[merge] dropping dangling rel: ${r.from} → ${r.to} (${r.type})`);
  }
  return ok;
});

fs.writeFileSync(path.join(OUT_DIR, "people.json"), JSON.stringify(people, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "relationships.json"), JSON.stringify(relationships, null, 2));

console.log(`[merge] ${people.length} people, ${relationships.length} relationships → data/`);
