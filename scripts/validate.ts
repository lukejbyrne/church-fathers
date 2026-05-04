import fs from "node:fs";
import path from "node:path";
import { ERAS_DATA, ERA_SLUG_BY_STATUS, eraForTraditionStatus } from "../lib/eras";
import { renderEmail } from "../lib/email-template";
import type { Content } from "../lib/picker";
import { Anniversary, Person, Relationship, TraditionStatus } from "../lib/schema";

const DATA = path.join(process.cwd(), "data");

const people: Person[] = JSON.parse(fs.readFileSync(path.join(DATA, "people.json"), "utf8"));
const rels: Relationship[] = JSON.parse(fs.readFileSync(path.join(DATA, "relationships.json"), "utf8"));
const anniversaries: Anniversary[] = JSON.parse(fs.readFileSync(path.join(DATA, "anniversaries.json"), "utf8"));

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
  if (!p.short_bio || p.short_bio.trim().length < 40) {
    errors.push(`${p.id}: short_bio is too thin for a daily email`);
  }
}

for (const a of anniversaries) {
  if (!a.blurb || a.blurb.trim().length < 80) {
    errors.push(`${a.id}: anniversary blurb is too thin for a daily email`);
  }
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

// Era spotlight emails must carry enough explanation to be useful on their own.
// A previous regression rendered only figure names/cards, so validate the actual
// shared email renderer for every era slot.
for (const status of TraditionStatus.options) {
  const slug = ERA_SLUG_BY_STATUS[status];
  if (!slug) {
    errors.push(`era spotlight ${status}: no era slug mapping`);
    continue;
  }

  const era = eraForTraditionStatus(status);
  if (!era || !ERAS_DATA[slug]) {
    errors.push(`era spotlight ${status}: no era definition for ${slug}`);
    continue;
  }
  if (!era.blurb || era.blurb.length < 40) errors.push(`${era.slug}: era blurb is too thin`);
  if (!era.intro[0] || era.intro[0].length < 120) errors.push(`${era.slug}: first intro paragraph is too thin`);
  if (era.decided.length < 3) errors.push(`${era.slug}: needs at least 3 why-it-matters points`);

  const figures = people
    .filter((p) => p.tradition_status === status)
    .sort((a, b) => {
      if (b.significance !== a.significance) return b.significance - a.significance;
      const ay = a.born ?? a.died ?? 9999;
      const by = b.born ?? b.died ?? 9999;
      if (ay !== by) return ay - by;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 4);

  if (figures.length === 0) {
    errors.push(`era spotlight ${status}: no representative figures`);
    continue;
  }

  const content: Content = {
    type: "era",
    date: "2026-01-05",
    era: status,
    figures,
  };
  const { subject, html, plain } = renderEmail(content, "https://patristic.io", { book: null });

  if (!subject.includes(era.label)) errors.push(`${era.slug}: email subject does not include era label`);
  if (!html.includes(`/eras/${era.slug}`)) errors.push(`${era.slug}: email CTA does not link to the era page`);
  if (!plain.includes(era.blurb)) errors.push(`${era.slug}: plain email is missing era blurb`);
  if (!plain.includes(era.intro[0])) errors.push(`${era.slug}: plain email is missing era intro`);
  if (!plain.includes("Why it matters:")) errors.push(`${era.slug}: plain email is missing why-it-matters heading`);
  for (const point of era.decided.slice(0, 3)) {
    if (!plain.includes(point)) errors.push(`${era.slug}: plain email is missing why-it-matters point "${point}"`);
  }
  for (const figure of figures) {
    if (!plain.includes(figure.name)) errors.push(`${era.slug}: plain email is missing representative figure ${figure.id}`);
  }
}

console.log(`\n[validate] ${people.length} people, ${rels.length} relationships, ${anniversaries.length} anniversaries`);
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
