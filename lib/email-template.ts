// Shared HTML email template for the daily Patristic newsletter.
// Used by both:
//   - netlify/functions/daily-email.ts (the actual scheduled send)
//   - scripts/preview-email.ts          (local preview)
//
// One shell, six body variants — one per Content type from lib/picker.ts.

import type { Content } from "./picker";
import type { Person } from "./schema";

export type EmailChainStep = {
  id: string;
  name: string;
  born?: number | null;
  died?: number | null;
  image_url?: string | null;
  role?: string[];
  short_bio?: string;
  see?: string | null;
  edge_type?: string | null;
  edge_strength?: string | null;
};

export type FatherExtras = {
  url: string;
  primary_citation?: string;
  first_work?: { title: string; description?: string | null; amazon_url?: string | null } | null;
  chain?: EmailChainStep[];
};

export type RelatedFigure = {
  id: string;
  name: string;
  url: string;
  image_url?: string | null;
  born?: number | null;
  died?: number | null;
  short_bio?: string;
};

export type EmailExtras = {
  // For father / heretic / quote slots: optional enrichment for the chosen person.
  father?: FatherExtras;
  // For council / schism / heretic / era: related figures with portraits.
  related?: RelatedFigure[];
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

const ERA_LABEL: Record<string, string> = {
  apostle: "Apostles",
  "apostolic-father": "Apostolic Fathers",
  apologist: "Apologists",
  "ante-nicene": "Ante-Nicene",
  nicene: "Nicene",
  "post-nicene": "Post-Nicene",
  "desert-father": "Desert Fathers",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstSentence(text: string | undefined, max = 160): string {
  if (!text) return "";
  const m = text.match(/^(.+?[.!?])(\s|$)/);
  let out = m ? m[1] : text;
  if (out.length > max) out = out.slice(0, max - 1).trimEnd() + "…";
  return out;
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

function formatMonthDay(mmdd: string | undefined | null): string | null {
  if (!mmdd) return null;
  const m = /^(\d{2})-(\d{2})$/.exec(mmdd);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

function formatLifeRange(born?: number | null, died?: number | null): string {
  const b = born != null ? String(born) : "?";
  const d = died != null ? String(died) : "?";
  return `${b}–${d}`;
}

function shortName(name: string): string {
  return name.split(" of ")[0];
}

function feastLine(p: Person): string {
  const cat = formatMonthDay(p.feast_day_catholic);
  const orth = formatMonthDay(p.feast_day_orthodox);
  if (!cat && !orth) return "";
  let body: string;
  if (cat && orth && cat === orth) body = `Feast: ${cat}`;
  else if (cat && orth) body = `Feast: ${cat} (Catholic) · ${orth} (Orthodox)`;
  else if (cat) body = `Feast: ${cat} (Catholic)`;
  else body = `Feast: ${orth} (Orthodox)`;
  return `<p style="margin:0 0 18px;text-align:center;font-size:12px;color:#8b1e2dcc;letter-spacing:0.04em;">${escapeHtml(body)}</p>`;
}

function renderQuickFacts(p: Person): string {
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
  const ordered = chain;
  const items = ordered
    .map((step, i) => {
      const isJesus = step.id === "jesus-of-nazareth";
      const isTarget = step.id === targetId;
      const stepNum = i + 1;
      const dates = formatLifeRange(step.born, step.died);
      const url = `${siteUrl}/fathers/${step.id}`;
      const isApostle = step.role?.includes("apostle");
      const isBishop = step.role?.includes("bishop");
      const ringColor = isTarget
        ? "#8b1e2d"
        : isApostle || isJesus
          ? "#8b1e2d"
          : isBishop
            ? "#d4a017"
            : "#1f1a1340";
      const numberBadge = `<div style="width:28px;height:28px;border-radius:50%;background:${isJesus ? "#1f1a13" : isTarget ? "#8b1e2d" : isApostle ? "#8b1e2d" : "#fffaf0"};color:${isJesus || isTarget || isApostle ? "#fffaf0" : "#1f1a13"};border:2px solid ${isJesus ? "#1f1a13" : ringColor};line-height:24px;text-align:center;font-family:Georgia,serif;font-size:13px;font-weight:normal;">${stepNum}</div>`;
      const portrait = step.image_url
        ? `<img src="${escapeHtml(step.image_url)}" alt="${escapeHtml(step.name)}" width="64" height="64" style="display:block;border-radius:50%;object-fit:cover;object-position:center 18%;border:2px solid ${ringColor};background:#1f1a1310;" />`
        : `<div style="width:64px;height:64px;border-radius:50%;background:${isJesus ? "#1f1a13" : isTarget ? "#8b1e2d" : "#1f1a1310"};color:${isJesus || isTarget ? "#fffaf0" : "#1f1a1380"};line-height:64px;text-align:center;font-family:Georgia,serif;font-size:24px;border:2px solid ${ringColor};">${escapeHtml(step.name.charAt(0))}</div>`;
      const subtitle = isJesus
        ? "The source"
        : isTarget
          ? "Today's Father"
          : step.see
            ? `Bishop of ${step.see}`
            : isApostle
              ? "Apostle"
              : isBishop
                ? "Bishop"
                : "";
      const bio = firstSentence(step.short_bio, 180);
      const hasPrev = i > 0;
      const edgeColor =
        step.edge_strength === "documented" ? "#1f1a13" : step.edge_strength === "tradition" ? "#1f1a1370" : "#8b1e2d";
      const edgeStyle = step.edge_strength === "tradition" ? "italic" : "normal";
      const edgeStrokeStyle = step.edge_strength === "tradition" ? "dashed" : "solid";
      const edgeBlockAbove = hasPrev && step.edge_type
        ? `<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="64" style="vertical-align:top;text-align:center;padding:0;"><div style="display:inline-block;width:0;border-left:2px ${edgeStrokeStyle} #1f1a1330;height:30px;"></div></td><td style="padding:6px 0 6px 16px;vertical-align:middle;"><span style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${edgeColor};font-style:${edgeStyle};">${escapeHtml(step.edge_type.replace(/_/g, " "))}${step.edge_strength && step.edge_strength !== "documented" ? ` <span style="opacity:0.6;">· ${escapeHtml(step.edge_strength)}</span>` : ""}</span></td></tr></table></td></tr>`
        : "";
      return `${edgeBlockAbove}<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="64" style="vertical-align:top;text-align:center;padding:4px 0 0;"><div style="margin:0 auto 4px;">${numberBadge}</div><div style="margin:0 auto;">${portrait}</div></td><td style="padding:6px 0 6px 16px;vertical-align:top;"><a href="${escapeHtml(url)}" style="text-decoration:none;color:#1f1a13;display:block;"><div style="font-family:Georgia,serif;font-size:${isTarget ? "20px" : "17px"};${isTarget ? "font-weight:bold;" : ""}color:#1f1a13;line-height:1.2;">${escapeHtml(step.name)}</div><div style="font-size:12px;color:#1f1a1390;margin-top:3px;">${escapeHtml(dates)}${subtitle ? ` <span style="color:#1f1a1370;">· ${escapeHtml(subtitle)}</span>` : ""}</div></a>${bio ? `<div style="font-size:13px;color:#1f1a13b0;margin-top:6px;line-height:1.5;font-family:Georgia,serif;">${escapeHtml(bio)}</div>` : ""}</td></tr></table></td></tr>`;
    })
    .join("");
  const yearSpan = (() => {
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const start = first.born ?? first.died ?? 0;
    const end = last.died ?? last.born ?? 0;
    return Math.max(0, end - start);
  })();
  const target = ordered[ordered.length - 1];
  const targetUrl = `${siteUrl}/fathers/${target.id}`;
  const targetShort = shortName(target.name);
  return `<div style="margin:32px 0 24px;padding:20px 18px;background:#1f1a1304;border:1px solid #1f1a1318;border-radius:6px;">
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:20px;color:#1f1a13;font-weight:normal;">From Jesus to ${escapeHtml(targetShort)}</h2>
    <p style="margin:0 0 22px;font-size:12px;color:#1f1a1380;font-style:italic;">${ordered.length} ${ordered.length === 1 ? "person" : "people"}${yearSpan > 0 ? `, about ${yearSpan} years` : ""}. Each link rests on a primary or traditional source.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
    <div style="margin-top:18px;padding-top:14px;border-top:1px solid #1f1a1318;text-align:center;"><a href="${escapeHtml(targetUrl)}" style="font-size:13px;color:#8b1e2d;text-decoration:none;border-bottom:1px solid #8b1e2d44;">Learn more about ${escapeHtml(targetShort)} →</a></div>
  </div>`;
}

function renderCitation(citation?: string, label = "Primary source"): string {
  if (!citation) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-left:3px solid #8b1e2d66;padding:6px 16px;background:#8b1e2d08;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8b1e2dcc;margin-bottom:4px;">${escapeHtml(label)}</div><div style="font-style:italic;font-family:Georgia,serif;font-size:14px;color:#1f1a13c0;">${escapeHtml(citation)}</div></td></tr></table>`;
}

function renderFirstWork(
  work?: { title: string; description?: string | null; amazon_url?: string | null } | null,
  personUrl?: string
): string {
  if (!work) return "";
  const links: string[] = [];
  if (work.amazon_url) {
    links.push(
      `<a href="${escapeHtml(work.amazon_url)}" style="display:inline-block;padding:7px 14px;background:#8b1e2d;color:#fffaf0;text-decoration:none;border-radius:4px;font-size:13px;font-family:Georgia,serif;margin-right:8px;">Buy on Amazon →</a>`
    );
  }
  if (personUrl) {
    links.push(
      `<a href="${escapeHtml(personUrl)}#works" style="display:inline-block;padding:7px 14px;border:1px solid #1f1a1330;color:#1f1a13;text-decoration:none;border-radius:4px;font-size:13px;font-family:Georgia,serif;">All editions →</a>`
    );
  }
  return `<div style="margin:24px 0;padding:16px;background:#fffaf0;border:1px dashed #1f1a1325;border-radius:6px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:6px;">If you'd read one thing</div><div style="font-family:Georgia,serif;font-size:17px;color:#1f1a13;margin-bottom:4px;">${escapeHtml(work.title)}</div>${work.description ? `<div style="font-size:13px;color:#1f1a13b0;line-height:1.5;margin-bottom:12px;">${escapeHtml(work.description)}</div>` : ""}${links.length ? `<div style="margin-top:12px;">${links.join("")}</div>` : ""}</div>`;
}

function paragraphsHtml(body: string): string {
  const paras = (() => {
    const fromBlanks = body.split(/\n\n+/).filter((s) => s.trim());
    if (fromBlanks.length > 1) return fromBlanks;
    const sentences = body.split(/(?<=[.!?])\s+(?=[A-Z])/);
    if (sentences.length <= 2) return [body];
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) chunks.push(sentences.slice(i, i + 2).join(" "));
    return chunks;
  })();
  return paras
    .map((para) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1f1a13e0;">${escapeHtml(para)}</p>`)
    .join("");
}

function portraitImg(src: string | null | undefined, alt: string, size = 120): string {
  return src
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${size}" height="${size}" style="border-radius:50%;object-fit:cover;object-position:center 18%;border:1px solid #1f1a1322;display:block;margin:0 auto 18px;" />`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#1f1a1310;border:1px solid #1f1a1322;margin:0 auto 18px;font-family:Georgia,serif;font-size:${Math.round(size / 3.3)}px;color:#1f1a1340;line-height:${size}px;text-align:center;">${escapeHtml(alt.charAt(0))}</div>`;
}

function relatedGrid(related: RelatedFigure[] | undefined): string {
  if (!related || related.length === 0) return "";
  const cells = related
    .slice(0, 4)
    .map((r) => {
      const dates = formatLifeRange(r.born, r.died);
      const img = r.image_url
        ? `<img src="${escapeHtml(r.image_url)}" alt="${escapeHtml(r.name)}" width="64" height="64" style="border-radius:50%;object-fit:cover;object-position:center 18%;border:1px solid #1f1a1322;" />`
        : `<div style="width:64px;height:64px;border-radius:50%;background:#1f1a1310;line-height:64px;text-align:center;font-family:Georgia,serif;font-size:24px;color:#1f1a1380;">${escapeHtml(r.name.charAt(0))}</div>`;
      return `<td width="50%" valign="top" style="padding:8px;"><a href="${escapeHtml(r.url)}" style="text-decoration:none;color:#1f1a13;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="64" style="padding-right:12px;">${img}</td><td valign="top"><div style="font-family:Georgia,serif;font-size:15px;color:#1f1a13;">${escapeHtml(r.name)}</div><div style="font-size:11px;color:#1f1a1380;margin-top:2px;">${escapeHtml(dates)}</div></td></tr></table></a></td>`;
    })
    .join("");
  // Two-column grid in pairs
  const rows: string[] = [];
  const arr = related.slice(0, 4);
  for (let i = 0; i < arr.length; i += 2) {
    const pair = arr.slice(i, i + 2);
    rows.push(`<tr>${pair.map((r) => {
      const dates = formatLifeRange(r.born, r.died);
      const img = r.image_url
        ? `<img src="${escapeHtml(r.image_url)}" alt="${escapeHtml(r.name)}" width="64" height="64" style="border-radius:50%;object-fit:cover;object-position:center 18%;border:1px solid #1f1a1322;display:block;" />`
        : `<div style="width:64px;height:64px;border-radius:50%;background:#1f1a1310;line-height:64px;text-align:center;font-family:Georgia,serif;font-size:24px;color:#1f1a1380;">${escapeHtml(r.name.charAt(0))}</div>`;
      return `<td width="50%" valign="top" style="padding:8px;"><a href="${escapeHtml(r.url)}" style="text-decoration:none;color:#1f1a13;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="64" style="padding-right:12px;">${img}</td><td valign="top"><div style="font-family:Georgia,serif;font-size:15px;color:#1f1a13;line-height:1.2;">${escapeHtml(r.name)}</div><div style="font-size:11px;color:#1f1a1380;margin-top:3px;">${escapeHtml(dates)}</div></td></tr></table></a></td>`;
    }).join("")}${pair.length === 1 ? '<td width="50%"></td>' : ""}</tr>`);
  }
  void cells; // avoid unused warning if reformatted later
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:#1f1a1304;border:1px solid #1f1a1318;border-radius:6px;padding:8px;">${rows.join("")}</table>`;
}

// ── Body builders ──

function buildFatherBody(content: Extract<Content, { type: "father" }>, siteUrl: string, extras: EmailExtras): string {
  const p = content.person;
  const ex = extras.father;
  const personUrl = ex?.url ?? `${siteUrl}/fathers/${p.id}`;
  const body = p.why_matters ?? p.short_bio;
  const dateLine = `${p.born ?? "?"}–${p.died ?? "?"}${p.see ? ` · Bishop of ${escapeHtml(p.see)}` : ""}`;
  return `
    <tr><td style="padding:0 32px 0;">
      ${portraitImg(p.image_url, p.name, 120)}
      <h1 style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;color:#1f1a13;text-align:center;line-height:1.15;">${escapeHtml(p.name)}</h1>
      <p style="margin:0 0 4px;text-align:center;font-size:13px;color:#1f1a13aa;">${dateLine}</p>
      ${feastLine(p)}
    </td></tr>
    <tr><td style="padding:0 32px;">${renderQuickFacts(p)}</td></tr>
    <tr><td style="padding:0 32px;">
      <h2 style="margin:8px 0 12px;font-family:Georgia,serif;font-size:20px;font-weight:normal;color:#1f1a13;border-bottom:1px solid #1f1a1318;padding-bottom:8px;">Why ${escapeHtml(shortName(p.name))} matters</h2>
      ${paragraphsHtml(body)}
    </td></tr>
    <tr><td style="padding:0 32px;">${renderChain(ex?.chain, siteUrl, p.id)}</td></tr>
    <tr><td style="padding:0 32px;">${renderCitation(ex?.primary_citation)}</td></tr>
    <tr><td style="padding:0 32px;">${renderFirstWork(ex?.first_work, personUrl)}</td></tr>
    <tr><td style="padding:8px 32px 24px;text-align:center;">
      <a href="${escapeHtml(personUrl)}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;">Open ${escapeHtml(shortName(p.name))}'s page →</a>
    </td></tr>`;
}

function buildAnniversaryBody(
  kind: "council" | "schism" | "heretic",
  anniv: { title: string; year: number; blurb: string; citation?: string },
  related: RelatedFigure[] | undefined,
  siteUrl: string,
  heretic?: Person
): string {
  const accent = kind === "schism" ? "#5a3a3a" : kind === "heretic" ? "#3a3a5a" : "#8b1e2d";
  const eyebrow = kind === "schism" ? "Schism" : kind === "heretic" ? "Condemnation" : "Council";
  const heading = `Today in ${anniv.year}`;
  const heroImg = heretic ? portraitImg(heretic.image_url, heretic.name, 96) : "";
  return `
    <tr><td style="padding:0 32px 0;text-align:center;">
      ${heroImg}
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${accent}cc;">${eyebrow}</p>
      <h1 style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;color:#1f1a13;line-height:1.2;">${escapeHtml(anniv.title)}</h1>
      <p style="margin:0 0 18px;font-size:13px;color:#1f1a13aa;">${heading}</p>
    </td></tr>
    <tr><td style="padding:0 32px;">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1f1a13e0;">${escapeHtml(anniv.blurb)}</p>
    </td></tr>
    <tr><td style="padding:0 32px;">${relatedGrid(related)}</td></tr>
    <tr><td style="padding:0 32px;">${renderCitation(anniv.citation, "Source")}</td></tr>
    <tr><td style="padding:8px 32px 24px;text-align:center;">
      <a href="${escapeHtml(siteUrl)}/schisms" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;">Browse the full timeline →</a>
    </td></tr>`;
}

function buildEraBody(content: Extract<Content, { type: "era" }>, siteUrl: string): string {
  const eraSlug = content.era === "apostle" ? "apostolic" : content.era === "apostolic-father" ? "apostolic-fathers" : content.era;
  const label = ERA_LABEL[content.era] ?? content.era;
  const tiles = content.figures
    .map((p) => {
      const url = `${siteUrl}/fathers/${p.id}`;
      const img = p.image_url
        ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" width="72" height="72" style="border-radius:50%;object-fit:cover;object-position:center 18%;border:1px solid #1f1a1322;display:block;" />`
        : `<div style="width:72px;height:72px;border-radius:50%;background:#1f1a1310;line-height:72px;text-align:center;font-family:Georgia,serif;font-size:26px;color:#1f1a1380;">${escapeHtml(p.name.charAt(0))}</div>`;
      return `<td width="50%" valign="top" style="padding:8px;"><a href="${escapeHtml(url)}" style="text-decoration:none;color:#1f1a13;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="72" style="padding-right:12px;">${img}</td><td valign="top"><div style="font-family:Georgia,serif;font-size:16px;color:#1f1a13;line-height:1.2;">${escapeHtml(p.name)}</div><div style="font-size:11px;color:#1f1a1380;margin-top:3px;">${escapeHtml(formatLifeRange(p.born, p.died))}</div><div style="font-size:12px;color:#1f1a13b0;margin-top:6px;line-height:1.5;">${escapeHtml(firstSentence(p.short_bio, 110))}</div></td></tr></table></a></td>`;
    });
  const rows: string[] = [];
  for (let i = 0; i < tiles.length; i += 2) {
    rows.push(`<tr>${tiles.slice(i, i + 2).join("")}${tiles.length - i === 1 ? '<td width="50%"></td>' : ""}</tr>`);
  }
  return `
    <tr><td style="padding:0 32px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#8b1e2dcc;">This week</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;color:#1f1a13;">${escapeHtml(label)}</h1>
    </td></tr>
    <tr><td style="padding:0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#1f1a1304;border:1px solid #1f1a1318;border-radius:6px;padding:8px;">${rows.join("")}</table>
    </td></tr>
    <tr><td style="padding:8px 32px 24px;text-align:center;">
      <a href="${escapeHtml(siteUrl)}/eras/${eraSlug}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;">Open the ${escapeHtml(label)} page →</a>
    </td></tr>`;
}

function buildQuoteBody(content: Extract<Content, { type: "quote" }>, siteUrl: string): string {
  const personUrl = `${siteUrl}/fathers/${content.person.id}`;
  return `
    <tr><td style="padding:0 32px;text-align:center;">
      <p style="margin:0 0 18px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#8b1e2dcc;">From the Fathers</p>
      <blockquote style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:#1f1a13;font-style:italic;border-left:0;padding:0;">"${escapeHtml(content.quote.text)}"</blockquote>
      <p style="margin:0 0 4px;font-size:14px;color:#1f1a13;">— ${escapeHtml(content.person.name)}</p>
      <p style="margin:0 0 24px;font-size:12px;color:#1f1a1380;font-style:italic;">${escapeHtml(content.quote.source)}${content.quote.translation ? ` · ${escapeHtml(content.quote.translation)}` : ""}</p>
    </td></tr>
    <tr><td style="padding:0 32px;">${renderQuickFacts(content.person)}</td></tr>
    <tr><td style="padding:8px 32px 24px;text-align:center;">
      <a href="${escapeHtml(personUrl)}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;">Read more about ${escapeHtml(shortName(content.person.name))} →</a>
    </td></tr>`;
}

// ── Subject + plain-text helpers ──

function subjectFor(content: Content): string {
  switch (content.type) {
    case "father":
      return content.reason === "feast-catholic" || content.reason === "feast-orthodox"
        ? `${content.person.name} — feast day`
        : `${content.person.name} — Father of the Day`;
    case "council":
      return `Today in ${content.anniversary.year}: ${content.anniversary.title}`;
    case "schism":
      return `Today in ${content.anniversary.year}: ${content.anniversary.title}`;
    case "heretic":
      return content.anniversary
        ? `Today in ${content.anniversary.year}: ${content.anniversary.title}`
        : `${content.person.name} — the line drawn`;
    case "era":
      return `This week: the ${ERA_LABEL[content.era] ?? content.era}`;
    case "quote":
      return `From ${content.quote.source}`;
  }
}

function eyebrowLabel(content: Content): string {
  switch (content.type) {
    case "father":
      return content.reason === "feast-catholic" || content.reason === "feast-orthodox"
        ? "Feast Day"
        : "Father of the Day";
    case "council":
      return "Council Anniversary";
    case "schism":
      return "Schism Anniversary";
    case "heretic":
      return "Heresy Condemnation";
    case "era":
      return "Era Spotlight";
    case "quote":
      return "From the Fathers";
  }
}

function plainTextFor(content: Content, extras: EmailExtras, siteUrl: string): string {
  const subject = subjectFor(content);
  switch (content.type) {
    case "father": {
      const p = content.person;
      const ex = extras.father;
      const url = ex?.url ?? `${siteUrl}/fathers/${p.id}`;
      const body = p.why_matters ?? p.short_bio;
      const feast = (() => {
        const cat = formatMonthDay(p.feast_day_catholic);
        const orth = formatMonthDay(p.feast_day_orthodox);
        if (!cat && !orth) return "";
        if (cat && orth && cat !== orth) return `Feast: ${cat} (Catholic) · ${orth} (Orthodox)\n`;
        return `Feast: ${cat ?? orth}\n`;
      })();
      return `${subject}
${p.born ?? "?"}–${p.died ?? "?"}${p.see ? ` · Bishop of ${p.see}` : ""}
${feast}
${body}

${ex?.primary_citation ? `Primary source: ${ex.primary_citation}\n` : ""}
Open ${shortName(p.name)}'s page: ${url}
—
Patristic Lineage · ${siteUrl}
Unsubscribe: {$unsubscribe}`;
    }
    case "council":
    case "schism":
    case "heretic": {
      const a = content.type === "heretic" ? content.anniversary : content.anniversary;
      const title = a ? `${a.title} (${a.year})` : "today's spotlight";
      const blurb = a?.blurb ?? "";
      return `${subject}
${title}

${blurb}

—
Patristic Lineage · ${siteUrl}
Unsubscribe: {$unsubscribe}`;
    }
    case "era": {
      const label = ERA_LABEL[content.era] ?? content.era;
      const list = content.figures.map((p) => `- ${p.name} (${formatLifeRange(p.born, p.died)})`).join("\n");
      return `${subject}

This week we focus on the ${label}:
${list}

—
Patristic Lineage · ${siteUrl}
Unsubscribe: {$unsubscribe}`;
    }
    case "quote":
      return `${subject}

"${content.quote.text}"
— ${content.person.name}, ${content.quote.source}

—
Patristic Lineage · ${siteUrl}
Unsubscribe: {$unsubscribe}`;
  }
}

// ── Public entry point ──

export function renderEmail(
  content: Content,
  siteUrl = "https://patristic.io",
  extras: EmailExtras = {}
): { subject: string; html: string; plain: string } {
  const subject = subjectFor(content);
  const eyebrow = eyebrowLabel(content);

  let body: string;
  switch (content.type) {
    case "father":
      body = buildFatherBody(content, siteUrl, extras);
      break;
    case "council":
      body = buildAnniversaryBody("council", content.anniversary, extras.related, siteUrl);
      break;
    case "schism":
      body = buildAnniversaryBody("schism", content.anniversary, extras.related, siteUrl);
      break;
    case "heretic":
      body = buildAnniversaryBody(
        "heretic",
        content.anniversary ?? { title: content.person.name, year: content.person.died ?? 0, blurb: content.person.short_bio },
        extras.related,
        siteUrl,
        content.person
      );
      break;
    case "era":
      body = buildEraBody(content, siteUrl);
      break;
    case "quote":
      body = buildQuoteBody(content, siteUrl);
      break;
  }

  const previewSnippet = (() => {
    switch (content.type) {
      case "father": return content.person.short_bio.slice(0, 140);
      case "council":
      case "schism": return content.anniversary.blurb.slice(0, 140);
      case "heretic": return content.anniversary?.blurb.slice(0, 140) ?? content.person.short_bio.slice(0, 140);
      case "era": return `${ERA_LABEL[content.era] ?? content.era} — four figures this week.`;
      case "quote": return content.quote.text.slice(0, 140);
    }
  })();

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5efe0;font-family:Georgia,'Times New Roman',serif;color:#1f1a13;line-height:1.55;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(previewSnippet)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe0;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffaf0;border:1px solid #1f1a1320;border-radius:6px;">
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;color:#1f1a13;">
                <span style="font-family:Georgia,serif;font-size:18px;letter-spacing:0.04em;">Patristic Lineage</span>
              </a>
              <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#1f1a1380;">${escapeHtml(eyebrow)} · ${escapeHtml(formatDate(content.date))}</p>
            </td>
          </tr>
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#1f1a1318;margin:18px 0 24px;"></div></td></tr>
          ${body}
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #1f1a1318;background:#1f1a1306;">
              <p style="margin:0 0 8px;font-size:12px;color:#1f1a13a0;line-height:1.6;">
                One of 206 figures we track from Jesus to John of Damascus, AD 30–750. Browse the full lineage and past issues at
                <a href="${escapeHtml(siteUrl)}" style="color:#8b1e2d;text-decoration:none;border-bottom:1px solid #8b1e2d44;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>.
              </p>
              <p style="margin:0;font-size:11px;color:#1f1a1370;">
                You're getting this because you signed up at ${escapeHtml(siteUrl)}/today.
                <a href="{$unsubscribe}" style="color:#1f1a1370;text-decoration:underline;">Unsubscribe</a> — your call, no hard feelings.
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

  const plain = plainTextFor(content, extras, siteUrl);
  return { subject, html, plain };
}
