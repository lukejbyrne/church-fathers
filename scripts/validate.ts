import fs from "node:fs";
import path from "node:path";
import { ERAS_DATA, ERA_SLUG_BY_STATUS, eraForTraditionStatus } from "../lib/eras";
import { buildExtras } from "../lib/email-helpers";
import { renderEmail } from "../lib/email-template";
import { addDays, isoDate, parseIsoDate, pickContent, type Content } from "../lib/picker";
import { Anniversary, Person, Quote, Relationship, TraditionStatus } from "../lib/schema";

const DATA = path.join(process.cwd(), "data");

const people: Person[] = JSON.parse(fs.readFileSync(path.join(DATA, "people.json"), "utf8"));
const rels: Relationship[] = JSON.parse(fs.readFileSync(path.join(DATA, "relationships.json"), "utf8"));
const anniversaries: Anniversary[] = JSON.parse(fs.readFileSync(path.join(DATA, "anniversaries.json"), "utf8"));
const quotes: Quote[] = JSON.parse(fs.readFileSync(path.join(DATA, "quotes.json"), "utf8"));

const ids = new Set(people.map((p) => p.id));
const errors: string[] = [];
const warnings: string[] = [];
const SITE_URL = "https://patristic.io";

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

for (const [i, q] of quotes.entries()) {
  const parsed = Quote.safeParse(q);
  if (!parsed.success) {
    errors.push(`quote ${i}: invalid schema (${parsed.error.issues.map((issue) => issue.message).join(", ")})`);
    continue;
  }
  if (!ids.has(q.person_id)) errors.push(`quote ${i}: unknown person_id ${q.person_id}`);
  if (!q.title || q.title.trim().length < 10) {
    errors.push(`quote ${i}: missing useful title`);
  }
  if (!q.context || q.context.trim().length < 80) {
    errors.push(`quote ${i}: context is too thin for a daily email`);
  }
  if (!q.impact || q.impact.trim().length < 60) {
    errors.push(`quote ${i}: impact is too thin for a daily email`);
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
  const { subject, html, plain } = renderEmail(content, SITE_URL, { book: null });

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

function assertDailyEmailSurface(startIso: string, endIso: string) {
  let date = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!date || !end) {
    errors.push(`daily email audit: invalid range ${startIso}..${endIso}`);
    return;
  }

  const counts: Record<string, number> = {};
  while (date <= end) {
    const content = pickContent(date);
    const day = isoDate(date);
    counts[content.type] = (counts[content.type] ?? 0) + 1;
    const { subject, html, plain } = renderEmail(content, SITE_URL, buildExtras(content, SITE_URL));

    if (!subject || subject.trim().length < 8) {
      errors.push(`${day} ${content.type}: email subject is too short`);
    }
    if (/^From\s/i.test(subject)) {
      errors.push(`${day} ${content.type}: email subject uses weak source-first phrasing: ${subject}`);
    }
    if (!html.includes("<title>") || !html.includes(subject)) {
      errors.push(`${day} ${content.type}: email html title does not include subject`);
    }
    if (!plain.includes("Patristic Lineage") || !plain.includes("Unsubscribe:")) {
      errors.push(`${day} ${content.type}: plain email is missing footer/unsubscribe text`);
    }

    if (content.type === "quote") {
      for (const marker of ["Quote in context", "Plain English", "Why it matters", "Who said it"]) {
        if (!html.includes(marker)) errors.push(`${day} quote: html missing ${marker}`);
      }
      for (const marker of ["Plain English:", "Why it matters:", "Who said it:"]) {
        if (!plain.includes(marker)) errors.push(`${day} quote: plain text missing ${marker}`);
      }
    }

    if (content.type === "father") {
      const short = content.person.name.split(" of ")[0];
      if (!html.includes(`Why ${short} matters`)) {
        errors.push(`${day} father: html missing why-it-matters heading for ${content.person.id}`);
      }
    }

    if (content.type === "era") {
      if (!html.includes("Why it matters") || !plain.includes("Why it matters:")) {
        errors.push(`${day} era: missing why-it-matters context`);
      }
    }

    if (content.type === "council" || content.type === "schism" || content.type === "heretic") {
      if (plain.split(/\s+/).length < 55) {
        errors.push(`${day} ${content.type}: plain email is too thin`);
      }
    }

    date = addDays(date, 1);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\n[validate] rendered ${total} daily emails (${startIso}..${endIso})`);
  console.log(
    `[validate] daily email mix: ${Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, count]) => `${type}=${count}`)
      .join(", ")}`
  );
}

assertDailyEmailSurface("2025-01-01", "2030-12-31");

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
