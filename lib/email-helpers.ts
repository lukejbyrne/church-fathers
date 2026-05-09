// Helpers shared by the daily function, email preview page, and CLI preview.
// Build a Content object plus the EmailExtras needed to render it.

import { chainTo, getPerson, getPeople } from "./data";
import { pickContent, isoDate, type Content } from "./picker";
import { amazonUrl } from "./affiliate";
import { bookDisplayTitle, getBookForContent, type ResolvedBookRecommendation } from "./books";
import { getEraImage, getEventImage, type ContentImage } from "./images";
import { recommendedWorksForEra, recommendedWorksForPeople, recommendedWorksForPerson } from "./recommendations";
import type { EmailBook, EmailExtras, EmailChainStep, RelatedFigure, EmailImage } from "./email-template";
import type { Person } from "./schema";

// Email clients can't resolve site-relative URLs; always emit absolute.
function absoluteImage(url: string | null | undefined, siteUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return siteUrl.replace(/\/$/, "") + url;
  return url;
}

function emailImage(image: ContentImage | undefined, siteUrl: string): EmailImage | undefined {
  if (!image) return undefined;
  return {
    src: absoluteImage(image.src, siteUrl) ?? image.src,
    alt: image.alt,
    caption: image.caption,
    credit: image.credit,
    license: image.license,
    source_url: image.source_url,
    object_position: image.object_position,
  };
}

export function buildExtras(content: Content, siteUrl: string): EmailExtras {
  const extras: EmailExtras = {};
  const date = new Date(`${content.date}T00:00:00Z`);
  const book = getBookForContent(content, date);

  extras.book = book ? emailBook(book, siteUrl) : null;

  if (content.type === "father") {
    const p = content.person;
    extras.father = fatherExtras(p, siteUrl);
  }
  if (content.type === "heretic") {
    extras.father = fatherExtras(content.person, siteUrl);
    extras.related = anniversaryRelated(content.anniversary?.related_person_ids, siteUrl, content.person.id);
    extras.eventImage = emailImage(getEventImage(content.anniversary?.id), siteUrl);
    extras.recommendedWorks = recommendedWorksForPeople(anniversaryPeople(content.anniversary?.related_person_ids), 4);
  }
  if (content.type === "council" || content.type === "schism") {
    extras.related = anniversaryRelated(content.anniversary.related_person_ids, siteUrl);
    extras.eventImage = emailImage(getEventImage(content.anniversary.id), siteUrl);
    extras.recommendedWorks = recommendedWorksForPeople(anniversaryPeople(content.anniversary.related_person_ids), 4);
  }
  if (content.type === "era") {
    extras.eraImage = emailImage(getEraImage(content.era), siteUrl);
    extras.recommendedWorks = recommendedWorksForEra(content.era, 4);
  }
  if (content.type === "quote") {
    extras.father = fatherExtras(content.person, siteUrl);
    extras.recommendedWorks = recommendedWorksForPerson(content.person, 3);
  }
  return extras;
}

function emailBook(book: ResolvedBookRecommendation, siteUrl: string): EmailBook {
  const title = bookDisplayTitle(book);
  return {
    title,
    author: book.person.name,
    reason: book.reason,
    audience: book.audience,
    cover_image_url: absoluteImage(book.coverImageUrl, siteUrl),
    cover_alt: book.coverAlt ?? `Cover of ${title}`,
    amazon_url:
      amazonUrl({ asin: book.work.amazon_asin }) ??
      amazonUrl({ query: book.work.amazon_query ?? `${title} ${book.person.name}` }),
    read_url: book.work.ccel_url ?? null,
    person_url: `${siteUrl}/fathers/${book.person.id}`,
  };
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
  return anniversaryPeople(ids, exclude)
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

function anniversaryPeople(ids: string[] | undefined, exclude?: string): Person[] {
  if (!ids) return [];
  return ids
    .filter((id) => id !== exclude)
    .map((id) => getPerson(id))
    .filter((p): p is Person => !!p);
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
