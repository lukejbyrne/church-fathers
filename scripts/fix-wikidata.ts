/**
 * Re-derives wikidata_id from wikipedia_url via the MediaWiki API.
 * Batches up to 50 titles per call. Updates each data/sources/<era>.json in place.
 */
import fs from "node:fs";
import path from "node:path";

const SOURCES = path.join(process.cwd(), "data", "sources");
const eras = ["apostolic", "ante-nicene", "nicene", "post-nicene"] as const;
const UA = "church-fathers-research/0.1 (https://github.com/lukebyrne; lukebyrnee97@gmail.com)";

function titleFromUrl(url: string): string | null {
  const m = url.match(/wikipedia\.org\/wiki\/(.+)$/);
  if (!m) return null;
  return decodeURIComponent(m[1]).replace(/_/g, " ");
}

async function batchLookup(titles: string[]): Promise<Map<string, string>> {
  // Returns map: requested-title (post-redirect-normalized) → Q-id, plus original titles.
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1` +
    `&titles=${encodeURIComponent(titles.join("|"))}&format=json&formatversion=2`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Encoding": "gzip" } });
  if (!res.ok) {
    console.warn(`[fix] HTTP ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`);
    return new Map();
  }
  const json = await res.json();
  const out = new Map<string, string>();

  // Build a map of requested → final via normalized + redirects
  const aliasMap = new Map<string, string>();
  for (const t of titles) aliasMap.set(t, t);
  for (const n of json.query?.normalized ?? []) {
    for (const [k, v] of aliasMap) if (v === n.from) aliasMap.set(k, n.to);
  }
  for (const r of json.query?.redirects ?? []) {
    for (const [k, v] of aliasMap) if (v === r.from) aliasMap.set(k, r.to);
  }

  const pageByTitle = new Map<string, any>();
  for (const p of json.query?.pages ?? []) pageByTitle.set(p.title, p);

  for (const [orig, final] of aliasMap) {
    const page = pageByTitle.get(final);
    const qid = page?.pageprops?.wikibase_item;
    if (qid) out.set(orig, qid);
  }
  return out;
}

async function main() {
  // Collect all (era, person, title) tuples
  type Job = { era: string; idx: number; title: string };
  const eraData: Record<string, any> = {};
  const jobs: Job[] = [];
  for (const era of eras) {
    const file = path.join(SOURCES, `${era}.json`);
    eraData[era] = JSON.parse(fs.readFileSync(file, "utf8"));
    for (let i = 0; i < eraData[era].people.length; i++) {
      const p = eraData[era].people[i];
      const t = p.wikipedia_url ? titleFromUrl(p.wikipedia_url) : null;
      if (t) jobs.push({ era, idx: i, title: t });
    }
  }

  let updated = 0,
    matched = 0,
    cleared = 0;
  const BATCH = 50;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const slice = jobs.slice(i, i + BATCH);
    const titles = Array.from(new Set(slice.map((j) => j.title)));
    const result = await batchLookup(titles);
    for (const j of slice) {
      const real = result.get(j.title);
      const p = eraData[j.era].people[j.idx];
      if (!real) {
        if (p.wikidata_id) {
          p.wikidata_id = null;
          cleared++;
        }
      } else if (p.wikidata_id !== real) {
        p.wikidata_id = real;
        updated++;
      } else {
        matched++;
      }
    }
    await new Promise((r) => setTimeout(r, 1000)); // 1 req/sec
    process.stdout.write(`.`);
  }
  process.stdout.write("\n");

  for (const era of eras) {
    fs.writeFileSync(path.join(SOURCES, `${era}.json`), JSON.stringify(eraData[era], null, 2));
  }
  console.log(`[fix] jobs ${jobs.length} | updated ${updated} | matched ${matched} | cleared ${cleared}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
