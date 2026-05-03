import fs from "node:fs";
import path from "node:path";
import { ERAS_DATA } from "../lib/eras";
import type { Anniversary, Person, Relationship } from "../lib/schema";

const DATA = path.join(process.cwd(), "data");

const people: Person[] = JSON.parse(fs.readFileSync(path.join(DATA, "people.json"), "utf8"));
const rels: Relationship[] = JSON.parse(fs.readFileSync(path.join(DATA, "relationships.json"), "utf8"));
const anniversaries: Anniversary[] = JSON.parse(fs.readFileSync(path.join(DATA, "anniversaries.json"), "utf8"));
const eventImages = readJson<Record<string, { url?: string; alt?: string }>>("event-images.json");
const eventImageManifest = readJson<Record<string, string>>("event-image-manifest.json");
const eraImages = readJson<Record<string, { url?: string; alt?: string }>>("era-images.json");
const eraImageManifest = readJson<Record<string, string>>("era-image-manifest.json");

const ids = new Set(people.map((p) => p.id));
const errors: string[] = [];
const warnings: string[] = [];

function readJson<T>(name: string): T {
  const file = path.join(DATA, name);
  if (!fs.existsSync(file)) return {} as T;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function publicFileExists(publicPath: string | undefined): boolean {
  if (!publicPath) return false;
  return fs.existsSync(path.join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}

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

// Event and era image sidecars
for (const event of anniversaries) {
  const image = eventImages[event.id];
  if (!image) {
    errors.push(`${event.id}: missing data/event-images.json entry`);
    continue;
  }
  if (!image.url) errors.push(`${event.id}: event image missing url`);
  if (!image.alt) errors.push(`${event.id}: event image missing alt text`);
  const local = eventImageManifest[event.id];
  if (local && !publicFileExists(local)) warnings.push(`${event.id}: event image manifest points at missing file ${local}`);
}

for (const slug of Object.keys(ERAS_DATA)) {
  const image = eraImages[slug];
  if (!image) {
    errors.push(`${slug}: missing data/era-images.json entry`);
    continue;
  }
  if (!image.url) errors.push(`${slug}: era image missing url`);
  if (!image.alt) errors.push(`${slug}: era image missing alt text`);
  const local = eraImageManifest[slug];
  if (local && !publicFileExists(local)) warnings.push(`${slug}: era image manifest points at missing file ${local}`);
}

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
