// Downloads event and era imagery into /public/events and /public/eras, then
// writes small manifests mapping ids to local public paths.
//
// Run: pnpm cache-content-images
// Force re-download: pnpm cache-content-images --force

import fs from "node:fs";
import path from "node:path";

type ImageEntry = { url: string };

type ImageSet = {
  dataFile: string;
  manifestFile: string;
  publicDir: string;
  publicPath: string;
  width: number;
};

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 2;
const MAX_RETRIES = 5;

const SETS: ImageSet[] = [
  {
    dataFile: "event-images.json",
    manifestFile: "event-image-manifest.json",
    publicDir: "events",
    publicPath: "/events",
    width: 1200,
  },
  {
    dataFile: "era-images.json",
    manifestFile: "era-image-manifest.json",
    publicDir: "eras",
    publicPath: "/eras",
    width: 1200,
  },
];

function extOf(url: string, contentType?: string | null): string {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";

  const noQuery = url.split("?")[0].split("#")[0];
  const m = noQuery.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (!m) return "jpg";
  const ext = m[1].toLowerCase();
  if (ext === "jpeg") return "jpg";
  return ext;
}

function thumbify(rawUrl: string, width: number): string {
  const url = rawUrl.replace(/[?&]utm_[^#]+/g, "");
  if (!url.includes("upload.wikimedia.org")) return url;

  const thumbMatch = url.match(/^(.+\/thumb\/[^/]+\/[^/]+\/[^/]+)\/(\d+)px-(.+)$/);
  if (thumbMatch) return `${thumbMatch[1]}/${width}px-${thumbMatch[3]}`;

  const origMatch = url.match(/^(https?:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)$/);
  if (!origMatch) return url;

  const [, prefix, a, ab, file] = origMatch;
  const thumbFile = file.toLowerCase().endsWith(".svg") ? `${file}.png` : file;
  return `${prefix}/thumb/${a}/${ab}/${file}/${width}px-${thumbFile}`;
}

async function downloadOne(
  id: string,
  rawUrl: string,
  set: ImageSet
): Promise<string | null> {
  const url = thumbify(rawUrl, set.width);
  const fallbackExt = extOf(url);
  const existing = fs
    .readdirSync(path.join(PUBLIC_DIR, set.publicDir), { withFileTypes: true })
    .find((entry) => entry.isFile() && entry.name.startsWith(`${id}.`));

  if (!FORCE && existing) return `${set.publicPath}/${existing.name}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "patristic-lineage/1.0 (+https://patristic.io)" },
      });
      if (res.status === 429 || res.status === 503) {
        const wait = Math.min(30000, 1000 * 2 ** attempt) + Math.random() * 500;
        console.warn(`  · ${id}: HTTP ${res.status}, retry ${attempt}/${MAX_RETRIES} in ${(wait / 1000).toFixed(1)}s`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        console.warn(`  ! ${id}: HTTP ${res.status} for ${url}`);
        return null;
      }

      const ext = extOf(res.url || url, res.headers.get("content-type")) || fallbackExt;
      const filename = `${id}.${ext}`;
      const target = path.join(PUBLIC_DIR, set.publicDir, filename);
      const localPath = `${set.publicPath}/${filename}`;
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(target, buf);
      console.log(`  + ${id} -> ${localPath} (${(buf.length / 1024).toFixed(0)} KB)`);
      return localPath;
    } catch (e) {
      console.warn(`  ! ${id}: ${(e as Error).message}`);
      if (attempt === MAX_RETRIES) return null;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  console.warn(`  ! ${id}: gave up after ${MAX_RETRIES} retries`);
  return null;
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function cacheSet(set: ImageSet) {
  const dataPath = path.join(DATA_DIR, set.dataFile);
  const manifestPath = path.join(DATA_DIR, set.manifestFile);
  const targetDir = path.join(PUBLIC_DIR, set.publicDir);
  if (!fs.existsSync(dataPath)) return;

  fs.mkdirSync(targetDir, { recursive: true });
  const images: Record<string, ImageEntry> = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const entries = Object.entries(images).filter(([, entry]) => Boolean(entry.url));

  console.log(`Caching ${entries.length} ${set.publicDir} images -> ${set.publicPath}  (force=${FORCE})`);
  const results = await pool(entries, CONCURRENCY, async ([id, entry]) => {
    const localPath = await downloadOne(id, entry.url, set);
    return [id, localPath] as const;
  });

  const manifest: Record<string, string> = {};
  let ok = 0;
  let failed = 0;
  for (const [id, localPath] of results) {
    if (localPath) {
      manifest[id] = localPath;
      ok++;
    } else {
      failed++;
    }
  }

  const sorted: Record<string, string> = {};
  for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
  fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`Done. ${ok} cached, ${failed} failed. Manifest -> ${path.relative(ROOT, manifestPath)}`);
}

async function main() {
  for (const set of SETS) await cacheSet(set);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
