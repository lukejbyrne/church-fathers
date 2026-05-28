// Send log backed by Netlify Blobs.
//
// One blob per ISO date keyed under the "sends" store. Atomic per-key writes,
// so the daily function can use it for idempotency: if a record exists with
// status "sent" for today, skip the email provider call.
//
// Outside Netlify (local script runs, dev), the wrapper detects the missing
// Blobs context and no-ops gracefully. Local previews don't need a real send log.

import { getStore, type Store } from "@netlify/blobs";
import type { Content } from "./picker";

export type SendRecord = {
  date: string;                 // YYYY-MM-DD UTC
  type: Content["type"];
  title: string;                // human-readable, e.g. "Augustine of Hippo"
  primary_id?: string;          // person_id or anniversary.id
  campaign_id?: string;
  provider?: "mailerlite" | "resend";
  recipient_count?: number;
  message_ids?: string[];
  status: "sent" | "failed";
  attempted_at: string;         // ISO timestamp
  override: boolean;
  reason?: string;
  error?: string;
};

const STORE_NAME = "sends";

function store(): Store | null {
  try {
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

export async function getSendRecord(date: string): Promise<SendRecord | null> {
  const s = store();
  if (!s) return null;
  try {
    const v = await s.get(date, { type: "json" });
    return (v as SendRecord) ?? null;
  } catch {
    return null;
  }
}

export async function setSendRecord(record: SendRecord): Promise<void> {
  const s = store();
  if (!s) return;
  await s.setJSON(record.date, record);
}

export async function listSends(limit = 60): Promise<SendRecord[]> {
  const s = store();
  if (!s) return [];
  try {
    const { blobs } = await s.list();
    // Each blob.key is the ISO date. Newest first.
    const sorted = blobs.map((b) => b.key).sort().reverse().slice(0, limit);
    const records = await Promise.all(
      sorted.map(async (k) => {
        const v = await s.get(k, { type: "json" });
        return (v as SendRecord) ?? null;
      })
    );
    return records.filter((r): r is SendRecord => r !== null);
  } catch {
    return [];
  }
}
