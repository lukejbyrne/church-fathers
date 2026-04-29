import { pickContent, parseIsoDate, isoDate, addDays } from "@/lib/picker";
import { buildExtras } from "@/lib/email-helpers";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const dParam = url.searchParams.get("d");
  const date = parseIsoDate(dParam) ?? new Date();
  const next = addDays(date, 1);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";

  const content = pickContent(date);
  const extras = buildExtras(content, base);

  return Response.json(
    {
      date: isoDate(date),
      next_date: isoDate(next),
      content,
      extras,
    },
    {
      headers: {
        "cache-control": "public, max-age=3600",
        "access-control-allow-origin": "*",
      },
    }
  );
}
