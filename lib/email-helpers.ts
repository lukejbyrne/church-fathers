// Helpers shared by the daily function, email preview page, and CLI preview.
// Build a Content object plus the EmailExtras needed to render it.

import { chainTo, getPerson, getPeople } from "./data";
import { pickContent, isoDate, type Content } from "./picker";
import { amazonUrl } from "./affiliate";
import type { EmailExtras, EmailChainStep, RelatedFigure } from "./email-template";
import type { Person } from "./schema";

// Email clients can't resolve site-relative URLs; always emit absolute.
function absoluteImage(url: string | null | undefined, siteUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return siteUrl.replace(/\/$/, "") + url;
  return url;
}

export function buildExtras(content: Content, siteUrl: string): EmailExtras {
  const extras: EmailExtras = {};

  if (content.type === "father") {
    const p = content.person;
    extras.father = fatherExtras(p, siteUrl);
  }
  if (content.type === "heretic") {
    extras.father = fatherExtras(content.person, siteUrl);
    extras.related = anniversaryRelated(content.anniversary?.related_person_ids, siteUrl, content.person.id);
  }
  if (content.type === "council" || content.type === "schism") {
    extras.related = anniversaryRelated(content.anniversary.related_person_ids, siteUrl);
  }
  if (content.type === "quote") {
    extras.father = fatherExtras(content.person, siteUrl);
  }
  return extras;
}

export function fatherExtras(person: Person, siteUrl: string) {
  const primary = person.citations?.find((c) => c.kind === "primary")?.source;
  const rawChain = chainTo(person.id, "jesus-of-nazareth", "all");
  const chain: EmailChainStep[] = (rawChain ?? []).map(({ person: p, edge }) => ({
    id: p.id,
    name: p.name,
    born: p.born ?? null,
    died: p.died ?? null,
    image_url: absoluteImage(p.image_url, siteUrl),
    role: p.role,
    short_bio: p.short_bio,
    see: p.see ?? null,
    edge_type: edge?.type ?? null,
    edge_strength: edge?.strength ?? null,
  }));
  const work = person.works?.[0];
  return {
    url: `${siteUrl}/fathers/${person.id}`,
    primary_citation: primary,
    first_work: work
      ? {
          title: work.title,
          description: work.description ?? null,
          amazon_url:
            amazonUrl({ asin: work.amazon_asin }) ??
            amazonUrl({ query: work.amazon_query ?? `${work.title} ${person.name}` }),
        }
      : null,
    chain,
  };
}

function anniversaryRelated(
  ids: string[] | undefined,
  siteUrl: string,
  exclude?: string
): RelatedFigure[] {
  if (!ids) return [];
  return ids
    .filter((id) => id !== exclude)
    .map((id) => getPerson(id))
    .filter((p): p is Person => !!p)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      name: p.name,
      url: `${siteUrl}/fathers/${p.id}`,
      image_url: absoluteImage(p.image_url, siteUrl),
      born: p.born ?? null,
      died: p.died ?? null,
      short_bio: p.short_bio,
    }));
}

// Convenience for the email-preview page: render whatever type fires today.
export function pickAndExtras(date: Date, siteUrl: string): { content: Content; extras: EmailExtras } {
  const content = pickContent(date);
  return { content, extras: buildExtras(content, siteUrl) };
}

// For the email-preview page when ?id= overrides the picker — force a Father variant.
export function fatherContent(person: Person, date: Date): Content {
  return { type: "father", date: isoDate(date), person, reason: "rotation" };
}

export { getPeople };
