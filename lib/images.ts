import fs from "node:fs";
import path from "node:path";
import type { TraditionStatus } from "./schema";
import type { EraSlug } from "./eras";

const DATA_DIR = path.join(process.cwd(), "data");

export type ContentImage = {
  src: string;
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
  license?: string;
  source?: string;
  source_url?: string;
  object_position?: string;
};

type ImageEntry = Omit<ContentImage, "src">;

let _eventImages: Record<string, ContentImage> | null = null;
let _eraImages: Record<string, ContentImage> | null = null;

const STATUS_TO_ERA_SLUG: Record<TraditionStatus, EraSlug> = {
  apostle: "apostolic",
  "apostolic-father": "apostolic-fathers",
  apologist: "apologists",
  "ante-nicene": "ante-nicene",
  nicene: "nicene",
  "post-nicene": "post-nicene",
  "desert-father": "desert-fathers",
};

function readJsonIfExists<T>(file: string): T {
  if (!fs.existsSync(file)) return {} as T;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function loadImages(dataFile: string, manifestFile: string): Record<string, ContentImage> {
  const entries = readJsonIfExists<Record<string, ImageEntry>>(path.join(DATA_DIR, dataFile));
  const manifest = readJsonIfExists<Record<string, string>>(path.join(DATA_DIR, manifestFile));
  const out: Record<string, ContentImage> = {};
  for (const [id, entry] of Object.entries(entries)) {
    out[id] = {
      ...entry,
      src: manifest[id] ?? entry.url,
    };
  }
  return out;
}

export function eraSlugForStatus(status: TraditionStatus): EraSlug {
  return STATUS_TO_ERA_SLUG[status];
}

export function getEventImages(): Record<string, ContentImage> {
  if (!_eventImages) _eventImages = loadImages("event-images.json", "event-image-manifest.json");
  return _eventImages;
}

export function getEraImages(): Record<string, ContentImage> {
  if (!_eraImages) _eraImages = loadImages("era-images.json", "era-image-manifest.json");
  return _eraImages;
}

export function getEventImage(id: string | undefined | null): ContentImage | undefined {
  if (!id) return undefined;
  return getEventImages()[id];
}

export function getEraImage(era: TraditionStatus | EraSlug | undefined | null): ContentImage | undefined {
  if (!era) return undefined;
  const key = era in STATUS_TO_ERA_SLUG ? STATUS_TO_ERA_SLUG[era as TraditionStatus] : era;
  return getEraImages()[key];
}

export function imageCredit(image: Pick<ContentImage, "credit" | "license">): string {
  return [image.credit, image.license].filter(Boolean).join(" · ");
}
