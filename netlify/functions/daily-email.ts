// Daily Patristic newsletter — Netlify scheduled function.
//
// Stack: MailerLite free tier (campaigns API). Triggered daily at 13:00 UTC.
//   1. Idempotency check via Netlify Blobs send-log — skip if already sent today.
//   2. Pick today's Content via lib/picker.ts (override → feast → anniversary → era → quote).
//   3. Render via the shared template at lib/email-template.ts.
//   4. Create + schedule a MailerLite campaign.
//   5. Write a SendRecord to Netlify Blobs.
//
// REQUIRED ENV (Netlify → Site settings → Environment variables):
//   MAILERLITE_API_TOKEN     Bearer token (MailerLite → Integrations → API)
//   MAILERLITE_GROUP_ID      ID of the group/audience the campaign sends to
//   NEWSLETTER_FROM_EMAIL    Verified sender, e.g. newsletter@patristic.io
//   NEWSLETTER_FROM_NAME     Display name, e.g. "Patristic Lineage"
//   NEWSLETTER_BASE_URL      (Optional) override for site URL — defaults to https://patristic.io
//
// NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN are injected automatically and power
// the send-log blob store.

import type { Config } from "@netlify/functions";
import { renderEmail } from "../../lib/email-template";
import { pickContent, isoDate } from "../../lib/picker";
import { buildExtras } from "../../lib/email-helpers";
import { getSendRecord, setSendRecord, type SendRecord } from "../../lib/send-log";
import type { Content } from "../../lib/picker";

const MAILERLITE_API = "https://connect.mailerlite.com/api";

function titleOf(c: Content): string {
  switch (c.type) {
    case "father":
    case "heretic":
    case "quote":
      return c.person.name;
    case "council":
    case "schism":
      return `${c.anniversary.title} (${c.anniversary.year})`;
    case "era":
      return `Era spotlight: ${c.era}`;
  }
}

function primaryIdOf(c: Content): string | undefined {
  switch (c.type) {
    case "father":
    case "quote":
      return c.person.id;
    case "heretic":
      return c.anniversary?.id ?? c.person.id;
    case "council":
    case "schism":
      return c.anniversary.id;
    case "era":
      return c.era;
  }
}

function reasonOf(c: Content): string {
  switch (c.type) {
    case "father":
      return c.reason;
    case "council":
    case "schism":
      return "anniversary";
    case "heretic":
      return "heresy-condemnation";
    case "era":
      return "era-spotlight";
    case "quote":
      return "quote-rotation";
  }
}

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
    return new Response(JSON.stringify({ ok: false, error: "Newsletter env not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const date = new Date();
  const iso = isoDate(date);

  // Step 1: idempotency check.
  const prior = await getSendRecord(iso);
  if (prior?.status === "sent") {
    console.log(`[daily-email] already sent ${iso} (campaign ${prior.campaign_id}) — skipping.`);
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "already sent", date: iso, campaign_id: prior.campaign_id }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // Step 2: pick today's content.
  const content = pickContent(date);
  const extras = buildExtras(content, siteUrl);
  const { subject, html, plain } = renderEmail(content, siteUrl, extras);
  const campaignName = `Patristic — ${iso} — ${content.type} — ${titleOf(content)}`;

  const baseRecord: Omit<SendRecord, "status"> = {
    date: iso,
    type: content.type,
    title: titleOf(content),
    primary_id: primaryIdOf(content),
    attempted_at: new Date().toISOString(),
    override: content.type === "father" && content.reason === "override",
    reason: reasonOf(content),
  };

  // Step 3: create the MailerLite campaign.
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
      emails: [{ subject, from: fromEmail, from_name: fromName, content: html, plain }],
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error(`[daily-email] MailerLite create failed (${createRes.status}):`, text);
    await setSendRecord({ ...baseRecord, status: "failed", error: `create ${createRes.status}: ${text.slice(0, 500)}` });
    return new Response(
      JSON.stringify({ ok: false, step: "create", status: createRes.status, body: text }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  const created: { data?: { id: string } } = await createRes.json();
  const campaignId = created.data?.id;
  if (!campaignId) {
    await setSendRecord({ ...baseRecord, status: "failed", error: "MailerLite returned no campaign id" });
    return new Response(
      JSON.stringify({ ok: false, error: "MailerLite returned no campaign id", body: created }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  // Step 4: schedule the campaign for instant send.
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
    await setSendRecord({
      ...baseRecord,
      campaign_id: campaignId,
      status: "failed",
      error: `schedule ${sendRes.status}: ${text.slice(0, 500)}`,
    });
    return new Response(
      JSON.stringify({ ok: false, step: "schedule", campaign_id: campaignId, status: sendRes.status, body: text }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  // Step 5: log the success.
  await setSendRecord({ ...baseRecord, campaign_id: campaignId, status: "sent" });

  console.log(
    `[daily-email] sent campaign ${campaignId} for ${iso} (${content.type}: ${titleOf(content)})`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      campaign_id: campaignId,
      date: iso,
      type: content.type,
      title: titleOf(content),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};

// Daily at 06:00 UTC = 7am BST (summer) / 6am GMT (winter).
export const config: Config = {
  schedule: "0 6 * * *",
};
