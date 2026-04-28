/**
 * Pulls hard bio fields from Wikidata SPARQL for each person with a wikidata_id.
 * Compares against current data and writes data/enrich-report.md flagging conflicts.
 * Does NOT mutate data/people.json — Luke reviews the report and adjusts source files.
 */
import fs from "node:fs";
import path from "node:path";
import { Person } from "../lib/schema";

const ENDPOINT = "https://query.wikidata.org/sparql";
const DATA = path.join(process.cwd(), "data");

const people: Person[] = JSON.parse(fs.readFileSync(path.join(DATA, "people.json"), "utf8"));
const targets = people.filter((p) => p.wikidata_id);

async function main() {
if (targets.length === 0) {
  console.log("[enrich] no people have wikidata_id — nothing to do");
  return;
}

const ids = targets.map((p) => `wd:${p.wikidata_id}`).join(" ");
const query = `
SELECT ?item ?itemLabel ?birth ?death ?birthPlaceLabel ?deathPlaceLabel WHERE {
  VALUES ?item { ${ids} }
  OPTIONAL { ?item wdt:P569 ?birth. }
  OPTIONAL { ?item wdt:P570 ?death. }
  OPTIONAL { ?item wdt:P19 ?birthPlace. }
  OPTIONAL { ?item wdt:P20 ?deathPlace. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`.trim();

const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

const res = await fetch(url, { headers: { "User-Agent": "church-fathers/0.1 (research)" } });
if (!res.ok) {
  console.error(`[enrich] wikidata returned ${res.status}`);
  process.exit(1);
}
const json = await res.json();

const wd = new Map<string, any>();
for (const b of json.results.bindings) {
  const qid = b.item.value.split("/").pop();
  wd.set(qid, b);
}

const lines: string[] = [`# Wikidata cross-check report`, ``];
let conflicts = 0;
for (const p of targets) {
  const w = wd.get(p.wikidata_id!);
  if (!w) {
    lines.push(`## ${p.name} (\`${p.id}\`)\n- Wikidata id ${p.wikidata_id} returned no result\n`);
    continue;
  }
  const wBirthYear = w.birth ? parseYear(w.birth.value) : null;
  const wDeathYear = w.death ? parseYear(w.death.value) : null;
  const ours = `${p.born ?? "?"} – ${p.died ?? "?"}`;
  const theirs = `${wBirthYear ?? "?"} – ${wDeathYear ?? "?"}`;
  const conflict =
    (wBirthYear != null && p.born != null && Math.abs(wBirthYear - p.born) > 5) ||
    (wDeathYear != null && p.died != null && Math.abs(wDeathYear - p.died) > 5);
  if (conflict) {
    conflicts++;
    lines.push(`## ${p.name} (\`${p.id}\`) ⚠`);
    lines.push(`- Ours: ${ours}`);
    lines.push(`- Wikidata: ${theirs}`);
    if (w.birthPlaceLabel?.value) lines.push(`- Wikidata birthplace: ${w.birthPlaceLabel.value}`);
    if (w.deathPlaceLabel?.value) lines.push(`- Wikidata deathplace: ${w.deathPlaceLabel.value}`);
    lines.push("");
  }
}

lines.unshift(`Total checked: ${targets.length}. Conflicts: ${conflicts}.`, ``);
fs.writeFileSync(path.join(DATA, "enrich-report.md"), lines.join("\n"));
console.log(`[enrich] wrote data/enrich-report.md — ${conflicts} conflicts of ${targets.length} checked`);

}
main().catch((e) => { console.error(e); process.exit(1); });

function parseYear(iso: string): number | null {
  // Wikidata returns "+0155-..." or "-0044-..." or just "0030-..." for AD without prefix
  const m = iso.match(/^([+-]?)(\d{1,4})/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * parseInt(m[2], 10);
}
