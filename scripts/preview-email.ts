// Local email preview generator. Renders the daily email HTML for the current
// picker output (or a specific figure) to /tmp/patristic-email-preview.html
// and opens it in your default browser.
//
// Usage:
//   pnpm preview-email                                # today's pick (any content type)
//   pnpm preview-email basil-of-caesarea              # force a specific figure as Father
//   pnpm preview-email --date=2026-12-25              # a future date
//   pnpm preview-email --date=2026-08-28              # a feast day

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { getPeople, getPerson } from "../lib/data";
import { pickContent, isoDate, parseIsoDate } from "../lib/picker";
import { renderEmail } from "../lib/email-template";
import { buildExtras, fatherContent } from "../lib/email-helpers";
import type { Content } from "../lib/picker";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";

function findArg(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : undefined;
}

function describe(c: Content): string {
  switch (c.type) {
    case "father":
      return `${c.person.name} (${c.reason})`;
    case "council":
    case "schism":
      return `${c.anniversary.title} (${c.anniversary.year})`;
    case "heretic":
      return `${c.person.name} — ${c.anniversary?.title ?? "condemnation"}`;
    case "era":
      return `Era spotlight: ${c.era} (${c.figures.length} figures)`;
    case "quote":
      return `Quote — ${c.person.name}: ${c.quote.source}`;
  }
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const dateArg = findArg("date");
  const date = parseIsoDate(dateArg) ?? new Date();

  let content: Content;
  if (args[0]) {
    const person = getPerson(args[0]);
    if (!person) {
      console.error(`No figure with id "${args[0]}". Available ids:`);
      getPeople()
        .filter((p) => (p.significance ?? 0) >= 3)
        .forEach((p) => console.error(`  ${p.id}`));
      process.exit(1);
    }
    content = fatherContent(person, date);
  } else {
    content = pickContent(date);
  }

  const extras = buildExtras(content, SITE_URL);
  const { subject, html } = renderEmail(content, SITE_URL, extras);

  const outPath = path.join(os.tmpdir(), "patristic-email-preview.html");
  fs.writeFileSync(outPath, html, "utf8");

  console.log(`✓ Rendered:  ${describe(content)}`);
  console.log(`  Subject:   ${subject}`);
  console.log(`  Date:      ${isoDate(date)}`);
  console.log(`  Type:      ${content.type}`);
  console.log(`  Wrote:     ${outPath}`);

  try {
    const cmd =
      process.platform === "darwin"
        ? `open "${outPath}"`
        : process.platform === "win32"
          ? `start "" "${outPath}"`
          : `xdg-open "${outPath}"`;
    execSync(cmd);
  } catch {
    console.log("(Open manually — automatic browser open failed.)");
  }
}

main();
