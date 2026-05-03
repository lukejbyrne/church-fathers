import { createHash, randomUUID } from "node:crypto";
import { getStore, type Store } from "@netlify/blobs";

export type AnalyticsEvent = {
  v: 1;
  ts: string;
  day: string;
  path: string;
  visitor: string;
  referrer?: string;
  country?: string;
  region?: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet" | "bot";
  browser: string;
  bot: boolean;
};

export type AnalyticsSummary = {
  days: number;
  generated_at: string;
  pageviews: number;
  visitors: number;
  bot_pageviews: number;
  top_pages: CountRow[];
  top_sources: CountRow[];
  countries: CountRow[];
  devices: CountRow[];
  browsers: CountRow[];
  daily: Array<{ day: string; pageviews: number; visitors: number }>;
};

type CountRow = { name: string; count: number };

const STORE_NAME = "analytics-events";
const MAX_PATH_LENGTH = 500;
const MAX_REFERRER_LENGTH = 300;

type PageviewPayload = {
  path?: unknown;
  referrer?: unknown;
};

function store(): Store | null {
  try {
    return getStore(STORE_NAME);
  } catch {}

  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!siteID || !token) return null;

  try {
    return getStore({ name: STORE_NAME, siteID, token });
  } catch {
    return null;
  }
}

function header(req: Request, name: string): string | undefined {
  return req.headers.get(name) ?? undefined;
}

function firstForwardedIp(value?: string): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

function clientIp(req: Request): string {
  return (
    header(req, "x-nf-client-connection-ip") ??
    firstForwardedIp(header(req, "x-forwarded-for")) ??
    header(req, "x-real-ip") ??
    "unknown"
  );
}

function hostOf(req: Request): string | undefined {
  const host = header(req, "x-forwarded-host") ?? header(req, "host");
  return host?.toLowerCase();
}

function sanitizePath(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "/";

  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(value, "https://example.local");
    const path = `${url.pathname}${url.search}`;
    return path.slice(0, MAX_PATH_LENGTH) || "/";
  } catch {
    const trimmed = value.trim();
    if (!trimmed.startsWith("/")) return "/";
    return trimmed.slice(0, MAX_PATH_LENGTH);
  }
}

function sanitizeReferrer(value: unknown, requestHost?: string): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;

  try {
    const url = new URL(value);
    const host = url.host.toLowerCase();
    if (requestHost && host === requestHost) return "internal";
    return `${url.origin}${url.pathname}`.slice(0, MAX_REFERRER_LENGTH);
  } catch {
    return undefined;
  }
}

function parseGeo(req: Request): Pick<AnalyticsEvent, "country" | "region" | "city"> {
  const raw = header(req, "x-nf-geo");
  if (raw) {
    try {
      const geo = JSON.parse(raw) as Record<string, unknown>;
      const country = geo.country as Record<string, unknown> | string | undefined;
      const subdivision = geo.subdivision as Record<string, unknown> | string | undefined;
      const city = asText(geo.city);
      const region = asText(subdivision) ?? asTextRecordValue(subdivision, "name");
      const countryName =
        asText(country) ?? asTextRecordValue(country, "name") ?? asTextRecordValue(country, "code");
      return { country: countryName, region, city };
    } catch {}
  }

  return {
    country: header(req, "x-country") ?? header(req, "cf-ipcountry"),
  };
}

function asText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asTextRecordValue(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  return asText((value as Record<string, unknown>)[key]);
}

function classifyUserAgent(userAgent: string): Pick<AnalyticsEvent, "device" | "browser" | "bot"> {
  const ua = userAgent.toLowerCase();
  const bot =
    /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|duckduckgo|baiduspider|yandex|semrush|ahrefs|mj12bot|curl|wget|python-requests/.test(
      ua
    );
  if (bot) return { device: "bot", browser: "Bot", bot: true };

  const device = /ipad|tablet|kindle/.test(ua)
    ? "tablet"
    : /mobi|iphone|android/.test(ua)
      ? "mobile"
      : "desktop";

  let browser = "Other";
  if (/edg\//.test(ua)) browser = "Edge";
  else if (/opr\//.test(ua) || /opera/.test(ua)) browser = "Opera";
  else if (/samsungbrowser/.test(ua)) browser = "Samsung Internet";
  else if (/chrome|crios/.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/.test(ua)) browser = "Firefox";
  else if (/safari/.test(ua)) browser = "Safari";

  return { device, browser, bot: false };
}

function visitorHash(ip: string, userAgent: string): string {
  const salt =
    process.env.ANALYTICS_SALT ??
    process.env.ADMIN_TOKEN ??
    process.env.NETLIFY_SITE_ID ??
    "local-analytics";

  return createHash("sha256")
    .update(salt)
    .update("|")
    .update(ip)
    .update("|")
    .update(userAgent)
    .digest("hex")
    .slice(0, 24);
}

export async function recordPageview(
  req: Request,
  payload: PageviewPayload
): Promise<{ ok: true; persisted: boolean }> {
  const s = store();
  if (!s) return { ok: true, persisted: false };

  const now = new Date();
  const ts = now.toISOString();
  const day = ts.slice(0, 10);
  const userAgent = header(req, "user-agent") ?? "unknown";
  const event: AnalyticsEvent = {
    v: 1,
    ts,
    day,
    path: sanitizePath(payload.path),
    visitor: visitorHash(clientIp(req), userAgent),
    referrer: sanitizeReferrer(payload.referrer, hostOf(req)),
    ...parseGeo(req),
    ...classifyUserAgent(userAgent),
  };

  await s.setJSON(`${day}-${ts.replace(/[:.]/g, "-")}-${randomUUID()}.json`, event);
  return { ok: true, persisted: true };
}

export async function listAnalyticsEvents(days = 30): Promise<AnalyticsEvent[]> {
  const s = store();
  if (!s) return [];

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - Math.max(days - 1, 0));
  const cutoffDay = cutoff.toISOString().slice(0, 10);

  const keys: string[] = [];
  for await (const page of s.list({ paginate: true })) {
    for (const blob of page.blobs) {
      if (blob.key >= cutoffDay) keys.push(blob.key);
    }
  }
  keys.sort();

  const records = await Promise.all(
    keys.map(async (key) => {
      try {
        return (await s.get(key, { type: "json" })) as AnalyticsEvent | null;
      } catch {
        return null;
      }
    })
  );

  return records
    .filter((record): record is AnalyticsEvent => record?.v === 1)
    .filter((record) => record.day >= cutoffDay);
}

export function summarizeAnalyticsEvents(
  events: AnalyticsEvent[],
  options: { days?: number; includeBots?: boolean } = {}
): AnalyticsSummary {
  const days = options.days ?? 30;
  const botPageviews = events.filter((event) => event.bot).length;
  const filtered = options.includeBots ? events : events.filter((event) => !event.bot);

  return {
    days,
    generated_at: new Date().toISOString(),
    pageviews: filtered.length,
    visitors: unique(filtered.map((event) => event.visitor)),
    bot_pageviews: botPageviews,
    top_pages: topCounts(filtered.map((event) => event.path || "/")),
    top_sources: topCounts(firstSourcesByVisitor(filtered)),
    countries: topCounts(filtered.map((event) => event.country ?? "Unknown")),
    devices: topCounts(filtered.map((event) => event.device)),
    browsers: topCounts(filtered.map((event) => event.browser)),
    daily: dailyCounts(filtered, days),
  };
}

function unique(values: string[]): number {
  return new Set(values).size;
}

function topCounts(values: string[], limit = 10): CountRow[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function firstSourcesByVisitor(events: AnalyticsEvent[]): string[] {
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts));
  const sources = new Map<string, string>();

  for (const event of sorted) {
    if (!sources.has(event.visitor)) {
      sources.set(event.visitor, event.referrer ?? "Direct");
    }
  }

  return Array.from(sources.values());
}

function dailyCounts(
  events: AnalyticsEvent[],
  days: number
): Array<{ day: string; pageviews: number; visitors: number }> {
  const rows = new Map<string, { pageviews: number; visitors: Set<string> }>();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - Math.max(days - 1, 0));

  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    rows.set(day.toISOString().slice(0, 10), { pageviews: 0, visitors: new Set() });
  }

  for (const event of events) {
    const row = rows.get(event.day);
    if (!row) continue;
    row.pageviews += 1;
    row.visitors.add(event.visitor);
  }

  return Array.from(rows, ([day, row]) => ({
    day,
    pageviews: row.pageviews,
    visitors: row.visitors.size,
  }));
}
