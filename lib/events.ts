import { getAnniversaries, getPerson } from "./data";
import type { Anniversary, Person } from "./schema";

export const EVENT_KIND_LABEL: Record<Anniversary["kind"], string> = {
  council: "Council",
  schism: "Schism",
  "heresy-condemnation": "Condemnation",
};

export const EVENT_KIND_DESCRIPTION: Record<Anniversary["kind"], string> = {
  council: "A council or settlement that changed the church's public teaching, discipline, or historical direction.",
  schism: "A break in communion where an unresolved argument became a visible division.",
  "heresy-condemnation": "A doctrinal line drawn against a teaching the church judged outside the apostolic faith.",
};

export function eventPath(event: Pick<Anniversary, "id">): string {
  return `/events/${event.id}`;
}

export function getEvent(id: string): Anniversary | undefined {
  return getAnniversaries().find((event) => event.id === id);
}

export function relatedPeople(event: Anniversary): Person[] {
  return (event.related_person_ids ?? [])
    .map((id) => getPerson(id))
    .filter((p): p is Person => Boolean(p));
}

export function eventSections(event: Anniversary): Array<{ title: string; body: string }> {
  return [
    ["What happened", event.what_happened],
    ["The argument", event.the_argument],
    ["What changed", event.what_changed],
    ["Why it matters", event.why_it_matters],
    ["Aftermath", event.aftermath],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([title, body]) => ({ title, body }));
}

export function eventTitle(event: Anniversary): string {
  return `${event.title} (${event.year})`;
}
