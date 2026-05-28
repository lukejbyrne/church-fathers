// Daily Patristic newsletter — Netlify scheduled function.
//
// Stack: Resend email API. Triggered daily at 06:00 UTC.
//   1. Idempotency check via Netlify Blobs send-log — skip if already sent today.
//   2. Pick today's Content via lib/picker.ts (override → feast → anniversary → era → quote).
//   3. Render via the shared template at lib/email-template.ts.
//   4. Send one Resend email per subscriber with a signed unsubscribe link.
//   5. Write a SendRecord to Netlify Blobs.
//
// REQUIRED ENV (Netlify → Site settings → Environment variables):
//   RESEND_API_KEY           Resend API token with send-email permission
//   NEWSLETTER_FROM_EMAIL    Verified sender, e.g. newsletter@patristic.io
//   NEWSLETTER_FROM_NAME     Display name, e.g. "Patristic Lineage"
//   NEWSLETTER_REPLY_TO_EMAIL (Optional) reply-to override
//   NEWSLETTER_BASE_URL      (Optional) override for site URL — defaults to https://patristic.io
//   UNSUBSCRIBE_SECRET       (Optional) HMAC secret; falls back to ADMIN_TOKEN

import type { Config } from "@netlify/functions";
import { Resend } from "resend";
import { renderEmail } from "../../lib/email-template";
import { pickContent, isoDate } from "../../lib/picker";
import { buildExtras } from "../../lib/email-helpers";
import { getSendRecord, setSendRecord, type SendRecord } from "../../lib/send-log";
import { listSubscribers } from "../../lib/subscribers";
import { unsubscribeUrlFor } from "../../lib/unsubscribe";
import type { Content } from "../../lib/picker";

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

function sender(fromName: string, fromEmail: string): string {
  const cleanName = fromName.replace(/[<>"]/g, "").trim() || "Patristic Lineage";
  return `${cleanName} <${fromEmail.trim()}>`;
}

function previewText(plain: string): string {
  return plain
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1, 4)
    .join(" ")
    .slice(0, 180);
}

export default async (req: Request) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL;
  const fromName = process.env.NEWSLETTER_FROM_NAME ?? "Patristic Lineage";
  const replyTo = process.env.NEWSLETTER_REPLY_TO_EMAIL;
  const siteUrl = process.env.NEWSLETTER_BASE_URL ?? "https://patristic.io";
  const url = new URL(req.url);
  const only = url.searchParams.get("only")?.trim().toLowerCase() || null;
  const dryRun = url.searchParams.get("dry_run") === "1";
  const isTestRun = dryRun || !!only;

  if (!resendApiKey || !fromEmail) {
    console.error("[daily-email] missing env: RESEND_API_KEY / NEWSLETTER_FROM_EMAIL");
    return new Response(JSON.stringify({ ok: false, error: "Newsletter env not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const date = new Date();
  const iso = isoDate(date);

  // Step 1: idempotency check.
  const prior = await getSendRecord(iso);
  if (!isTestRun && prior?.status === "sent") {
    console.log(`[daily-email] already sent ${iso} (${prior.campaign_id}) — skipping.`);
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "already sent", date: iso, campaign_id: prior.campaign_id }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // Step 2: pick today's content.
  const content = pickContent(date);
  const extras = buildExtras(content, siteUrl);
  const previewRender = renderEmail(content, siteUrl, extras);
  const resend = new Resend(resendApiKey);
  const allSubscribers = await listSubscribers();
  const subscribers = only ? allSubscribers.filter((s) => s.email === only) : allSubscribers;

  const baseRecord: Omit<SendRecord, "status"> = {
    date: iso,
    type: content.type,
    title: titleOf(content),
    primary_id: primaryIdOf(content),
    attempted_at: new Date().toISOString(),
    override: content.type === "father" && content.reason === "override",
    reason: reasonOf(content),
  };

  if (subscribers.length === 0) {
    const message = only ? `No subscriber matches ${only}` : "No subscribers to email";
    console.log(`[daily-email] ${message}`);
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: message, date: iso, type: content.type, title: titleOf(content) }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  if (dryRun) {
    return new Response(
      JSON.stringify({
        ok: true,
        dry_run: true,
        date: iso,
        type: content.type,
        title: titleOf(content),
        subject: previewRender.subject,
        recipients: subscribers.length,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  const sentIds: string[] = [];
  const failures: string[] = [];

  for (const subscriber of subscribers) {
    const unsubscribeUrl = unsubscribeUrlFor(subscriber.email, siteUrl);
    const { subject, html, plain } = renderEmail(content, siteUrl, extras, unsubscribeUrl);
    const result = await resend.emails.send({
      from: sender(fromName, fromEmail),
      to: subscriber.email,
      subject,
      html,
      text: plain,
      replyTo,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "site", value: "patristic" },
        { name: "date", value: iso },
        { name: "type", value: content.type },
      ],
    });

    if (result.error) {
      const error = `${subscriber.email}: ${result.error.name} ${result.error.statusCode ?? ""} ${result.error.message}`;
      failures.push(error);
      console.error("[daily-email] Resend send failed:", error);
    } else {
      sentIds.push(result.data.id);
    }
  }

  if (failures.length > 0) {
    const error = `${failures.length}/${subscribers.length} sends failed: ${failures.slice(0, 3).join(" | ")}`;
    if (!isTestRun) {
      await setSendRecord({
        ...baseRecord,
        campaign_id: sentIds[0],
        provider: "resend",
        recipient_count: sentIds.length,
        message_ids: sentIds,
        status: "failed",
        error: error.slice(0, 500),
      });
    }
    return new Response(
      JSON.stringify({ ok: false, provider: "resend", date: iso, sent: sentIds.length, failed: failures.length, error }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  // Step 5: log the success.
  if (!isTestRun) {
    await setSendRecord({
      ...baseRecord,
      campaign_id: sentIds[0],
      provider: "resend",
      recipient_count: sentIds.length,
      message_ids: sentIds,
      status: "sent",
    });
  }

  console.log(
    `[daily-email] sent ${sentIds.length} Resend email(s) for ${iso} (${content.type}: ${titleOf(content)})`
  );

  return new Response(
    JSON.stringify({
      ok: true,
      provider: "resend",
      campaign_id: sentIds[0],
      date: iso,
      type: content.type,
      title: titleOf(content),
      recipients: sentIds.length,
      preview_text: previewText(previewRender.plain),
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
};

// Daily at 06:00 UTC = 7am BST (summer) / 6am GMT (winter).
export const config: Config = {
  schedule: "0 6 * * *",
};
