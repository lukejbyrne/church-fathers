import { amazonUrl } from "./affiliate";
import { getPeople } from "./data";
import { ERAS_DATA, inEra, sortKey } from "./eras";
import { eraSlugForStatus } from "./images";
import type { EraDef } from "./eras";
import type { Person, TraditionStatus, Work } from "./schema";

export type RecommendedWork = {
  personId: string;
  personName: string;
  title: string;
  year?: number;
  description?: string;
  readUrl?: string;
  editionUrl?: string;
};

function toRecommendation(person: Person, work: Work): RecommendedWork {
  return {
    personId: person.id,
    personName: person.name,
    title: work.title,
    year: work.year,
    description: work.description,
    readUrl: work.ccel_url,
    editionUrl:
      amazonUrl({ asin: work.amazon_asin }) ??
      amazonUrl({ query: work.amazon_query ?? `${work.title} ${person.name}` }) ??
      undefined,
  };
}

function dedupeWorks(works: RecommendedWork[], limit: number): RecommendedWork[] {
  const seen = new Set<string>();
  const out: RecommendedWork[] = [];
  for (const work of works) {
    const key = `${work.personId}:${work.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(work);
    if (out.length >= limit) break;
  }
  return out;
}

export function recommendedWorksForPerson(person: Person, limit = 3): RecommendedWork[] {
  return dedupeWorks((person.works ?? []).map((work) => toRecommendation(person, work)), limit);
}

export function recommendedWorksForPeople(people: Person[], limit = 4): RecommendedWork[] {
  const works = people.flatMap((person) =>
    (person.works ?? []).slice(0, 2).map((work) => toRecommendation(person, work))
  );
  return dedupeWorks(works, limit);
}

function eraReadingPeople(era: EraDef): Person[] {
  const all = getPeople();
  const direct = all.filter(
    (person) => era.statuses.includes(person.tradition_status) && (person.works?.length ?? 0) > 0
  );
  const desertAdditions =
    era.slug === "desert-fathers"
      ? all.filter((person) => ["athanasius-of-alexandria", "john-cassian"].includes(person.id))
      : [];
  const pool = direct.length > 0
    ? [...direct, ...desertAdditions]
    : all.filter((person) => inEra(person, era) && (person.works?.length ?? 0) > 0);

  return pool
    .sort((a, b) => {
      const aDirect = era.statuses.includes(a.tradition_status) ? 0 : 1;
      const bDirect = era.statuses.includes(b.tradition_status) ? 0 : 1;
      if (aDirect !== bDirect) return aDirect - bDirect;
      const sigDiff = (b.significance ?? 0) - (a.significance ?? 0);
      if (sigDiff !== 0) return sigDiff;
      return sortKey(a) - sortKey(b);
    });
}

export function recommendedWorksForEra(era: TraditionStatus, limit = 4): RecommendedWork[] {
  const slug = eraSlugForStatus(era);
  const def = ERAS_DATA[slug];
  if (!def) return [];
  if (slug === "apostolic") return [];
  if (slug === "desert-fathers") {
    const people = getPeople();
    const picks = [
      ["anthony-the-great", "Sayings of the Desert Fathers"],
      ["evagrius-ponticus", "Praktikos and Chapters on Prayer"],
      ["athanasius-of-alexandria", "Life of Antony"],
      ["john-cassian", "Conferences"],
    ];
    return dedupeWorks(
      picks.flatMap(([personId, title]) => {
        const person = people.find((p) => p.id === personId);
        const work = person?.works?.find((w) => w.title === title);
        return person && work ? [toRecommendation(person, work)] : [];
      }),
      limit
    );
  }
  return recommendedWorksForPeople(eraReadingPeople(def), limit);
}
