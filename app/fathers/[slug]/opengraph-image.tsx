import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { getPeople, getPerson } from "@/lib/data";
import { formatRoles } from "@/lib/roles";

export const runtime = "nodejs";
export const alt = "Church Father — Patristic Lineage";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return getPeople().map((p) => ({ slug: p.id }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPerson(slug);

  if (!p) {
    return new ImageResponse(
      (
        <OgCard
          eyebrow="Patristic Lineage"
          title="Church Father"
          subtitle="patristic.io — the sourced chain from Jesus to the Fathers."
        />
      ),
      { ...size }
    );
  }

  const dates = `${p.born ?? "?"} – ${p.died ?? "?"}`;
  const role = p.role ? formatRoles(p.role) : null;
  const place = p.see ?? p.death_place ?? p.birth_place ?? null;
  const metaParts = [dates, role, place].filter(Boolean) as string[];

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Church Father"
        badge={dates}
        title={p.name}
        subtitle={(p.short_bio ?? "").slice(0, 220)}
        meta={metaParts.slice(1).join(" · ") || "patristic.io"}
      />
    ),
    { ...size }
  );
}
