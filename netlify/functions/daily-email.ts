// Daily "Father of the Day" newsletter — runs on a Netlify schedule, fetches
// the day's figure from our own /api/today endpoint, and sends a broadcast via
// Resend to the configured audience.
//
// Required env vars (set in Netlify → Site settings → Environment variables):
//   RESEND_API_KEY        — your Resend API key (re_xxx)
//   RESEND_AUDIENCE_ID    — id of the audience this newsletter sends to
//   RESEND_FROM_ADDRESS   — verified sender, e.g. "Patristic Lineage <newsletter@patristic.io>"
//   NEWSLETTER_BASE_URL   — optional override for fetching /api/today (default: https://patristic.io)
//
// Schedule: see `export const config` at the bottom — daily at 13:00 UTC (≈ 7am ET / 8am CT / 9am ET DST / 1pm UK BST).

import type { Config } from "@netlify/functions";

type ApiTodayResponse = {
  date: string;
  person: {
    id: string;
    name: string;
    url: string;
    image_url?: string;
    born?: number | null;
    died?: number | null;
    see?: string;
    short_bio: string;
    why_matters?: string;
    primary_citation?: string;
  };
  next_date: string;
};

const RESEND_API = "https://api.resend.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(data: ApiTodayResponse, siteUrl: string): { subject: string; html: string } {
  const p = data.person;
  const dateLine = `${p.born ?? "?"} – ${p.died ?? "?"}`;
  const subject = `Today's Father: ${p.name}`;
  const body = p.why_matters || p.short_bio;
  const cite = p.primary_citation
    ? `<blockquote style="border-left:3px solid #8b1e2d33;padding:0 16px;margin:24px 0;color:#1f1a13aa;font-style:italic;font-family:Georgia,serif;">${escapeHtml(p.primary_citation)}</blockquote>`
    : "";
  const img = p.image_url
    ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" width="120" height="120" style="border-radius:50%;object-fit:cover;object-position:center 18%;border:1px solid #1f1a1322;display:block;margin:0 auto 16px;" />`
    : "";

  // Inline-styled HTML for maximum email client compatibility.
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5efe0;font-family:Georgia,serif;color:#1f1a13;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffaf0;border:1px solid #1f1a1320;border-radius:8px;">
          <tr>
            <td style="padding:32px 32px 16px;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#1f1a1380;">
                Patristic Lineage · ${escapeHtml(data.date)}
              </p>
              ${img}
              <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#1f1a13;text-align:center;">
                ${escapeHtml(p.name)}
              </h1>
              <p style="margin:0 0 24px;text-align:center;font-size:13px;color:#1f1a13aa;">
                ${escapeHtml(dateLine)}${p.see ? ` · Bishop of ${escapeHtml(p.see)}` : ""}
              </p>
              <div style="font-size:16px;color:#1f1a13e0;">
                ${escapeHtml(body).split(/\n\n+/).map((para) => `<p style="margin:0 0 16px;">${para}</p>`).join("")}
              </div>
              ${cite}
              <div style="text-align:center;margin:32px 0 8px;">
                <a href="${escapeHtml(p.url)}" style="display:inline-block;padding:10px 20px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;">
                  Read the full chain to Jesus →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #1f1a1318;">
              <p style="margin:0;font-size:12px;color:#1f1a1380;">
                This is one of 206 figures we track from Jesus to John of Damascus, AD 30–750.
                Tomorrow: another. Browse the full lineage at
                <a href="${escapeHtml(siteUrl)}" style="color:#8b1e2d;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#1f1a1360;">
                You're getting this because you signed up at ${escapeHtml(siteUrl)}/today.
                Unsubscribe anytime via the link in the email footer.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

export default async (req: Request) => {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const from = process.env.RESEND_FROM_ADDRESS;
  const siteUrl = process.env.NEWSLETTER_BASE_URL ?? "https://patristic.io";

  if (!apiKey || !audienceId || !from) {
    console.error("[daily-email] missing env: RESEND_API_KEY / RESEND_AUDIENCE_ID / RESEND_FROM_ADDRESS");
    return new Response(
      JSON.stringify({ ok: false, error: "Newsletter env not configured" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // Fetch today's figure from our own API.
  let figure: ApiTodayResponse;
  try {
    const res = await fetch(`${siteUrl}/api/today`);
    if (!res.ok) throw new Error(`api/today returned ${res.status}`);
    figure = (await res.json()) as ApiTodayResponse;
  } catch (e) {
    console.error("[daily-email] failed to fetch /api/today:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const { subject, html } = renderEmail(figure, siteUrl);

  // Step 1: create the broadcast.
  const createRes = await fetch(`${RESEND_API}/broadcasts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audience_id: audienceId,
      from,
      subject,
      html,
      name: `Father of the Day — ${figure.date} — ${figure.person.name}`,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error(`[daily-email] Resend create failed (${createRes.status}):`, text);
    return new Response(
      JSON.stringify({ ok: false, error: `Resend create: ${createRes.status}`, body: text }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  const created: { id: string } = await createRes.json();

  // Step 2: send the broadcast immediately.
  const sendRes = await fetch(`${RESEND_API}/broadcasts/${created.id}/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!sendRes.ok) {
    const text = await sendRes.text();
    console.error(`[daily-email] Resend send failed (${sendRes.status}):`, text);
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Resend send: ${sendRes.status}`,
        body: text,
        broadcast_id: created.id,
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  console.log(`[daily-email] sent broadcast ${created.id} for ${figure.date} (${figure.person.name})`);

  return new Response(
    JSON.stringify({
      ok: true,
      broadcast_id: created.id,
      date: figure.date,
      figure: figure.person.name,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};

// Schedule: daily at 13:00 UTC. Works out to 9am ET (winter), 8am ET (summer DST),
// 1pm UK winter, 2pm UK summer. Adjust if you want a different send time.
//
// Cron format: minute hour day month dow
export const config: Config = {
  schedule: "0 13 * * *",
};
