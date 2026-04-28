// SUBSCRIBE STUB
// To go live, set NEWSLETTER_PROVIDER and the matching credentials in env, then
// uncomment the relevant block below:
//
// 1. Resend       (https://resend.com)        — set RESEND_API_KEY + RESEND_AUDIENCE_ID
// 2. ConvertKit   (https://convertkit.com)    — set CONVERTKIT_API_KEY + CONVERTKIT_FORM_ID
// 3. Buttondown   (https://buttondown.email)  — set BUTTONDOWN_API_KEY
//
// All three have simple HTTP APIs; the patterns below show the request shape.
// No external SDK is added as a dependency — keep this stub-able.

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

  // TODO: provider integration. For now, just log to server.
  console.log("[subscribe] new email:", email);

  // --- 1. Resend (uncomment when RESEND_API_KEY + RESEND_AUDIENCE_ID are set) ---
  // const r = await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ email, unsubscribed: false }),
  // });
  // if (!r.ok) return Response.json({ ok: false, error: "Provider error" }, { status: 502 });

  // --- 2. ConvertKit (uncomment when CONVERTKIT_API_KEY + CONVERTKIT_FORM_ID are set) ---
  // const r = await fetch(`https://api.convertkit.com/v3/forms/${process.env.CONVERTKIT_FORM_ID}/subscribe`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ api_key: process.env.CONVERTKIT_API_KEY, email }),
  // });
  // if (!r.ok) return Response.json({ ok: false, error: "Provider error" }, { status: 502 });

  // --- 3. Buttondown (uncomment when BUTTONDOWN_API_KEY is set) ---
  // const r = await fetch("https://api.buttondown.email/v1/subscribers", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Token ${process.env.BUTTONDOWN_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ email_address: email }),
  // });
  // if (!r.ok) return Response.json({ ok: false, error: "Provider error" }, { status: 502 });

  return Response.json({ ok: true });
}
