import type { Person, Quote } from "./schema";

function compact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clip(text: string, max: number): string {
  const normalized = compact(text);
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max - 3).trimEnd() + "...";
}

function shortFigureName(name: string): string {
  return name.split(" of ")[0];
}

export function quoteIssueTitle(quote: Quote, person: Pick<Person, "name">): string {
  const title = quote.title?.trim();
  if (title) return title;
  return `${shortFigureName(person.name)}: ${clip(quote.text, 72)}`;
}

export function quotePreviewText(quote: Quote, person: Pick<Person, "name">): string {
  return quote.context?.trim() || quote.impact?.trim() || `${clip(quote.text, 120)} - ${person.name}`;
}
