// Subscribe endpoint — pushes new emails into the Resend audience that the
// daily Netlify function uses for sends.
//
// Required env (Netlify → Site settings → Environment variables):
//   RESEND_API_KEY        — your Resend API key (re_xxx)
//   RESEND_AUDIENCE_ID    — the audience the daily-email function broadcasts to
//
// If env is missing, the endpoint logs the email to the server console and
// returns ok: true so the form still feels successful (and you can backfill
// later from the logs). This avoids breaking signups during setup.

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

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.log("[subscribe] no Resend env yet — logging email:", email);
    return Response.json({ ok: true, queued: true });
  }

  const r = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!r.ok) {
    const text = await r.text();
    // Resend returns 422 if the contact already exists — treat that as success.
    if (r.status === 422 && /already exists/i.test(text)) {
      return Response.json({ ok: true, already_subscribed: true });
    }
    console.error(`[subscribe] Resend ${r.status}:`, text);
    return Response.json({ ok: false, error: "Provider error" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
