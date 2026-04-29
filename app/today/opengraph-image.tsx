import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { pickContent } from "@/lib/picker";

export const runtime = "nodejs";
export const alt = "Today's Patristic Wisdom";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Re-render daily; picker is deterministic by date so cache for ~1h is fine.
export const revalidate = 3600;

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function Image() {
  const now = new Date();
  const c = pickContent(now);

  let badge = "TODAY";
  let title = "Today's Patristic Wisdom";
  let subtitle = formatDate(now);

  if (c.type === "father") {
    badge = c.reason.startsWith("feast") ? "FEAST DAY" : "FATHER";
    title = c.person.name;
    const dates = `${c.person.born ?? "?"} – ${c.person.died ?? "?"}`;
    subtitle = `${dates} · ${c.person.short_bio ?? ""}`.slice(0, 200);
  } else if (c.type === "council") {
    badge = "COUNCIL";
    title = c.anniversary.title;
    subtitle = c.anniversary.blurb ?? formatDate(now);
  } else if (c.type === "schism") {
    badge = "SCHISM";
    title = c.anniversary.title;
    subtitle = c.anniversary.blurb ?? formatDate(now);
  } else if (c.type === "heretic") {
    badge = "HERESY";
    title = c.person.name;
    subtitle = c.person.short_bio ?? formatDate(now);
  } else if (c.type === "era") {
    const eraLabel = c.era.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    badge = "ERA";
    title = `Spotlight: ${eraLabel}`;
    subtitle = c.figures.map((p) => p.name).slice(0, 4).join(" · ");
  } else if (c.type === "quote") {
    badge = "QUOTE";
    const q = (c.quote.text ?? "").trim();
    title = q.length > 140 ? q.slice(0, 137) + "…" : q;
    subtitle = `— ${c.person.name}`;
  }

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Daily Patristic Wisdom"
        badge={badge}
        title={title}
        subtitle={subtitle}
        meta={formatDate(now) + " · patristic.io"}
      />
    ),
    { ...size }
  );
}
