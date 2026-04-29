import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { ERAS_DATA, type EraSlug } from "@/lib/eras";

export const runtime = "nodejs";
export const alt = "Patristic era — Patristic Lineage";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return Object.keys(ERAS_DATA).map((era) => ({ era }));
}

export default async function Image({ params }: { params: Promise<{ era: string }> }) {
  const { era: slug } = await params;
  const era = ERAS_DATA[slug as EraSlug];

  if (!era) {
    return new ImageResponse(
      (
        <OgCard eyebrow="Patristic Lineage" title="Patristic Eras" subtitle="patristic.io" />
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Patristic Era"
        badge={era.yearLabel}
        title={era.label}
        subtitle={era.blurb}
        meta={era.yearLabel + " · patristic.io"}
      />
    ),
    { ...size }
  );
}
