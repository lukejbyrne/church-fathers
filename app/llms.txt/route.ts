import { getPeople, getRelationships } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";
  const people = getPeople();
  const rels = getRelationships();

  const major = people
    .filter((p) => p.significance >= 3)
    .sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999));

  const lines: string[] = [];
  lines.push("# Patristic Lineage");
  lines.push("");
  lines.push(
    "> A sourced visualization of the human chain from Jesus through the Apostles to the Church Fathers (AD 30 – 750). Every person and every relationship is backed by a primary-source citation (Eusebius, Irenaeus, Jerome, etc.) graded as documented, tradition, or disputed."
  );
  lines.push("");
  lines.push(`Total figures tracked: ${people.length}. Total relationships: ${rels.length}.`);
  lines.push("");
  lines.push("## Core pages");
  lines.push(`- [Lineage home](${base}/): interactive timeline + network graph of all figures.`);
  lines.push(`- [Map](${base}/map): geographic Mediterranean view with a year scrubber (AD 30–760) showing where figures were active across time.`);
  lines.push(`- [Bishops](${base}/bishops): bishops grouped by their see (Rome, Antioch, Alexandria, Jerusalem, Constantinople, etc.), ordered chronologically — the apostolic-succession-proper view of the dataset.`);
  lines.push(`- [Start here](${base}/start-here): plain-English introduction to the Fathers, the eras, and the terminology.`);
  lines.push(`- [Directory](${base}/directory): searchable index of every figure.`);
  lines.push(`- [Methodology](${base}/about): how relationships are sourced and graded; explains apostolic-succession-vs-transmission distinction.`);
  lines.push("");
  lines.push("## Eras");
  lines.push(`- [Apostolic age (5–100)](${base}/eras/apostolic): Jesus, the Twelve, Paul; the New Testament being written.`);
  lines.push(`- [Apostolic Fathers (100–150)](${base}/eras/apostolic-fathers): the generation that personally knew the apostles or their immediate students.`);
  lines.push(`- [Apologists (130–200)](${base}/eras/apologists): Christians defending the faith in writing to pagans and heretics.`);
  lines.push(`- [Ante-Nicene (200–325)](${base}/eras/ante-nicene): bishops define orthodoxy under persecution; ends with the Council of Nicaea.`);
  lines.push(`- [Nicene (325–451)](${base}/eras/nicene): the great councils — Nicaea, Constantinople, Ephesus, Chalcedon.`);
  lines.push(`- [Post-Nicene (451–600)](${base}/eras/post-nicene): Christology aftermath, monasticism, Augustine's legacy in the Latin west.`);
  lines.push(`- [Early Medieval (600–750)](${base}/eras/early-medieval): patristic learning carried by monasteries; closes with John of Damascus.`);
  lines.push(`- [Desert Fathers (250–500)](${base}/eras/desert-fathers): Egyptian and Syrian ascetic movement; overlaps Ante-Nicene through Post-Nicene.`);
  lines.push("");
  lines.push("## Data");
  lines.push(`- [People (JSON)](${base}/api/people.json): full structured data for all ${people.length} figures.`);
  lines.push(`- [Relationships (JSON)](${base}/api/relationships.json): all ${rels.length} edges with citations.`);
  lines.push(`- [Schema](${base}/about): definitions for fields and relationship types.`);
  lines.push("");
  lines.push("## Major figures");
  for (const p of major) {
    const dates = `${p.born ?? "?"}–${p.died ?? "?"}`;
    lines.push(`- [${p.name} (${dates})](${base}/fathers/${p.id}): ${p.short_bio}`);
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
