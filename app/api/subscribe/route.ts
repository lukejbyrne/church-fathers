// Subscribe endpoint — stores emails in Netlify Blobs ("subscribers" store).
// The daily-email function can later read from this list (or you can export
// it via /api/subscribers and import into MailerLite / wherever).

import { addSubscriber } from "@/lib/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (!result.persisted) {
    // Blobs not available (local dev) — log so it's not silently dropped.
    console.log("[subscribe] blobs unavailable — email not persisted:", email);
    return Response.json({ ok: true, queued: true });
  }

  return Response.json({ ok: true, already_subscribed: result.already ?? false });
}
