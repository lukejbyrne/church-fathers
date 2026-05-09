// Subscriber list backed by Netlify Blobs.
//
// One blob per email (key = lowercased email) under the "subscribers" store.
// Outside Netlify (local dev without auth env), degrades to no-op so forms
// don't break in preview.

import { getStore, type Store } from "@netlify/blobs";

export type Subscriber = {
  email: string;
  subscribed_at: string; // ISO timestamp
  source?: string | SubscriberAttribution;
};

export type SubscriberAttribution = {
  source?: string;
  landing_path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

const STORE_NAME = "subscribers";

function store(): Store | null {
  // Inside Netlify (Functions or Next.js runtime) getStore() auto-detects
  // the site context — no auth args needed. Outside Netlify (local dev),
  // we fall back to explicit creds if present, otherwise no-op.
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

function keyFor(email: string): string {
  return email.trim().toLowerCase();
}

export async function addSubscriber(
  email: string,
  source?: string | SubscriberAttribution
): Promise<{ ok: boolean; already?: boolean; persisted: boolean }> {
  const s = store();
  const key = keyFor(email);
  if (!s) return { ok: true, persisted: false };

  const existing = await s.get(key, { type: "json" }).catch(() => null);
  if (existing) return { ok: true, already: true, persisted: true };

  const record: Subscriber = {
    email: key,
    subscribed_at: new Date().toISOString(),
    source,
  };
  await s.setJSON(key, record);
  return { ok: true, persisted: true };
}

export async function removeSubscriber(email: string): Promise<boolean> {
  const s = store();
  if (!s) return false;
  const key = keyFor(email);
  const existed = !!(await s.get(key, { type: "json" }).catch(() => null));
  await s.delete(key);
  return existed;
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const s = store();
  if (!s) return [];
  const { blobs } = await s.list();
  const records = await Promise.all(
    blobs.map(async (b) => (await s.get(b.key, { type: "json" })) as Subscriber | null)
  );
  return records
    .filter((r): r is Subscriber => !!r)
    .sort((a, b) => b.subscribed_at.localeCompare(a.subscribed_at));
}
