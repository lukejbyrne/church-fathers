import { featuredOfDay, parseIsoDate, isoDate, addDays } from "@/lib/featured";
import { chainTo } from "@/lib/data";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const dParam = url.searchParams.get("d");
  const date = parseIsoDate(dParam) ?? new Date();
  const person = featuredOfDay(date);
  const next = addDays(date, 1);

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";
  const primary = person.citations?.find((c) => c.kind === "primary");

  // Strongest chain back to Jesus, anchor-first (Jesus → ... → person).
  // chainTo returns [{ person, edge }] anchor-first; flatten to a slim shape.
  const rawChain = chainTo(person.id, "jesus-of-nazareth", "all");
  const chain = (rawChain ?? []).map(({ person: p, edge }) => ({
    id: p.id,
    name: p.name,
    born: p.born ?? null,
    died: p.died ?? null,
    edge_type: edge?.type ?? null,
    edge_strength: edge?.strength ?? null,
  }));

  return Response.json(
    {
      date: isoDate(date),
      person: {
        id: person.id,
        name: person.name,
        url: `${base}/fathers/${person.id}`,
        image_url: person.image_url ?? null,
        born: person.born ?? null,
        died: person.died ?? null,
        birth_place: person.birth_place ?? null,
        see: person.see ?? null,
        region: person.region,
        short_bio: person.short_bio,
        why_matters: person.why_matters ?? null,
        primary_citation: primary?.source ?? null,
        first_work: person.works?.[0]
          ? { title: person.works[0].title, description: person.works[0].description ?? null }
          : null,
      },
      chain,
      next_date: isoDate(next),
    },
    {
      headers: {
        "cache-control": "public, max-age=3600",
        "access-control-allow-origin": "*",
      },
    }
  );
}
