import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Patristic Lineage — sourced chain from Jesus to the Church Fathers";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="Patristic Lineage"
        title="From Jesus to the Fathers"
        subtitle="A sourced visual chain of who knew whom — apostles, bishops, councils, schisms. Every relationship cited."
        meta="patristic.io · AD 30 – 750"
      />
    ),
    { ...size }
  );
}
