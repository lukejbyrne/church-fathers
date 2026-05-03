import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { listAnalyticsEvents, summarizeAnalyticsEvents, type AnalyticsSummary } from "../lib/analytics";

type Args = {
  days: number;
  json: boolean;
  includeBots: boolean;
};

loadEnvFile(".env.local");
loadEnvFile(".env");

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const events = await listAnalyticsEvents(args.days);
  const summary = summarizeAnalyticsEvents(events, {
    days: args.days,
    includeBots: args.includeBots,
  });

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printSummary(summary, args.includeBots);
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = { days: 30, json: false, includeBots: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") args.json = true;
    else if (arg === "--include-bots") args.includeBots = true;
    else if (arg === "--days") {
      const value = Number(argv[i + 1]);
      if (Number.isFinite(value) && value > 0) args.days = Math.floor(value);
      i += 1;
    } else if (arg.startsWith("--days=")) {
      const value = Number(arg.slice("--days=".length));
      if (Number.isFinite(value) && value > 0) args.days = Math.floor(value);
    }
  }

  return args;
}

function printSummary(summary: AnalyticsSummary, includeBots: boolean): void {
  console.log(`Patristic Lineage stats - last ${summary.days} days`);
  console.log(`Generated: ${summary.generated_at}`);
  console.log("");
  console.log(`Pageviews: ${formatNumber(summary.pageviews)}`);
  console.log(`Visitors:  ${formatNumber(summary.visitors)}`);
  console.log(`Bots:      ${formatNumber(summary.bot_pageviews)} pageviews${includeBots ? " included" : " excluded"}`);
  console.log("");

  printRows("Top pages", summary.top_pages);
  printRows("Sources", summary.top_sources);
  printRows("Countries", summary.countries);
  printRows("Devices", summary.devices);
  printRows("Browsers", summary.browsers);
  printDaily(summary.daily);

  if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
    console.log("");
    console.log("No Netlify Blob credentials found.");
    console.log("Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN locally, or put them in .env.local.");
  }
}

function printRows(title: string, rows: Array<{ name: string; count: number }>): void {
  console.log(title);
  if (rows.length === 0) {
    console.log("  No data");
    console.log("");
    return;
  }

  const nameWidth = Math.min(Math.max(...rows.map((row) => row.name.length), 10), 44);
  for (const row of rows) {
    console.log(`  ${pad(row.name, nameWidth)}  ${formatNumber(row.count)}`);
  }
  console.log("");
}

function printDaily(rows: AnalyticsSummary["daily"]): void {
  console.log("Daily");
  for (const row of rows) {
    console.log(
      `  ${row.day}  ${pad(formatNumber(row.pageviews), 8, "left")} pageviews  ${pad(
        formatNumber(row.visitors),
        8,
        "left"
      )} visitors`
    );
  }
}

function pad(value: string, width: number, direction: "left" | "right" = "right"): string {
  if (value.length >= width) return value;
  return direction === "left" ? value.padStart(width) : value.padEnd(width);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

function loadEnvFile(file: string): void {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;

    const key = trimmed.slice(0, equals).trim();
    if (!key || process.env[key]) continue;

    const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}
