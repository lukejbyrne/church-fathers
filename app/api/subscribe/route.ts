// Subscribe endpoint.
// Netlify Blobs is the source of truth. The daily Resend function reads this
// list directly and sends one email per subscriber.

import { addSubscriber } from "@/lib/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscribeAttribution = {
  source?: string;
  landing_path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

export async function POST(req: Request) {
  let payload: { email?: string; attribution?: SubscribeAttribution };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const attribution = payload.attribution ?? { source: "web" };
  const result = await addSubscriber(email, attribution);

  if (!result.persisted) {
    console.log("[subscribe] blobs unavailable — email not persisted:", email);
    return Response.json({ ok: true, queued: true });
  }
  return Response.json({ ok: true, already_subscribed: result.already ?? false });
}
