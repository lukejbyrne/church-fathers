// Fetches a portrait image (painting/icon) for every person with a wikipedia_url
// using the Wikipedia REST summary API, and writes the result to data/images.json
// keyed by person id. Survives `pnpm merge` because it's a sidecar file.
//
// Run: pnpm fetch-images
// Re-run is safe — by default existing entries are kept; pass --force to refetch.

import fs from "node:fs";
import path from "node:path";

type Person = { id: string; name: string; wikipedia_url?: string };
type ImageEntry = { url: string; credit: string; license?: string; source: "wikipedia" };

const ROOT = process.cwd();
const PEOPLE_FILE = path.join(ROOT, "data", "people.json");
const OUT_FILE = path.join(ROOT, "data", "images.json");

const FORCE = process.argv.includes("--force");

function titleFromUrl(url: string): string | null {
  // e.g. "https://en.wikipedia.org/wiki/Polycarp" → "Polycarp"
  const m = url.match(/\/wiki\/([^?#]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchImage(title: string): Promise<ImageEntry | null> {
  const api = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(api, {
      headers: { "user-agent": "patristic-lineage/1.0 (+https://patristic.io)" },
    });
    if (!res.ok) return null;
    const data: {
      thumbnail?: { source: string };
      originalimage?: { source: string };
    } = await res.json();
    const url = data.originalimage?.source ?? data.thumbnail?.source;
    if (!url) return null;
    return {
      url,
      credit: "via Wikipedia",
      source: "wikipedia",
    };
  } catch (e) {
    console.warn(`  ! failed for ${title}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const people: Person[] = JSON.parse(fs.readFileSync(PEOPLE_FILE, "utf8"));
  const existing: Record<string, ImageEntry> = fs.existsSync(OUT_FILE)
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
    if (!p.wikipedia_url) {
      missing++;
      continue;
    }
    const title = titleFromUrl(p.wikipedia_url);
    if (!title) {
      missing++;
      continue;
    }
    process.stdout.write(`→ ${p.name.padEnd(40)} `);
    const img = await fetchImage(title);
    if (img) {
      existing[p.id] = img;
      added++;
      console.log("✓");
    } else {
      missing++;
      console.log("—");
    }
    // Be polite to Wikipedia.
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
