// Pulls feast days from Wikidata (property P841) for every figure with a
// wikidata_id. Writes to data/feast-days.json keyed by person id, preserving
// hand-curated entries.
//
// Run: pnpm fetch-feast-days
// Re-run is safe — existing entries are kept; pass --force to refetch.
//
// Mirrors the structure of scripts/fetch-images.ts.

import fs from "node:fs";
import path from "node:path";

type Person = { id: string; name: string; wikidata_id?: string };
type FeastEntry = { catholic?: string; orthodox?: string };

const ROOT = process.cwd();
const PEOPLE_FILE = path.join(ROOT, "data", "people.json");
const OUT_FILE = path.join(ROOT, "data", "feast-days.json");
const FORCE = process.argv.includes("--force");

const SPARQL = "https://query.wikidata.org/sparql";
const UA = "patristic-lineage/1.0 (+https://patristic.io)";

async function fetchFeastDay(qid: string): Promise<string | null> {
  // Most figures have a single P841. If multiple, take the first — we already
  // hand-seed the figures where Catholic/Orthodox dates differ.
  const query = `SELECT ?feast WHERE { wd:${qid} wdt:P841 ?feast . } LIMIT 1`;
  const url = `${SPARQL}?query=${encodeURIComponent(query)}&format=json`;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/sparql-results+json" },
    });
    if (!res.ok) return null;
    const data: { results?: { bindings?: Array<{ feast?: { value: string } }> } } = await res.json();
    const raw = data.results?.bindings?.[0]?.feast?.value;
    if (!raw) return null;
    // Wikidata returns gregorian-typed dates as e.g. "2025-08-28T00:00:00Z";
    // sometimes only month-day is meaningful. Extract MM-DD.
    const m = /^(?:\d{4}-)?(\d{2})-(\d{2})/.exec(raw);
    return m ? `${m[1]}-${m[2]}` : null;
  } catch (e) {
    console.warn(`  ! failed for ${qid}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const people: Person[] = JSON.parse(fs.readFileSync(PEOPLE_FILE, "utf8"));
  const existing: Record<string, FeastEntry> = fs.existsSync(OUT_FILE)
    ? JSON.parse(fs.readFileSync(OUT_FILE, "utf8"))
    : {};

  let added = 0;
  let skipped = 0;
  let missing = 0;

  for (const p of people) {
    if (existing[p.id] && !FORCE) {
      skipped++;
      continue;
    }
    if (!p.wikidata_id) {
      missing++;
      continue;
    }
    process.stdout.write(`→ ${p.name.padEnd(40)} `);
    const date = await fetchFeastDay(p.wikidata_id);
    if (date) {
      existing[p.id] = { ...(existing[p.id] ?? {}), catholic: existing[p.id]?.catholic ?? date };
      added++;
      console.log(`✓ ${date}`);
    } else {
      missing++;
      console.log("—");
    }
    // Be polite to Wikidata.
    await new Promise((r) => setTimeout(r, 120));
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2) + "\n", "utf8");
  console.log(`\nDone. added=${added} skipped=${skipped} missing=${missing} total=${Object.keys(existing).length}`);
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
