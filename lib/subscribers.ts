// Subscriber list backed by Netlify Blobs.
//
// One blob per email (key = lowercased email) under the "subscribers" store.
// Outside Netlify (local dev without auth env), degrades to no-op so forms
// don't break in preview.

import { getStore, type Store } from "@netlify/blobs";

export type Subscriber = {
  email: string;
  subscribed_at: string; // ISO timestamp
  source?: string;
};

const STORE_NAME = "subscribers";

function blobsAvailable(): boolean {
  return !!(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN);
}

function store(): Store | null {
  if (!blobsAvailable()) return null;
  try {
    return getStore({
      name: STORE_NAME,
      siteID: process.env.NETLIFY_SITE_ID!,
      token: process.env.NETLIFY_AUTH_TOKEN!,
    });
  } catch {
    return null;
  }
}

function keyFor(email: string): string {
  return email.trim().toLowerCase();
}

export async function addSubscriber(
  email: string,
  source?: string
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
