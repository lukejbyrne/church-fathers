// Shared HTML email template for the daily Patristic newsletter.
// Used by both:
//   - netlify/functions/daily-email.ts (the actual scheduled send)
//   - scripts/preview-email.ts          (local preview)
//
// One shell, six body variants — one per Content type from lib/picker.ts.

import type { Content } from "./picker";
import type { Person, TraditionStatus } from "./schema";
import { eraForTraditionStatus } from "./eras";
import { quoteIssueTitle, quotePreviewText } from "./quote-copy";
import { recommendedWorksForEra, type RecommendedWork } from "./recommendations";

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

export type EmailBook = {
  title: string;
  author: string;
  reason: string;
  audience: string;
  cover_image_url?: string | null;
  cover_alt?: string | null;
  amazon_url?: string | null;
  read_url?: string | null;
  person_url: string;
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

export type EmailImage = {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  license?: string;
  source_url?: string;
  object_position?: string;
};

export type EmailExtras = {
  // For father / heretic / quote slots: optional enrichment for the chosen person.
  father?: FatherExtras;
  // Deterministic daily reading pick, shared across all email variants.
  book?: EmailBook | null;
  // For council / schism / heretic / era: related figures with portraits.
  related?: RelatedFigure[];
  // For council / schism / heretic event slots.
  eventImage?: EmailImage;
  // For era spotlight slots.
  eraImage?: EmailImage;
  // For non-feast context slots: recommended primary works / editions.
  recommendedWorks?: RecommendedWork[];
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

const ERA_EMAIL_SUMMARY: Record<TraditionStatus, string> = {
  apostle:
    "This is the generation that touched Jesus and carried the gospel from Jerusalem into the wider Roman world. The central question is whether Gentiles can enter the people of God without first becoming Jews.",
  "apostolic-father":
    "This is the generation that received the faith from the apostles and had to hand it on without them. Its letters show the church taking visible shape: bishops, Eucharist, martyrdom, discipline, and a shared rule of faith.",
  apologist:
    "This is when Christians began answering outsiders in public. The apologists argued before emperors, philosophers, Jews, pagans, and heretics that Christianity was not superstition, but the true worship of God.",
  "ante-nicene":
    "This is the church before Constantine and Nicaea: growing under persecution, forming its canon and creed, and learning the language it would later need for the Trinity. The period ends with the Arian crisis becoming impossible to avoid.",
  nicene:
    "This is the age of the great councils. Nicaea, Constantinople, Ephesus, and Chalcedon gave the church durable language for the Trinity and for Christ as one person in two natures.",
  "post-nicene":
    "This is the aftermath of Chalcedon and the collapse of the Western empire. The church had to preserve doctrine, reconcile divided Christians, and carry learning through bishops, monasteries, and pastoral institutions.",
  "desert-father":
    "This is where monasticism becomes a major Christian vocation. After persecution waned, the desert became the place where Christians fought sin, desire, distraction, and despair with prayer, fasting, silence, and spiritual fatherhood.",
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

function sentenceMatches(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+["'”’)]*(?=\s|$)/g)?.map((s) => s.trim()) ?? [];
}

function firstSentence(text: string | undefined, max = 160): string {
  if (!text) return "";
  const sentences = sentenceMatches(text);
  let out = sentences[0] ?? text;
  if (out.length > max) out = out.slice(0, max - 1).trimEnd() + "…";
  return out;
}

function firstSentences(text: string | undefined, count = 2, max = 360): string {
  if (!text) return "";
  const sentences = sentenceMatches(text);
  let out = sentences.length ? sentences.slice(0, count).join(" ") : text;
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
  if (p.tradition_status) rows.push(["Era", ERA_LABEL[p.tradition_status] ?? p.tradition_status]);
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

function renderQuoteFacts(p: Person): string {
  const rows: Array<[string, string]> = [];
  if (p.born != null || p.died != null) rows.push(["Lifespan", formatLifeRange(p.born, p.died)]);
  if (p.tradition_status) rows.push(["Era", ERA_LABEL[p.tradition_status] ?? p.tradition_status]);
  if (p.birth_place) rows.push(["Born in", p.birth_place]);
  if (p.see) rows.push(["See", p.see]);
  if (p.region) rows.push(["Region", REGION_LABEL[p.region] ?? p.region.replace(/-/g, " ")]);
  if (rows.length === 0) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0;border-top:1px solid #1f1a1312;">
    ${rows
      .map(
        ([k, v]) => `<tr>
        <td style="padding:7px 0;border-bottom:1px solid #1f1a1312;width:34%;font-size:11px;color:#1f1a1390;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(k)}</td>
        <td style="padding:7px 0 7px 12px;border-bottom:1px solid #1f1a1312;font-size:13px;color:#1f1a13d0;">${escapeHtml(v)}</td>
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

function renderBookRecommendation(
  book: EmailBook | null | undefined,
  label = "Book of the day"
): string {
  if (!book) return "";
  const links: string[] = [];
  if (book.amazon_url) {
    links.push(
      `<a href="${escapeHtml(book.amazon_url)}" style="display:inline-block;padding:7px 14px;background:#8b1e2d;color:#fffaf0;text-decoration:none;border-radius:4px;font-size:13px;font-family:Georgia,serif;margin-right:8px;">Find a copy →</a>`
    );
  }
  if (book.read_url) {
    links.push(
      `<a href="${escapeHtml(book.read_url)}" style="display:inline-block;padding:7px 14px;border:1px solid #1f1a1330;color:#1f1a13;text-decoration:none;border-radius:4px;font-size:13px;font-family:Georgia,serif;margin-right:8px;">Read free →</a>`
    );
  }
  links.push(
    `<a href="${escapeHtml(book.person_url)}" style="display:inline-block;padding:7px 14px;border:1px solid #1f1a1330;color:#1f1a13;text-decoration:none;border-radius:4px;font-size:13px;font-family:Georgia,serif;">Figure page →</a>`
  );

  const cover = book.cover_image_url
    ? `<img src="${escapeHtml(book.cover_image_url)}" alt="${escapeHtml(book.cover_alt ?? `Cover of ${book.title}`)}" width="84" height="126" style="display:block;width:84px;height:126px;object-fit:cover;border:1px solid #1f1a1328;border-radius:3px;background:#1f1a1308;" />`
    : `<div style="width:84px;height:126px;border:1px solid #1f1a1328;border-radius:3px;background:#8b1e2d;color:#fffaf0;font-family:Georgia,serif;font-size:14px;line-height:1.15;padding:10px;box-sizing:border-box;display:table-cell;vertical-align:middle;text-align:center;">${escapeHtml(book.title)}</div>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;padding:0;background:#fffaf0;border:1px solid #1f1a1320;border-radius:6px;">
    <tr>
      <td width="108" style="padding:16px;vertical-align:top;">${cover}</td>
      <td style="padding:16px 16px 16px 0;vertical-align:top;">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:6px;">${escapeHtml(label)}</div>
        <div style="font-family:Georgia,serif;font-size:19px;line-height:1.2;color:#1f1a13;margin-bottom:3px;">${escapeHtml(book.title)}</div>
        <div style="font-size:12px;color:#1f1a1380;margin-bottom:10px;">${escapeHtml(book.author)}</div>
        <div style="font-size:13px;color:#1f1a13b0;line-height:1.5;margin-bottom:12px;">${escapeHtml(book.reason)}</div>
        <div>${links.join("")}</div>
      </td>
    </tr>
  </table>`;
}

function renderQuoteReading(
  book: EmailBook | null | undefined,
  currentPersonName: string
): string {
  if (!book) return "";

  const title = book.title;
  const author = book.author;
  const description = book.reason;
  const cover = book
    ? book.cover_image_url
      ? `<img src="${escapeHtml(book.cover_image_url)}" alt="${escapeHtml(book.cover_alt ?? `Cover of ${book.title}`)}" width="78" height="116" style="display:block;width:78px;height:116px;object-fit:cover;border:1px solid #1f1a1328;border-radius:3px;background:#1f1a1308;" />`
      : `<div style="width:78px;height:116px;border:1px solid #1f1a1328;border-radius:3px;background:#8b1e2d;color:#fffaf0;font-family:Georgia,serif;font-size:13px;line-height:1.15;padding:9px;box-sizing:border-box;display:table-cell;vertical-align:middle;text-align:center;">${escapeHtml(book.title)}</div>`
    : "";
  const authorLine =
    author && author !== currentPersonName
      ? `<div style="font-size:12px;color:#1f1a1380;margin-bottom:10px;">${escapeHtml(author)}</div>`
      : "";
  const links: string[] = [];
  const editionUrl = book.amazon_url;
  const readUrl = book.read_url;

  if (editionUrl) {
    links.push(
      `<a href="${escapeHtml(editionUrl)}" style="display:inline-block;padding:7px 14px;background:#8b1e2d;color:#fffaf0;text-decoration:none;border-radius:4px;font-size:13px;font-family:Georgia,serif;margin-right:8px;white-space:nowrap;">Find an edition&nbsp;→</a>`
    );
  }
  if (readUrl) {
    links.push(
      `<a href="${escapeHtml(readUrl)}" style="display:inline-block;padding:7px 14px;border:1px solid #1f1a1330;color:#1f1a13;text-decoration:none;border-radius:4px;font-size:13px;font-family:Georgia,serif;margin-right:8px;white-space:nowrap;">Read online&nbsp;→</a>`
    );
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#fffaf0;border:1px solid #1f1a1320;border-radius:6px;">
    <tr>
      ${cover ? `<td width="102" style="padding:16px 8px 16px 16px;vertical-align:top;">${cover}</td>` : ""}
      <td style="padding:16px 18px;vertical-align:top;">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:6px;">Read next</div>
        <div style="font-family:Georgia,serif;font-size:19px;line-height:1.2;color:#1f1a13;margin-bottom:3px;">${escapeHtml(title)}</div>
        ${authorLine}
        ${description ? `<div style="font-size:13px;color:#1f1a13b0;line-height:1.5;margin-bottom:12px;">${escapeHtml(description)}</div>` : ""}
        ${links.length ? `<div>${links.join("")}</div>` : ""}
      </td>
    </tr>
  </table>`;
}

function comparableWorkTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b([a-z]{4,})ies\b/g, "$1y")
    .replace(/\b([a-z]{4,})s\b/g, "$1")
    .trim();
}

function recommendedWorksWithoutBook(
  works: RecommendedWork[] | undefined,
  book: EmailBook | null | undefined
): RecommendedWork[] {
  if (!works || works.length === 0) return [];
  if (!book?.title) return works;
  const bookTitle = comparableWorkTitle(book.title);
  return works.filter((work) => {
    const workTitle = comparableWorkTitle(work.title);
    return workTitle !== bookTitle && !workTitle.includes(bookTitle) && !bookTitle.includes(workTitle);
  });
}

function renderRecommendedWorks(
  works: RecommendedWork[] | undefined,
  title = "Recommended reading",
  featuredBook?: EmailBook | null
): string {
  const visibleWorks = recommendedWorksWithoutBook(works, featuredBook);
  if (visibleWorks.length === 0) return "";
  const items = visibleWorks
    .slice(0, 4)
    .map((work) => {
      const links: string[] = [];
      if (work.readUrl) {
        links.push(`<a href="${escapeHtml(work.readUrl)}" style="color:#8b1e2d;text-decoration:none;border-bottom:1px solid #8b1e2d44;">Read online</a>`);
      }
      if (work.editionUrl) {
        links.push(`<a href="${escapeHtml(work.editionUrl)}" style="color:#8b1e2d;text-decoration:none;border-bottom:1px solid #8b1e2d44;">Find an edition</a>`);
      }
      return `<tr><td style="padding:12px 0;border-top:1px solid #1f1a1312;">
        <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#1f1a1370;margin-bottom:4px;">${escapeHtml(work.personName)}</div>
        <div style="font-family:Georgia,serif;font-size:16px;color:#1f1a13;line-height:1.3;">${escapeHtml(work.title)}${work.year ? ` <span style="font-size:12px;color:#1f1a1370;">· ${work.year}</span>` : ""}</div>
        ${work.description ? `<div style="font-size:12px;color:#1f1a13a8;line-height:1.5;margin-top:5px;">${escapeHtml(work.description)}</div>` : ""}
        ${links.length ? `<div style="font-size:12px;margin-top:8px;">${links.join(" &nbsp; ")}</div>` : ""}
      </td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#1f1a1304;border:1px solid #1f1a1318;border-radius:6px;padding:4px 14px;">
    <tr><td style="padding:10px 0 2px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;">${escapeHtml(title)}</td></tr>
    ${items}
  </table>`;
}

function paragraphsHtml(body: string): string {
  const paras = (() => {
    const fromBlanks = body.split(/\n\n+/).filter((s) => s.trim());
    if (fromBlanks.length > 1) return fromBlanks;
    const sentences = body.split(/(?<=[.!?])\s+(?=[A-Z])/).reduce<string[]>((acc, sentence) => {
      const prev = acc[acc.length - 1];
      if (prev && /\b[A-Z]\.$/.test(prev)) {
        acc[acc.length - 1] = `${prev} ${sentence}`;
      } else {
        acc.push(sentence);
      }
      return acc;
    }, []);
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

function renderContentImage(image: EmailImage | undefined, siteUrl: string): string {
  if (!image?.src) return "";
  const src = absoluteUrl(image.src, siteUrl) ?? image.src;
  const credit = [image.credit, image.license].filter(Boolean).join(" · ");
  const source = image.source_url
    ? `<a href="${escapeHtml(image.source_url)}" style="color:#1f1a1370;text-decoration:none;border-bottom:1px solid #1f1a1325;">${escapeHtml(credit || "Source")}</a>`
    : escapeHtml(credit);
  const caption = image.caption || credit
    ? `<div style="padding:7px 2px 0;font-size:11px;line-height:1.4;color:#1f1a1370;">${image.caption ? escapeHtml(image.caption) : ""}${image.caption && credit ? " " : ""}${credit ? source : ""}</div>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td>
    <img src="${escapeHtml(src)}" alt="${escapeHtml(image.alt)}" width="536" style="display:block;width:100%;max-width:536px;max-height:245px;object-fit:cover;object-position:${escapeHtml(image.object_position ?? "center")};border-radius:6px;border:1px solid #1f1a1320;background:#1f1a1308;" />
    ${caption}
  </td></tr></table>`;
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
    <tr><td style="padding:0 32px;">${renderBookRecommendation(extras.book, "If you'd read one thing") || renderFirstWork(ex?.first_work, personUrl)}</td></tr>
    <tr><td style="padding:8px 32px 24px;text-align:center;">
      <a href="${escapeHtml(personUrl)}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;">Open ${escapeHtml(shortName(p.name))}'s page →</a>
    </td></tr>`;
}

function buildAnniversaryBody(
  kind: "council" | "schism" | "heretic",
  anniv: { id?: string; title: string; year: number; blurb: string; citation?: string; key_line?: string; highlights?: string[] },
  related: RelatedFigure[] | undefined,
  siteUrl: string,
  book?: EmailBook | null,
  heretic?: Person,
  eventImage?: EmailImage,
  recommendedWorks?: RecommendedWork[]
): string {
  const accent = kind === "schism" ? "#5a3a3a" : kind === "heretic" ? "#3a3a5a" : "#8b1e2d";
  const eyebrow = kind === "schism" ? "Schism" : kind === "heretic" ? "Condemnation" : "Council";
  const heading = `Today in ${anniv.year}`;
  const heroImg = heretic && !eventImage ? portraitImg(heretic.image_url, heretic.name, 96) : "";
  const eventUrl = anniv.id ? `${siteUrl}/events/${anniv.id}` : `${siteUrl}/schisms`;
  return `
    <tr><td style="padding:0 32px 0;text-align:center;">
      ${heroImg}
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${accent}cc;">${eyebrow}</p>
      <h1 style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;color:#1f1a13;line-height:1.2;">${escapeHtml(anniv.title)}</h1>
      <p style="margin:0 0 18px;font-size:13px;color:#1f1a13aa;">${heading}</p>
    </td></tr>
    <tr><td style="padding:0 32px;">${renderContentImage(eventImage, siteUrl)}</td></tr>
    <tr><td style="padding:0 32px;">
      ${paragraphsHtml(anniv.blurb)}
    </td></tr>
    ${
      anniv.key_line
        ? `<tr><td style="padding:0 32px;"><div style="margin:4px 0 22px;border-left:3px solid ${accent}99;padding:8px 14px;background:#1f1a1305;font-family:Georgia,serif;font-size:20px;line-height:1.4;color:#1f1a13;">${escapeHtml(anniv.key_line)}</div></td></tr>`
        : ""
    }
    ${
      anniv.highlights && anniv.highlights.length > 0
        ? `<tr><td style="padding:0 32px;"><div style="margin:0 0 22px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:8px;">Highlights</div>${anniv.highlights
            .slice(0, 4)
            .map((item) => `<div style="border-left:2px solid ${accent}66;padding:2px 0 2px 10px;margin:7px 0;font-size:14px;line-height:1.5;color:#1f1a13c8;">${escapeHtml(item)}</div>`)
            .join("")}</div></td></tr>`
        : ""
    }
    ${
      related && related.length > 0
        ? `<tr><td style="padding:0 32px;"><h2 style="margin:8px 0 8px;font-family:Georgia,serif;font-size:18px;font-weight:normal;color:#1f1a13;">People in the story</h2>${relatedGrid(related)}</td></tr>`
        : ""
    }
    <tr><td style="padding:0 32px;">${renderBookRecommendation(book)}</td></tr>
    <tr><td style="padding:0 32px;">${renderRecommendedWorks(recommendedWorks, "Recommended reading", book)}</td></tr>
    <tr><td style="padding:0 32px;">${renderCitation(anniv.citation, "Source")}</td></tr>
    <tr><td style="padding:8px 32px 24px;text-align:center;">
      <a href="${escapeHtml(eventUrl)}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;">Open the full event page →</a>
    </td></tr>`;
}

function buildEraBody(content: Extract<Content, { type: "era" }>, siteUrl: string, extras: EmailExtras): string {
  const eraDef = eraForTraditionStatus(content.era);
  const eraSlug = eraDef.slug;
  const label = eraDef.label;
  const summary = ERA_EMAIL_SUMMARY[content.era];
  const works = extras.recommendedWorks ?? recommendedWorksForEra(content.era, 4);
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
      <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;color:#1f1a13;">${escapeHtml(label)}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#1f1a13c8;text-align:left;">${escapeHtml(summary)}</p>
    </td></tr>
    <tr><td style="padding:0 32px;">${renderContentImage(extras.eraImage, siteUrl)}</td></tr>
    ${
      `<tr><td style="padding:0 32px;"><h2 style="margin:4px 0 10px;font-family:Georgia,serif;font-size:18px;font-weight:normal;color:#1f1a13;">Why it matters</h2>${paragraphsHtml(eraDef.intro[0])}</td></tr>`
    }
    ${
      eraDef?.decided.length
        ? `<tr><td style="padding:0 32px;"><div style="margin:2px 0 22px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:8px;">What this era gives the church</div>${eraDef.decided
            .slice(0, 4)
            .map((item) => `<div style="border-left:2px solid #8b1e2d55;padding:2px 0 2px 10px;margin:7px 0;font-size:14px;line-height:1.5;color:#1f1a13c8;">${escapeHtml(item)}</div>`)
            .join("")}</div></td></tr>`
        : ""
    }
    <tr><td style="padding:0 32px;">
      <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:18px;font-weight:normal;color:#1f1a13;">Four people to know</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#1f1a1304;border:1px solid #1f1a1318;border-radius:6px;padding:8px;">${rows.join("")}</table>
    </td></tr>
    <tr><td style="padding:0 32px;">${renderRecommendedWorks(works, "Recommended reading", extras.book)}</td></tr>
    <tr><td style="padding:0 32px;">${renderBookRecommendation(extras.book)}</td></tr>
    <tr><td style="padding:8px 32px 24px;text-align:center;">
      <a href="${escapeHtml(siteUrl)}/eras/${eraSlug}" style="display:inline-block;padding:11px 22px;background:#1f1a13;color:#f5efe0;text-decoration:none;border-radius:4px;font-size:14px;font-family:Georgia,serif;">Open the ${escapeHtml(label)} page →</a>
    </td></tr>`;
}

function buildQuoteBody(content: Extract<Content, { type: "quote" }>, siteUrl: string, extras: EmailExtras): string {
  const personUrl = `${siteUrl}/fathers/${content.person.id}`;
  const title = quoteIssueTitle(content.quote, content.person);
  const source = `${content.quote.source}${content.quote.translation ? ` · ${content.quote.translation}` : ""}`;
  const context = content.quote.context?.trim();
  const impact = content.quote.impact?.trim();
  const about = firstSentences(content.person.why_matters ?? content.person.short_bio, 2, 380);
  const contextBlock = context || impact
    ? `<tr><td style="padding:0 32px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#8b1e2d08;border:1px solid #8b1e2d18;border-radius:6px;">
        ${context ? `<tr><td style="padding:16px 18px 6px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8b1e2dcc;margin-bottom:6px;">Plain English</div><p style="margin:0;font-size:15px;line-height:1.65;color:#1f1a13d8;">${escapeHtml(context)}</p></td></tr>` : ""}
        ${impact ? `<tr><td style="padding:${context ? "8px" : "16px"} 18px 16px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8b1e2dcc;margin-bottom:6px;">Why it matters</div><p style="margin:0;font-size:15px;line-height:1.65;color:#1f1a13d8;">${escapeHtml(impact)}</p></td></tr>` : ""}
      </table>
    </td></tr>`
    : "";
  return `
    <tr><td style="padding:0 32px;text-align:center;">
      <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;color:#1f1a13;line-height:1.18;">${escapeHtml(title)}</h1>
      <div style="width:42px;height:1px;background:#1f1a1325;margin:0 auto 24px;"></div>
    </td></tr>
    <tr><td style="padding:0 32px;text-align:center;">
      <blockquote style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.4;color:#1f1a13;font-style:italic;border-left:0;padding:0;">"${escapeHtml(content.quote.text)}"</blockquote>
      <div style="margin:0 0 24px;text-align:center;">
        ${portraitImg(content.person.image_url, content.person.name, 58).replace("margin:0 auto 18px;", "margin:0 auto 8px;")}
        <a href="${escapeHtml(personUrl)}" style="font-size:13px;line-height:1.4;color:#1f1a13;text-decoration:none;border-bottom:1px solid #1f1a1328;">${escapeHtml(content.person.name)}</a>
        <div style="margin-top:4px;font-size:12px;line-height:1.4;color:#1f1a1380;font-style:italic;">${escapeHtml(source)}</div>
      </div>
    </td></tr>
    ${contextBlock}
    <tr><td style="padding:0 32px;">
      <div style="margin:0 0 24px;padding:14px 16px;background:#1f1a1304;border:1px solid #1f1a1318;border-radius:6px;">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#1f1a1380;margin-bottom:6px;">About ${escapeHtml(shortName(content.person.name))}</div>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#1f1a13c8;">${escapeHtml(about || content.person.short_bio)}</p>
        ${renderQuoteFacts(content.person)}
      </div>
    </td></tr>
    <tr><td style="padding:0 32px;">${renderQuoteReading(extras.book, content.person.name)}</td></tr>
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
      return `This week: the ${eraForTraditionStatus(content.era).label}`;
    case "quote":
      return quoteIssueTitle(content.quote, content.person);
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

function recommendedWorksText(
  works: RecommendedWork[] | undefined,
  featuredBook?: EmailBook | null
): string {
  const visibleWorks = recommendedWorksWithoutBook(works, featuredBook);
  if (visibleWorks.length === 0) return "";
  return `Recommended reading:\n${visibleWorks
    .slice(0, 4)
    .map((work) => {
      const links = [work.readUrl, work.editionUrl].filter(Boolean).join(" | ");
      return `- ${work.title} — ${work.personName}${links ? ` (${links})` : ""}`;
    })
    .join("\n")}\n\n`;
}

function plainBookLine(book: EmailBook | null | undefined): string {
  if (!book) return "";
  const links = [
    book.amazon_url ? `Find a copy: ${book.amazon_url}` : "",
    book.read_url ? `Read free: ${book.read_url}` : "",
  ].filter(Boolean);
  return `\nBook of the day: ${book.title} — ${book.author}\n${book.reason}${links.length ? `\n${links.join("\n")}` : ""}\n`;
}

function quoteReadingText(
  book: EmailBook | null | undefined,
  currentPersonName: string
): string {
  if (!book) return "";

  const title = book.title;
  const author = book.author;
  const description = book.reason;
  const links = [
    book.amazon_url ? `Find an edition: ${book.amazon_url}` : "",
    book.read_url ? `Read online: ${book.read_url}` : "",
  ].filter(Boolean);
  const authorSuffix = author && author !== currentPersonName ? ` — ${author}` : "";

  return `Read next:\n${title}${authorSuffix}\n${description}${links.length ? `\n${links.join("\n")}` : ""}\n\n`;
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
${plainBookLine(extras.book)}
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
      const eventUrl = a?.id ? `${siteUrl}/events/${a.id}` : `${siteUrl}/schisms`;
      return `${subject}
${title}

${blurb}

${a?.key_line ? `${a.key_line}\n\n` : ""}${a?.highlights?.length ? `Highlights:\n${a.highlights.slice(0, 4).map((item) => `- ${item}`).join("\n")}\n\n` : ""}${recommendedWorksText(extras.recommendedWorks, extras.book)}${plainBookLine(extras.book)}
Open the full event page: ${eventUrl}

—
Patristic Lineage · ${siteUrl}
Unsubscribe: {$unsubscribe}`;
    }
    case "era": {
      const eraDef = eraForTraditionStatus(content.era);
      const label = eraDef.label;
      const list = content.figures.map((p) => `- ${p.name} (${formatLifeRange(p.born, p.died)})`).join("\n");
      const why = eraDef.decided.slice(0, 4).map((item) => `- ${item}`).join("\n");
      return `${subject}

This week we focus on the ${label} (${eraDef.yearLabel}).

${ERA_EMAIL_SUMMARY[content.era]}

${eraDef.blurb}

${eraDef.intro[0] ?? ""}

Why it matters:
${why}

Representative figures:
${list}

${recommendedWorksText(extras.recommendedWorks, extras.book)}${plainBookLine(extras.book)}
—
Patristic Lineage · ${siteUrl}
Unsubscribe: {$unsubscribe}`;
    }
    case "quote": {
      return `${subject}

"${content.quote.text}"
${content.person.name}, ${content.quote.source}${content.quote.translation ? ` · ${content.quote.translation}` : ""}

${content.quote.context ? `Plain English:\n${content.quote.context}\n\n` : ""}${content.quote.impact ? `Why it matters:\n${content.quote.impact}\n\n` : ""}About ${shortName(content.person.name)}:
${content.person.name} (${formatLifeRange(content.person.born, content.person.died)})
${content.person.why_matters ?? content.person.short_bio}

${quoteReadingText(extras.book, content.person.name)}
Read more about ${shortName(content.person.name)}: ${siteUrl}/fathers/${content.person.id}
—
Patristic Lineage · ${siteUrl}
Unsubscribe: {$unsubscribe}`;
    }
  }
}

// ── Public entry point ──

function absoluteUrl(url: string | null | undefined, siteUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return siteUrl.replace(/\/$/, "") + url;
  return url;
}

function withAbsoluteImages(content: Content, siteUrl: string): Content {
  // Email clients can't resolve site-relative paths — absolutize before render.
  if (content.type === "father" || content.type === "heretic" || content.type === "quote") {
    return {
      ...content,
      person: { ...content.person, image_url: absoluteUrl(content.person.image_url, siteUrl) ?? undefined },
    };
  }
  if (content.type === "era") {
    return {
      ...content,
      figures: content.figures.map((p) => ({
        ...p,
        image_url: absoluteUrl(p.image_url, siteUrl) ?? undefined,
      })),
    };
  }
  return content;
}

export function renderEmail(
  rawContent: Content,
  siteUrl = "https://patristic.io",
  extras: EmailExtras = {}
): { subject: string; html: string; plain: string } {
  const content = withAbsoluteImages(rawContent, siteUrl);
  const subject = subjectFor(content);
  const eyebrow = eyebrowLabel(content);

  let body: string;
  switch (content.type) {
    case "father":
      body = buildFatherBody(content, siteUrl, extras);
      break;
    case "council":
      body = buildAnniversaryBody("council", content.anniversary, extras.related, siteUrl, extras.book, undefined, extras.eventImage, extras.recommendedWorks);
      break;
    case "schism":
      body = buildAnniversaryBody("schism", content.anniversary, extras.related, siteUrl, extras.book, undefined, extras.eventImage, extras.recommendedWorks);
      break;
    case "heretic":
      body = buildAnniversaryBody(
        "heretic",
        content.anniversary ?? { title: content.person.name, year: content.person.died ?? 0, blurb: content.person.short_bio },
        extras.related,
        siteUrl,
        extras.book,
        content.person,
        extras.eventImage,
        extras.recommendedWorks
      );
      break;
    case "era":
      body = buildEraBody(content, siteUrl, extras);
      break;
    case "quote":
      body = buildQuoteBody(content, siteUrl, extras);
      break;
  }

  const previewSnippet = (() => {
    switch (content.type) {
      case "father": return content.person.short_bio.slice(0, 140);
      case "council":
      case "schism": return content.anniversary.blurb.slice(0, 140);
      case "heretic": return content.anniversary?.blurb.slice(0, 140) ?? content.person.short_bio.slice(0, 140);
      case "era": {
        const eraDef = eraForTraditionStatus(content.era);
        return `${eraDef.label} — ${eraDef.blurb}`;
      }
      case "quote": return quotePreviewText(content.quote, content.person).slice(0, 140);
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
