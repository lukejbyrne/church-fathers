import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/tmp/cf-smoke";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});
page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));

async function shot(url, name) {
  console.log(`→ ${url}`);
  const resp = await page.goto(url, { waitUntil: "networkidle" });
  console.log(`  status: ${resp?.status()}`);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}

await shot("http://localhost:3000/", "01-home");
// Try clicking a node on the graph
const nodeCount = await page.locator("svg g.node").count();
console.log(`  nodes rendered: ${nodeCount}`);
const edgeCount = await page.locator("svg g.edges path").count();
console.log(`  edges rendered: ${edgeCount}`);
// Click a timeline bar to lock chain
const bar = page.locator('a[href*="/fathers/"]').nth(20);
if (await bar.count()) {
  await bar.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/02-locked.png`, fullPage: false });
  // Should still be on home page (locked, not navigated)
  console.log(`  url after click: ${page.url()}`);
  // Try condense
  const cond = page.locator('button:has-text("Condense")');
  if (await cond.count()) {
    await cond.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/03-condensed.png`, fullPage: false });
  }
}

await shot("http://localhost:3000/directory", "03-directory");
await page.fill("input", "polycarp");
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/04-directory-search.png`, fullPage: false });

await shot("http://localhost:3000/fathers/polycarp-of-smyrna", "05-polycarp");
await shot("http://localhost:3000/fathers/augustine-of-hippo", "06-augustine");
await shot("http://localhost:3000/fathers/jesus-of-nazareth", "07-jesus");

await browser.close();

if (errors.length) {
  console.log(`\n❌ ${errors.length} errors:`);
  errors.forEach((e) => console.log("  " + e));
  process.exit(1);
}
console.log("\n✓ no client errors. screenshots in", OUT);
