import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Patristic Lineage — from Jesus to the Church Fathers";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="Patristic Lineage"
        title="From Jesus to the Church Fathers"
        subtitle="Trace how Christianity was handed down through a sourced graph of apostles, bishops, theologians, and martyrs."
        meta="patristic.io · AD 30 – 750"
      />
    ),
    { ...size }
  );
}
