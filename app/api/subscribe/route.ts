// Subscribe endpoint — dual-write.
//   1. Persist to Netlify Blobs (source of truth, survives provider swaps).
//   2. Best-effort push to the configured MailerLite group so the daily
//      campaign can send to them. MailerLite failure does not fail the
//      request — Blobs is the canonical record.

import { addSubscriber } from "@/lib/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAILERLITE_API = "https://connect.mailerlite.com/api";

async function pushToMailerLite(email: string): Promise<void> {
  const token = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!token || !groupId) return;
  try {
    const r = await fetch(`${MAILERLITE_API}/subscribers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, groups: [groupId], status: "active" }),
    });
    if (!r.ok && r.status !== 422) {
      console.error(`[subscribe] MailerLite ${r.status}:`, await r.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[subscribe] MailerLite push error:", e);
  }
}

export async function POST(req: Request) {
  let payload: { email?: string };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const result = await addSubscriber(email, "web");

  // Always push to MailerLite (idempotent), even if Blobs reported "already".
  await pushToMailerLite(email.toLowerCase());

  if (!result.persisted) {
    console.log("[subscribe] blobs unavailable — email not persisted:", email);
    return Response.json({ ok: true, queued: true });
  }
  return Response.json({ ok: true, already_subscribed: result.already ?? false });
}
