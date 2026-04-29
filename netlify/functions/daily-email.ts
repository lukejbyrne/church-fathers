// Daily "Father of the Day" newsletter — Netlify scheduled function.
//
// Stack: MailerLite free tier (campaigns API). Triggered daily at 13:00 UTC.
// 1. Fetches today's figure from /api/today (deterministic by date).
// 2. Renders the HTML using the shared template at lib/email-template.ts.
// 3. Creates a MailerLite campaign + schedules an instant send to the configured group.
//
// REQUIRED ENV (Netlify → Site settings → Environment variables):
//   MAILERLITE_API_TOKEN     Bearer token (MailerLite → Integrations → API)
//   MAILERLITE_GROUP_ID      ID of the group/audience the campaign sends to
//   NEWSLETTER_FROM_EMAIL    Verified sender, e.g. newsletter@patristic.io
//   NEWSLETTER_FROM_NAME     Display name, e.g. "Patristic Lineage"
//   NEWSLETTER_BASE_URL      (Optional) override for fetch — defaults to https://patristic.io

import type { Config } from "@netlify/functions";
import { renderEmail, type EmailFigure } from "../../lib/email-template";

const MAILERLITE_API = "https://connect.mailerlite.com/api";

export default async () => {
  const token = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL;
  const fromName = process.env.NEWSLETTER_FROM_NAME ?? "Patristic Lineage";
  const siteUrl = process.env.NEWSLETTER_BASE_URL ?? "https://patristic.io";

  if (!token || !groupId || !fromEmail) {
    console.error(
      "[daily-email] missing env: MAILERLITE_API_TOKEN / MAILERLITE_GROUP_ID / NEWSLETTER_FROM_EMAIL"
    );
    return new Response(
      JSON.stringify({ ok: false, error: "Newsletter env not configured" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // Step 1: fetch today's figure from our own API (uses lib/featured.ts).
  let figure: EmailFigure;
  try {
    const res = await fetch(`${siteUrl}/api/today`);
    if (!res.ok) throw new Error(`api/today returned ${res.status}`);
    figure = (await res.json()) as EmailFigure;
  } catch (e) {
    console.error("[daily-email] failed to fetch /api/today:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const { subject, html, plain } = renderEmail(figure, siteUrl);
  const campaignName = `Father of the Day — ${figure.date} — ${figure.person.name}`;

  // Step 2: create a MailerLite campaign.
  // POST /campaigns — see https://developers.mailerlite.com/docs/campaigns.html
  const createRes = await fetch(`${MAILERLITE_API}/campaigns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: campaignName,
      type: "regular",
      groups: [groupId],
      emails: [
        {
          subject,
          from: fromEmail,
          from_name: fromName,
          content: html,
          plain,
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error(`[daily-email] MailerLite create failed (${createRes.status}):`, text);
    return new Response(
      JSON.stringify({ ok: false, step: "create", status: createRes.status, body: text }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  const created: { data?: { id: string } } = await createRes.json();
  const campaignId = created.data?.id;
  if (!campaignId) {
    return new Response(
      JSON.stringify({ ok: false, error: "MailerLite returned no campaign id", body: created }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  // Step 3: schedule the campaign for instant send.
  // POST /campaigns/{id}/schedule with delivery: "instant"
  const sendRes = await fetch(`${MAILERLITE_API}/campaigns/${campaignId}/schedule`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ delivery: "instant" }),
  });

  if (!sendRes.ok) {
    const text = await sendRes.text();
    console.error(`[daily-email] MailerLite schedule failed (${sendRes.status}):`, text);
    return new Response(
      JSON.stringify({
        ok: false,
        step: "schedule",
        campaign_id: campaignId,
        status: sendRes.status,
        body: text,
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  console.log(
    `[daily-email] scheduled campaign ${campaignId} for ${figure.date} (${figure.person.name})`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      campaign_id: campaignId,
      date: figure.date,
      figure: figure.person.name,
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};

// Daily at 13:00 UTC (≈ 9am ET winter, 1pm UK winter / 2pm BST).
export const config: Config = {
  schedule: "0 13 * * *",
};
