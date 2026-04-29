// Shared HTML email template for the daily Father of the Day newsletter.
// Used by both:
//   - netlify/functions/daily-email.ts (the actual scheduled send)
//   - app/email-preview/page.tsx        (in-browser preview for review)
//
// Edit the visual here and both stay in sync.

export type EmailChainStep = {
  id: string;
  name: string;
  born?: number | null;
  died?: number | null;
  image_url?: string | null;
  role?: string[];
  edge_type?: string | null;
  edge_strength?: string | null;
};

const REGION_LABEL: Record<string, string> = {
  palestine: "Palestine",
  syria: "Syria",
  "asia-minor": "Asia Minor",
  egypt: "Egypt",
  west: "Roman West",
  gaul: "Gaul",
  africa: "North Africa",
  east: "Eastern empire",
  other: "Other",
};

export type EmailFigure = {
  date: string;
  person: {
    id: string;
    name: string;
    url: string;
    image_url?: string;
    born?: number | null;
    died?: number | null;
    birth_place?: string | null;
    see?: string | null;
    region?: string;
    short_bio: string;
    why_matters?: string;
    primary_citation?: string;
    first_work?: { title: string; description?: string | null } | null;
  };
  chain?: EmailChainStep[];
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatLifeRange(born?: number | null, died?: number | null): string {
  const b = born != null ? String(born) : "?";
  const d = died != null ? String(died) : "?";
  return `${b}–${d}`;
}

function shortName(name: string): string {
  // "Polycarp of Smyrna" → "Polycarp"; "Pope Leo I" stays as-is.
  return name.split(" of ")[0];
}

function renderQuickFacts(p: EmailFigure["person"]): string {
  const rows: Array<[string, string]> = [];
  if (p.born != null || p.died != null) rows.push(["Lifespan", formatLifeRange(p.born, p.died)]);
  if (p.birth_place) rows.push(["Born in", p.birth_place]);
  if (p.see) rows.push(["See", p.see]);
  if (p.region) rows.push(["Region", p.region.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())]);

  if (rows.length === 0) return "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#1f1a1308;border:1px solid #1f1a1318;border-radius:6px;">
    ${rows
      .map(
        ([k, v], i) => `<tr>
        <td style="padding:8px 16px;${i < rows.length - 1 ? "border-bottom:1px solid #1f1a1310;" : ""}width:35%;font-size:12px;color:#1f1a13aa;letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(k)}</td>
        <td style="padding:8px 16px;${i < rows.length - 1 ? "border-bottom:1px solid #1f1a1310;" : ""}font-size:14px;color:#1f1a13e0;">${escapeHtml(v)}</td>
      </tr>`
      )
      .join("")}
  </table>`;
}

function renderChain(chain: EmailChainStep[] | undefined, siteUrl: string, targetId: string): string {
  if (!chain || chain.length <= 1) return "";

  // The API returns chain anchor-first (Jesus → ... → target).
  // For the email we render TARGET AT TOP descending to Jesus, so the reader's
  // figure leads, then traces backwards. Reverse the array and each step's
  // edge label still describes the relationship to the PREVIOUS person in the
  // walking order, which now means the person beneath them.
  const targetFirst = chain.slice().reverse();

  const items = targetFirst
    .map((step, i) => {
      const isTarget = step.id === targetId; // i === 0
      const isJesus = step.id === "jesus-of-nazareth"; // typically last
      const dates = formatLifeRange(step.born, step.died);
      const url = `${siteUrl}/fathers/${step.id}`;

      // Visual styling for the medallion
      const ringColor = isTarget
        ? "#8b1e2d"
        : step.role?.includes("apostle")
          ? "#8b1e2d"
          : step.role?.includes("bishop")
            ? "#d4a017"
            : "#1f1a1340";

      const portrait = step.image_url
        ? `<img src="${escapeHtml(step.image_url)}" alt="${escapeHtml(step.name)}" width="56" height="56" style="display:block;border-radius:50%;object-fit:cover;object-position:center 18%;border:2px solid ${ringColor};background:#1f1a1310;" />`
        : `<div style="width:56px;height:56px;border-radius:50%;background:${isJesus ? "#1f1a13" : isTarget ? "#8b1e2d" : "#1f1a1310"};color:${isJesus || isTarget ? "#fffaf0" : "#1f1a1380"};line-height:56px;text-align:center;font-family:Georgia,serif;font-size:22px;border:2px solid ${ringColor};">${escapeHtml(step.name.charAt(0))}</div>`;

      // Edge label below this medallion (between this person and the next-down,
      // who in walking order is "the previous step"). Show only if there's a step
      // beneath us.
      const hasNext = i < targetFirst.length - 1;
      const nextStep = hasNext ? targetFirst[i + 1] : null;
      const edgeColor =
        step.edge_strength === "documented" ? "#1f1a1380" : step.edge_strength === "tradition" ? "#1f1a1350" : "#8b1e2d80";
      const edgeStyle = step.edge_strength === "tradition" ? "italic" : "normal";

      // The edge stored on `step` describes step→previousInOriginalOrder.
      // After reversal: step.edge describes step→nextInTargetFirstOrder (the one beneath).
      // But this isn't how chainTo works. Original: chain[i].edge describes chain[i] ↔ chain[i-1].
      // After reverse: targetFirst[i].edge originally was chain[len-1-i].edge which described
      // chain[len-1-i] ↔ chain[len-2-i] = targetFirst[i+1]. So step.edge IS the relationship
      // to the medallion beneath us in targetFirst order. Render it accordingly when there's
      // a next step.

      const edgeText = hasNext && step.edge_type
        ? `<span style="display:inline-block;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${edgeColor};font-style:${edgeStyle};">
             ${escapeHtml(step.edge_type.replace(/_/g, " "))}${step.edge_strength && step.edge_strength !== "documented" ? ` <span style="opacity:0.6;">· ${escapeHtml(step.edge_strength)}</span>` : ""}
           </span>`
        : "";

      const connector = hasNext
        ? `<tr><td style="padding:0;text-align:center;">
             ${edgeText ? `<div style="margin:6px 0 4px;">${edgeText}</div>` : `<div style="height:6px;"></div>`}
             <div style="display:inline-block;width:2px;height:18px;background:#1f1a1330;border-radius:1px;"></div>
           </td></tr>`
        : "";

      return `<tr><td style="padding:6px 0;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">${portrait}</td>
              <td style="vertical-align:middle;text-align:left;">
                <a href="${escapeHtml(url)}" style="text-decoration:none;color:#1f1a13;display:block;line-height:1.2;">
                  <span style="font-family:Georgia,serif;font-size:${isTarget ? "16px" : "14px"};${isTarget ? "font-weight:bold;" : ""}color:#1f1a13;display:block;">${escapeHtml(step.name)}</span>
                  <span style="font-size:11px;color:#1f1a1380;display:block;margin-top:2px;">${escapeHtml(dates)}</span>
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        ${connector}`;
    })
    .join("");

  return `<div style="margin:32px 0 24px;padding:20px 16px;background:#1f1a1304;border:1px solid #1f1a1318;border-radius:6px;">
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;color:#1f1a13;text-align:center;font-weight:normal;">
      Chain to Jesus
    </h2>
    <p style="margin:0 0 18px;text-align:center;font-size:12px;color:#1f1a1380;font-style:italic;">
      ${targetFirst.length - 1} step${targetFirst.length === 2 ? "" : "s"} through documented and traditional links · top to bottom: ${escapeHtml(targetFirst[0].name.split(" of ")[0])} → Jesus
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${items}
    </table>
  </div>`;
}

function renderLocationCard(p: EmailFigure["person"], siteUrl: string): string {
  const place = p.birth_place || p.see;
  if (!place) return "";
  const regionLabel = p.region ? REGION_LABEL[p.region] ?? p.region : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td style="padding:14px 16px;background:#1f1a1308;border:1px solid #1f1a1318;border-radius:6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40" style="vertical-align:top;padding-right:12px;">
              <div style="width:36px;height:36px;border-radius:50%;background:#8b1e2d;color:#fffaf0;line-height:36px;text-align:center;font-size:18px;">📍</div>
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:2px;">From</div>
              <div style="font-family:Georgia,serif;font-size:17px;color:#1f1a13;">${escapeHtml(place)}${regionLabel ? `<span style="font-size:13px;color:#1f1a1380;font-style:italic;"> · ${escapeHtml(regionLabel)}</span>` : ""}</div>
              <div style="margin-top:6px;">
                <a href="${escapeHtml(siteUrl)}/map" style="font-size:12px;color:#8b1e2d;text-decoration:none;border-bottom:1px solid #8b1e2d44;">See on the map →</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderCitation(citation?: string): string {
  if (!citation) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-left:3px solid #8b1e2d66;padding:6px 16px;background:#8b1e2d08;">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8b1e2dcc;margin-bottom:4px;">Primary source</div>
        <div style="font-style:italic;font-family:Georgia,serif;font-size:14px;color:#1f1a13c0;">${escapeHtml(citation)}</div>
      </td>
    </tr>
  </table>`;
}

function renderFirstWork(work?: { title: string; description?: string | null } | null, personUrl?: string): string {
  if (!work) return "";
  return `<div style="margin:24px 0;padding:16px;background:#fffaf0;border:1px dashed #1f1a1325;border-radius:6px;">
    <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:6px;">If you'd read one thing</div>
    <div style="font-family:Georgia,serif;font-size:17px;color:#1f1a13;margin-bottom:4px;">${escapeHtml(work.title)}</div>
    ${work.description ? `<div style="font-size:13px;color:#1f1a13b0;line-height:1.5;">${escapeHtml(work.description)}</div>` : ""}
    ${personUrl ? `<div style="margin-top:8px;font-size:12px;"><a href="${escapeHtml(personUrl)}" style="color:#8b1e2d;text-decoration:none;border-bottom:1px solid #8b1e2d44;">All editions →</a></div>` : ""}
  </div>`;
}

export function renderEmail(
  figure: EmailFigure,
  siteUrl = "https://patristic.io"
): { subject: string; html: string; plain: string } {
  const p = figure.person;
  const subject = `${p.name} — Father of the Day`;
  const body = p.why_matters || p.short_bio;

  // Split paragraphs, but if it's one big block, also split on sentence boundaries
  // every 2-3 sentences to avoid a single wall of text.
  const paragraphs = (() => {
    const fromBlanks = body.split(/\n\n+/).filter((s) => s.trim());
    if (fromBlanks.length > 1) return fromBlanks;
    // Single paragraph — chunk by 2 sentences to give the eye a break.
    const sentences = body.split(/(?<=[.!?])\s+(?=[A-Z])/);
    if (sentences.length <= 2) return [body];
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      chunks.push(sentences.slice(i, i + 2).join(" "));
    }
    return chunks;
  })();

  const paragraphHtml = paragraphs
    .map(
      (para) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1f1a13e0;">${escapeHtml(para)}</p>`
    )
    .join("");

  const img = p.image_url
    ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" width="120" height="120" style="border-radius:50%;object-fit:cover;object-position:center 18%;border:1px solid #1f1a1322;display:block;margin:0 auto 18px;" />`
    : `<div style="width:120px;height:120px;border-radius:50%;background:#1f1a1310;border:1px solid #1f1a1322;margin:0 auto 18px;font-family:Georgia,serif;font-size:36px;color:#1f1a1340;line-height:120px;text-align:center;">${escapeHtml(p.name.charAt(0))}</div>`;

  const dateLine = `${p.born ?? "?"}–${p.died ?? "?"}${p.see ? ` · Bishop of ${escapeHtml(p.see)}` : ""}`;

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

          <!-- Header -->
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
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#1f1a1318;margin:18px 0 24px;"></div></td></tr>

          <!-- Hero: portrait + name + lifespan line -->
          <tr>
            <td style="padding:0 32px 0;">
              ${img}
              <h1 style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;color:#1f1a13;text-align:center;line-height:1.15;">
                ${escapeHtml(p.name)}
              </h1>
              <p style="margin:0 0 24px;text-align:center;font-size:13px;color:#1f1a13aa;">
                ${dateLine}
              </p>
            </td>
          </tr>

          <!-- Location card -->
          <tr>
            <td style="padding:0 32px;">
              ${renderLocationCard(p, siteUrl)}
            </td>
          </tr>

          <!-- Quick facts table -->
          <tr>
            <td style="padding:0 32px;">
              ${renderQuickFacts(p)}
            </td>
          </tr>

          <!-- Why X matters — heading + paragraphs -->
          <tr>
            <td style="padding:0 32px;">
              <h2 style="margin:8px 0 12px;font-family:Georgia,serif;font-size:20px;font-weight:normal;color:#1f1a13;border-bottom:1px solid #1f1a1318;padding-bottom:8px;">
                Why ${escapeHtml(shortName(p.name))} matters
              </h2>
              ${paragraphHtml}
            </td>
          </tr>

          <!-- Primary citation -->
          <tr>
            <td style="padding:0 32px;">
              ${renderCitation(p.primary_citation)}
            </td>
          </tr>

          <!-- First work to read -->
          <tr>
            <td style="padding:0 32px;">
              ${renderFirstWork(p.first_work, p.url)}
            </td>
          </tr>

          <!-- Chain to Jesus visual -->
          <tr>
            <td style="padding:0 32px;">
              ${renderChain(figure.chain, siteUrl, p.id)}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 32px 24px;text-align:center;">
              <a href="${escapeHtml(p.url)}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;letter-spacing:0.02em;">
                Open ${escapeHtml(shortName(p.name))}'s page →
              </a>
            </td>
          </tr>

          <!-- Footer -->
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

  // Plain-text version
  const chainText =
    figure.chain && figure.chain.length > 1
      ? `\nCHAIN TO JESUS\n${figure.chain
          .map(
            (s, i) =>
              `${i > 0 && s.edge_type ? `  | (${s.edge_type.replace(/_/g, " ")}${s.edge_strength && s.edge_strength !== "documented" ? `, ${s.edge_strength}` : ""})\n` : ""}${"  ".repeat(0)}${s.name} (${formatLifeRange(s.born, s.died)})`
          )
          .join("\n")}\n`
      : "";

  const plain = `${p.name} — Father of the Day
${dateLine}

${p.birth_place ? `Born in: ${p.birth_place}\n` : ""}${p.see ? `See: ${p.see}\n` : ""}${p.region ? `Region: ${p.region}\n` : ""}
WHY ${shortName(p.name).toUpperCase()} MATTERS

${body}

${p.primary_citation ? `Primary source: ${p.primary_citation}\n\n` : ""}${p.first_work ? `If you'd read one thing: ${p.first_work.title}\n${p.first_work.description ?? ""}\n\n` : ""}${chainText}
Open ${shortName(p.name)}'s page: ${p.url}

—
Patristic Lineage · ${siteUrl}
You're getting this because you signed up at ${siteUrl}/today.
Unsubscribe: {$unsubscribe}`;

  return { subject, html, plain };
}
