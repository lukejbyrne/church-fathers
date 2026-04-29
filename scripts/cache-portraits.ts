// Downloads every portrait referenced in data/images.json into /public/portraits/
// so we can serve them ourselves (no third-party cookies, faster, no Wikimedia
// runtime dependency). Writes data/portrait-manifest.json mapping id -> local path.
//
// Idempotent: if /public/portraits/{id}.{ext} already exists, skip the fetch.
// Run: pnpm cache-portraits        (or chained from `pnpm data`)
// Force re-download: pnpm cache-portraits --force

import fs from "node:fs";
import path from "node:path";

type ImageEntry = { url: string; credit?: string; license?: string };

const ROOT = process.cwd();
const IMAGES_FILE = path.join(ROOT, "data", "images.json");
const PORTRAITS_DIR = path.join(ROOT, "public", "portraits");
const MANIFEST_FILE = path.join(ROOT, "data", "portrait-manifest.json");

const FORCE = process.argv.includes("--force");
const CONCURRENCY = 2;
const MAX_RETRIES = 5;

function extOf(url: string): string {
  // Pull the last .xxx in the URL path (ignore query/hash).
  const noQuery = url.split("?")[0].split("#")[0];
  const m = noQuery.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (!m) return "jpg";
  const ext = m[1].toLowerCase();
  if (ext === "jpeg") return "jpg";
  return ext;
}

const THUMB_WIDTH = 600;

// Rewrite a Wikimedia URL to a fixed-width thumbnail. Cuts portrait sizes from
// 2–18 MB originals down to ~60 KB. Idempotent: returns existing-thumb URLs as-is.
function thumbify(url: string, width = THUMB_WIDTH): string {
  if (!url.includes("upload.wikimedia.org")) return url;

  // Already a thumb: replace the leading {N}px- in the filename with our width.
  // Example: .../thumb/X/XX/File.jpg/3840px-File.jpg → .../thumb/X/XX/File.jpg/600px-File.jpg
  const thumbMatch = url.match(/^(.+\/thumb\/[^/]+\/[^/]+\/[^/]+)\/(\d+)px-(.+)$/);
  if (thumbMatch) {
    return `${thumbMatch[1]}/${width}px-${thumbMatch[3]}`;
  }

  // Original (no /thumb/): convert to thumb form.
  // .../commons/X/XX/File.ext  →  .../commons/thumb/X/XX/File.ext/{w}px-File.ext
  // SVGs render to PNG: append .png so the thumb is rasterized.
  const origMatch = url.match(/^(https?:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)$/);
  if (origMatch) {
    const [, prefix, a, ab, file] = origMatch;
    const thumbFile = file.toLowerCase().endsWith(".svg") ? `${file}.png` : file;
    return `${prefix}/thumb/${a}/${ab}/${file}/${width}px-${thumbFile}`;
  }

  return url;
}

async function downloadOne(id: string, rawUrl: string): Promise<string | null> {
  const url = thumbify(rawUrl);
  // For SVG-via-thumb the served file is PNG, so use the rewritten URL's extension.
  const ext = extOf(url);
  const filename = `${id}.${ext}`;
  const target = path.join(PORTRAITS_DIR, filename);
  const localPath = `/portraits/${filename}`;

  if (!FORCE && fs.existsSync(target)) {
    return localPath;
  }

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

async function main() {
  if (!fs.existsSync(IMAGES_FILE)) {
    console.log("No data/images.json — nothing to cache.");
    return;
  }
  fs.mkdirSync(PORTRAITS_DIR, { recursive: true });

  const images: Record<string, ImageEntry> = JSON.parse(fs.readFileSync(IMAGES_FILE, "utf8"));
  const entries = Object.entries(images).filter(([, v]) => !!v.url);

  console.log(`Caching ${entries.length} portraits → /public/portraits/  (force=${FORCE})`);

  const results = await pool(entries, CONCURRENCY, async ([id, entry]) => {
    const localPath = await downloadOne(id, entry.url);
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

  // Sort keys for deterministic git diffs.
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(sorted, null, 2) + "\n");

  console.log(`Done. ${ok} cached, ${failed} failed. Manifest → ${path.relative(ROOT, MANIFEST_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
