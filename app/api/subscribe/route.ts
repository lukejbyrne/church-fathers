// Subscribe endpoint — pushes new emails into the MailerLite group that the
// daily Netlify function broadcasts to.
//
// REQUIRED ENV:
//   MAILERLITE_API_TOKEN   Bearer token (MailerLite → Integrations → API)
//   MAILERLITE_GROUP_ID    ID of the newsletter group/audience
//
// If env is missing, the endpoint logs the email to the server console and
// returns ok: true so the form still feels successful (graceful degradation
// during setup — you can backfill later from logs).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAILERLITE_API = "https://connect.mailerlite.com/api";

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

  const token = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!token || !groupId) {
    console.log("[subscribe] no MailerLite env yet — logging email:", email);
    return Response.json({ ok: true, queued: true });
  }

  // POST /subscribers — adds (or updates) a contact and assigns them to the group.
  // https://developers.mailerlite.com/docs/subscribers.html
  const r = await fetch(`${MAILERLITE_API}/subscribers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      groups: [groupId],
      status: "active",
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    // 422 = validation; 200/201 = created/updated. Treat anything 4xx with
    // "already" or "exists" or "subscribed" as a soft success — they're already on the list.
    if (r.status === 422 && /already|exist|subscrib/i.test(text)) {
      return Response.json({ ok: true, already_subscribed: true });
    }
    console.error(`[subscribe] MailerLite ${r.status}:`, text);
    return Response.json({ ok: false, error: "Provider error" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
