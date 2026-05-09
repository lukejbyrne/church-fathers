import { getAnniversaries } from "./data";
import type { Person } from "./schema";

export type PersonHighlight = {
  label: string;
  value: string;
  href?: string;
};

export function firstSentenceSafe(text: string | undefined, max = 180): string {
  if (!text) return "";
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z])/).reduce<string[]>((acc, sentence) => {
    const prev = acc[acc.length - 1];
    if (prev && /\b[A-Z]\.$/.test(prev)) acc[acc.length - 1] = `${prev} ${sentence}`;
    else acc.push(sentence);
    return acc;
  }, []);
  let out = parts[0] ?? text;
  if (out.length > max) out = `${out.slice(0, max - 1).trimEnd()}...`;
  return out;
}

export function personHighlights(person: Person): PersonHighlight[] {
  const highlights: PersonHighlight[] = [];
  const contribution = firstSentenceSafe(person.why_matters ?? person.short_bio, 190);
  if (contribution) {
    highlights.push({ label: "Main contribution", value: contribution });
  }

  const event = getAnniversaries()
    .filter((a) => a.related_person_ids?.includes(person.id))
    .sort((a, b) => a.year - b.year)[0];
  if (event) {
    highlights.push({
      label: "Event connection",
      value: `${event.title} (${event.year})`,
      href: `/events/${event.id}`,
    });
  }

  const firstWork = person.works?.[0];
  if (firstWork) {
    highlights.push({
      label: "Best first read",
      value: firstWork.title,
      href: `/fathers/${person.id}#works`,
    });
  }

  const primary = person.citations?.find((c) => c.kind === "primary");
  if (primary) {
    highlights.push({ label: "Primary source", value: primary.source });
  }

  return highlights.slice(0, 4);
}
