// Generates a CSV of Wikidata "described at URL (P973)" edits to add for every
// person we have a wikidata_id for. You then paste the CSV into QuickStatements
// (https://quickstatements.toolforge.org/) which performs the edits in your
// Wikidata account — fastest way to seed authoritative inbound links.
//
// Run: pnpm wikidata-edits
// Then: copy out/wikidata-edits.qs into QuickStatements → "Run".

import fs from "node:fs";
import path from "node:path";

type Person = {
  id: string;
  name: string;
  significance: number;
  wikidata_id?: string;
  short_bio: string;
};

const ROOT = process.cwd();
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";
const PEOPLE_FILE = path.join(ROOT, "data", "people.json");
const OUT_DIR = path.join(ROOT, "out");
const OUT_FILE = path.join(OUT_DIR, "wikidata-edits.qs");

// Cap by significance to avoid spamming Wikidata with minor figures on first pass.
// 3 = major Father, 4 = apostle / Jesus. Lower the floor once the first batch lands cleanly.
const MIN_SIG = Number(process.argv.find((a) => a.startsWith("--sig="))?.split("=")[1] ?? 3);

function escapeQs(s: string): string {
  // QuickStatements monolingual / string values are wrapped in double quotes,
  // with internal double quotes escaped.
  return `"${s.replace(/"/g, '\\"')}"`;
}

function main() {
  const people: Person[] = JSON.parse(fs.readFileSync(PEOPLE_FILE, "utf8"));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const lines: string[] = [];
  let added = 0;
  let skipped = 0;

  for (const p of people) {
    if (!p.wikidata_id) {
      skipped++;
      continue;
    }
    if (p.significance < MIN_SIG) continue;

    const url = `${SITE}/fathers/${p.id}`;
    // P973 = "described at URL"
    // S854 = "reference URL" (we cite ourselves as the source of the claim)
    // S813 = "retrieved" (today's date)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "-");
    lines.push(
      [
        p.wikidata_id,
        "P973",
        escapeQs(url),
        "S854",
        escapeQs(url),
        "S813",
        `+${today}T00:00:00Z/11`,
      ].join("\t")
    );
    added++;
  }

  const header = `# QuickStatements v1 batch — ${added} P973 edits for ${SITE}\n# Generated ${new Date().toISOString()}\n# Paste into https://quickstatements.toolforge.org/#/batch (V1 mode).\n\n`;
  fs.writeFileSync(OUT_FILE, header + lines.join("\n") + "\n", "utf8");

  console.log(`✓ ${added} statements written to ${OUT_FILE}`);
  console.log(`  (skipped ${skipped} people without wikidata_id)`);
  console.log(`\nNext steps:`);
  console.log(`  1. Sign in to Wikidata (your normal Wikipedia account works).`);
  console.log(`  2. Go to https://quickstatements.toolforge.org/`);
  console.log(`  3. Click "New batch" → V1 commands → paste contents of out/wikidata-edits.qs`);
  console.log(`  4. Click "Import V1 commands" → "Run".`);
  console.log(`  5. Watch for failures — Wikidata may reject if a P973 already points to a different URL.`);
  console.log(`\nLower threshold with --sig=2 once the first batch is clean.`);
}

main();
