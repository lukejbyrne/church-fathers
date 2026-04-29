// Shared HTML email template for the daily Father of the Day newsletter.
// Used by both:
//   - netlify/functions/daily-email.ts (the actual scheduled send)
//   - app/email-preview/page.tsx        (in-browser preview for review)
//
// Edit the visual here and both stay in sync.

export type EmailFigure = {
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
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  // "2026-04-29" → "29 April 2026"
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function renderEmail(
  figure: EmailFigure,
  siteUrl = "https://patristic.io"
): { subject: string; html: string; plain: string } {
  const p = figure.person;
  const dateLine = `${p.born ?? "?"}–${p.died ?? "?"}`;
  const subject = `${p.name} — Father of the Day`;
  const body = p.why_matters || p.short_bio;
  const cite = p.primary_citation
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-left:3px solid #8b1e2d44;padding:4px 16px;color:#1f1a1380;font-style:italic;font-family:Georgia,serif;font-size:14px;">
           Source: ${escapeHtml(p.primary_citation)}
         </td></tr>
       </table>`
    : "";
  const img = p.image_url
    ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" width="120" height="120" style="border-radius:50%;object-fit:cover;object-position:center 18%;border:1px solid #1f1a1322;display:block;margin:0 auto 20px;" />`
    : `<div style="width:120px;height:120px;border-radius:50%;background:#1f1a1310;border:1px solid #1f1a1322;margin:0 auto 20px;font-family:Georgia,serif;font-size:36px;color:#1f1a1340;line-height:120px;text-align:center;">${escapeHtml(p.name.charAt(0))}</div>`;

  const paragraphs = body
    .split(/\n\n+/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#1f1a13e0;">${escapeHtml(para)}</p>`
    )
    .join("");

  // Inline-styled HTML — every email client renders inline CSS reliably.
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5efe0;font-family:Georgia,'Times New Roman',serif;color:#1f1a13;line-height:1.55;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">
    ${escapeHtml(p.short_bio.slice(0, 140))}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe0;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffaf0;border:1px solid #1f1a1320;border-radius:6px;">
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;color:#1f1a13;">
                <span style="font-family:Georgia,serif;font-size:18px;letter-spacing:0.04em;">Patristic Lineage</span>
              </a>
              <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#1f1a1380;">
                Father of the Day · ${escapeHtml(formatDate(figure.date))}
              </p>
            </td>
          </tr>
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#1f1a1318;margin:18px 0 28px;"></div></td></tr>
          <tr>
            <td style="padding:0 32px 8px;">
              ${img}
              <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;color:#1f1a13;text-align:center;line-height:1.15;">
                ${escapeHtml(p.name)}
              </h1>
              <p style="margin:0 0 28px;text-align:center;font-size:13px;color:#1f1a13aa;">
                ${escapeHtml(dateLine)}${p.see ? ` · Bishop of ${escapeHtml(p.see)}` : ""}
              </p>
              <div>
                ${paragraphs}
              </div>
              ${cite}
              <div style="text-align:center;margin:32px 0 8px;">
                <a href="${escapeHtml(p.url)}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;letter-spacing:0.02em;">
                  Read the full chain to Jesus →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #1f1a1318;background:#1f1a1306;">
              <p style="margin:0 0 8px;font-size:12px;color:#1f1a13a0;line-height:1.6;">
                One of 206 figures we track from Jesus to John of Damascus, AD 30–750.
                Tomorrow: another. Browse the full lineage at
                <a href="${escapeHtml(siteUrl)}" style="color:#8b1e2d;text-decoration:none;border-bottom:1px solid #8b1e2d44;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>.
              </p>
              <p style="margin:0;font-size:11px;color:#1f1a1370;">
                You're getting this because you signed up at ${escapeHtml(siteUrl)}/today.
                <a href="{$unsubscribe}" style="color:#1f1a1370;text-decoration:underline;">Unsubscribe</a>
                — your call, no hard feelings.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:10px;color:#1f1a1360;font-family:Georgia,serif;">
          Patristic Lineage · A sourced visualization of the Church Fathers
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text version for email clients that prefer it.
  const plain = `${p.name} — Father of the Day

${dateLine}${p.see ? ` · Bishop of ${p.see}` : ""}

${body}

${p.primary_citation ? `Source: ${p.primary_citation}\n\n` : ""}Read the full chain to Jesus: ${p.url}

—
Patristic Lineage · ${siteUrl}
You're getting this because you signed up at ${siteUrl}/today.
Unsubscribe: {$unsubscribe}`;

  return { subject, html, plain };
}
