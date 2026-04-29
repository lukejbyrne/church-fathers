import type { ReactElement } from "react";

// Brand
const PARCHMENT = "#f5efe1";
const INK = "#1f1a13";
const ACCENT = "#8b1e2d";
const INK_MUTED = "#6b6457";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

type OgCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
};

export function OgCard({ eyebrow, title, subtitle, meta, badge }: OgCardProps): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: PARCHMENT,
        padding: "70px 80px",
        position: "relative",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: ACCENT,
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: ACCENT,
          fontSize: 22,
          letterSpacing: 6,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex" }}>{eyebrow ?? "Patristic Lineage"}</div>
        {badge ? (
          <div
            style={{
              display: "flex",
              padding: "4px 14px",
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 999,
              fontSize: 16,
              letterSpacing: 3,
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            color: INK,
            fontSize: title.length > 38 ? 78 : 96,
            lineHeight: 1.05,
            fontWeight: 600,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              color: INK_MUTED,
              fontSize: 36,
              lineHeight: 1.25,
              marginTop: 24,
              maxWidth: 1040,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          color: INK_MUTED,
          fontSize: 22,
        }}
      >
        <div style={{ display: "flex", color: INK, fontWeight: 600 }}>patristic.io</div>
        <div style={{ display: "flex" }}>{meta ?? "Sourced chain · AD 30 – 750"}</div>
      </div>
    </div>
  );
}
