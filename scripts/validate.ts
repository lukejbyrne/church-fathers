import fs from "node:fs";
import path from "node:path";
import { bookDisplayTitle, eraSlugForTradition, getBookForContent, quoteSourceMatchesBook, type ResolvedBookRecommendation } from "../lib/books";
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
const eventImages = readJson<Record<string, { url?: string; alt?: string }>>("event-images.json");
const eventImageManifest = readJson<Record<string, string>>("event-image-manifest.json");
const eraImages = readJson<Record<string, { url?: string; alt?: string }>>("era-images.json");
const eraImageManifest = readJson<Record<string, string>>("era-image-manifest.json");

const ids = new Set(people.map((p) => p.id));
const errors: string[] = [];
const warnings: string[] = [];
const SITE_URL = "https://patristic.io";

function readJson<T>(name: string): T {
  const file = path.join(DATA, name);
  if (!fs.existsSync(file)) return {} as T;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function publicFileExists(publicPath: string | undefined): boolean {
  if (!publicPath) return false;
  return fs.existsSync(path.join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}

function contentLabel(content: Content): string {
  switch (content.type) {
    case "father":
    case "quote":
      return content.person.name;
    case "heretic":
      return content.anniversary?.title ?? content.person.name;
    case "era":
      return eraForTraditionStatus(content.era).label;
    case "council":
    case "schism":
      return content.anniversary.title;
  }
}

function bookFitsContent(content: Content, book: ResolvedBookRecommendation | null): boolean {
  if (!book) return true;

  if (content.type === "father" || content.type === "quote") {
    const eraSlug = eraSlugForTradition(content.person.tradition_status);
    return book.personId === content.person.id || Boolean(eraSlug && book.eraSlugs?.includes(eraSlug));
  }

  if (content.type === "era") {
    const eraSlug = eraSlugForTradition(content.era);
    return Boolean(eraSlug && book.eraSlugs?.includes(eraSlug));
  }

  if (content.type === "heretic") {
    return Boolean(content.anniversary?.id && book.eventSlugs?.includes(content.anniversary.id));
  }

  return book.eventSlugs?.includes(content.anniversary.id) ?? false;
}

function comparableTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b([a-z]{4,})ies\b/g, "$1y")
    .replace(/\b([a-z]{4,})s\b/g, "$1")
    .trim();
}

function titlesOverlap(a: string, b: string): boolean {
  const left = comparableTitle(a);
  const right = comparableTitle(b);
  return left === right || left.includes(right) || right.includes(left);
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
const contactTypes = new Set(["taught_by", "taught", "met", "baptized_by", "ordained_by", "corresponded"]);
for (const r of rels) {
  if (!contactTypes.has(r.type)) continue;
  const a = people.find((p) => p.id === r.from);
  const b = people.find((p) => p.id === r.to);
  if (!a || !b) continue;
  if (a.died != null && b.born != null && a.died < b.born) {
    warnings.push(`${a.id} (d.${a.died}) and ${b.id} (b.${b.born}): cannot have ${r.type} (no overlap)`);
  }
  if (b.died != null && a.born != null && b.died < a.born) {
    warnings.push(`${a.id} (b.${a.born}) and ${b.id} (d.${b.died}): cannot have ${r.type} (no overlap)`);
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
    const book = getBookForContent(content, date);
    if (!bookFitsContent(content, book)) {
      errors.push(
        `${day} ${content.type}: book "${bookDisplayTitle(book!)}" (${book!.id}) does not match ${contentLabel(content)}`
      );
    }
    const extras = buildExtras(content, SITE_URL);
    const { subject, html, plain } = renderEmail(content, SITE_URL, extras);

    if (extras.book && !extras.book.cover_image_url) {
      errors.push(`${day} ${content.type}: book "${extras.book.title}" is missing a cover image`);
    }
    if (
      extras.book &&
      content.type !== "father" &&
      content.type !== "quote" &&
      plain.includes("Recommended reading:") &&
      plain.includes(`Book of the day: ${extras.book.title}`)
    ) {
      const recommendedBlock = plain
        .split(`Book of the day: ${extras.book.title}`)[0]
        .split("Recommended reading:")
        .pop() ?? "";
      const duplicateWork = extras.recommendedWorks?.find(
        (work) => titlesOverlap(work.title, extras.book!.title) && recommendedBlock.includes(work.title)
      );
      if (duplicateWork) {
        errors.push(`${day} ${content.type}: book "${extras.book.title}" appears in both recommended reading and book of the day`);
      }
    }

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
      for (const marker of ["Plain English", "Why it matters", "About"]) {
        if (!html.includes(marker)) errors.push(`${day} quote: html missing ${marker}`);
      }
      for (const marker of ["Quote in context", "Who said it", "Recommended reading", "Book of the day"]) {
        if (html.includes(marker)) errors.push(`${day} quote: html still contains old repeated section label ${marker}`);
      }
      if (!html.includes(content.quote.source)) {
        errors.push(`${day} quote: html missing italic source line ${content.quote.source}`);
      }
      if (book && !quoteSourceMatchesBook(content.quote.source, book)) {
        errors.push(`${day} quote: book "${bookDisplayTitle(book)}" is not the source of ${content.quote.source}`);
      }
      if (book && !html.includes("Read next")) {
        errors.push(`${day} quote: source-matched reading is missing Read next`);
      }
      if (!book && (html.includes("Read next") || plain.includes("Read next:"))) {
        errors.push(`${day} quote: reading card appears without a source-matched book`);
      }
      if (/>About [^<]+<\/div>\s*<p[^>]*>\s*["'”’)]\s/.test(html)) {
        errors.push(`${day} quote: about snippet starts with a dangling quotation mark`);
      }
      for (const marker of ["Plain English:", "Why it matters:", "About "]) {
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
