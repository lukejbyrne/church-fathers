import fs from "node:fs";
import path from "node:path";
import { Person, Relationship } from "../lib/schema";

const DATA = path.join(process.cwd(), "data");

const people: Person[] = JSON.parse(fs.readFileSync(path.join(DATA, "people.json"), "utf8"));
const rels: Relationship[] = JSON.parse(fs.readFileSync(path.join(DATA, "relationships.json"), "utf8"));

const ids = new Set(people.map((p) => p.id));
const errors: string[] = [];
const warnings: string[] = [];

// Dangling refs
for (const r of rels) {
  if (!ids.has(r.from)) errors.push(`relationship from unknown id: ${r.from} → ${r.to} (${r.type})`);
  if (!ids.has(r.to)) errors.push(`relationship to unknown id: ${r.from} → ${r.to} (${r.type})`);
}

// Lifespan sanity
for (const p of people) {
  if (p.born != null && p.died != null && p.died < p.born) {
    errors.push(`${p.id}: died (${p.died}) before born (${p.born})`);
  }
  if (p.citations.length === 0) errors.push(`${p.id}: no citations`);
}

// Citation count
for (const r of rels) {
  if (r.citations.length === 0) errors.push(`${r.from}→${r.to} (${r.type}): no citations`);
}

// Lifespan overlap for direct-contact edge types
const contactTypes = new Set(["taught_by", "taught", "met", "baptized_by", "ordained_by", "corresponded", "opposed"]);
for (const r of rels) {
  if (!contactTypes.has(r.type)) continue;
  const a = people.find((p) => p.id === r.from);
  const b = people.find((p) => p.id === r.to);
  if (!a || !b) continue;
  const aDied = a.died ?? a.born;
  const bBorn = b.born ?? b.died;
  if (aDied != null && bBorn != null && aDied < bBorn) {
    warnings.push(`${a.id} (d.${a.died}) and ${b.id} (b.${b.born}): cannot have ${r.type} (no overlap)`);
  }
}

// Duplicate ids
const seen = new Map<string, number>();
for (const p of people) seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
for (const [id, n] of seen) if (n > 1) errors.push(`duplicate person id: ${id} (×${n})`);

console.log(`\n[validate] ${people.length} people, ${rels.length} relationships`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log("  ⚠  " + w));
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  errors.forEach((e) => console.log("  ✗  " + e));
  process.exit(1);
}
console.log("\n✓ validation passed");
