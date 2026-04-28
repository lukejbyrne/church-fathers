// Display helpers for birth/death years.
// Many figures lack hard dates. Rather than show "?" we render a best-guess estimate
// derived from the available evidence, marked with an asterisk so readers know it's
// an estimate, with a hover tooltip explaining how it was derived.

import type { Person } from "./schema";

type DatedPerson = Pick<Person, "born" | "born_circa" | "died" | "died_circa">;

export type DateDisplay = {
  text: string; // what to render
  isEstimate: boolean; // whether to show the asterisk
  explanation: string; // hover tooltip text
};

const TYPICAL_LIFESPAN = 60; // years; rough patristic-era average for figures who reached adulthood

export function bornDisplay(p: DatedPerson): DateDisplay {
  if (p.born != null && !p.born_circa) {
    return { text: String(p.born), isEstimate: false, explanation: `${p.born} AD — attested by primary sources.` };
  }
  if (p.born != null && p.born_circa) {
    return {
      text: `c. ${p.born}`,
      isEstimate: false,
      explanation: `Approximate (born_circa = true). The best primary or scholarly estimate, accurate within a few years.`,
    };
  }
  // No born; estimate from died.
  if (p.died != null) {
    const est = p.died - TYPICAL_LIFESPAN;
    return {
      text: `c. ${est}*`,
      isEstimate: true,
      explanation: `Birth year unknown. Estimated as died (${p.died}) − ${TYPICAL_LIFESPAN} years, the typical adult lifespan in the patristic age. Treat as a placeholder, not a claim.`,
    };
  }
  return {
    text: "—",
    isEstimate: true,
    explanation: "Birth year unknown and no death year on record either. Genuinely no estimate available.",
  };
}

export function diedDisplay(p: DatedPerson): DateDisplay {
  if (p.died != null && !p.died_circa) {
    return { text: String(p.died), isEstimate: false, explanation: `${p.died} AD — attested by primary sources.` };
  }
  if (p.died != null && p.died_circa) {
    return {
      text: `c. ${p.died}`,
      isEstimate: false,
      explanation: `Approximate (died_circa = true). The best primary or scholarly estimate, accurate within a few years.`,
    };
  }
  if (p.born != null) {
    const est = p.born + TYPICAL_LIFESPAN;
    return {
      text: `c. ${est}*`,
      isEstimate: true,
      explanation: `Death year unknown. Estimated as born (${p.born}) + ${TYPICAL_LIFESPAN} years, the typical adult lifespan in the patristic age. Treat as a placeholder, not a claim.`,
    };
  }
  return {
    text: "—",
    isEstimate: true,
    explanation: "Death year unknown and no birth year on record either. Genuinely no estimate available.",
  };
}

// Combined renderer used in most places — returns the standard "born–died" line,
// plus an aria/title-suitable explanation if either is an estimate.
export function dateRange(p: DatedPerson): { text: string; explanation: string } {
  const b = bornDisplay(p);
  const d = diedDisplay(p);
  const text = `${b.text} – ${d.text}`;
  const parts: string[] = [];
  if (b.isEstimate) parts.push(`Born: ${b.explanation}`);
  if (d.isEstimate) parts.push(`Died: ${d.explanation}`);
  return {
    text,
    explanation: parts.join(" "),
  };
}
