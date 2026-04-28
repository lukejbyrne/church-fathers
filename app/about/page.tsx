import Link from "next/link";
import { getPeople, getRelationships } from "@/lib/data";

export const metadata = { title: "Methodology — Church Fathers" };

export default function About() {
  const people = getPeople();
  const rels = getRelationships();
  const docCount = rels.filter((r) => r.strength === "documented").length;
  const tradCount = rels.filter((r) => r.strength === "tradition").length;
  const dispCount = rels.filter((r) => r.strength === "disputed").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-ink/80 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">← Lineage</Link>
      <h1 className="font-serif text-5xl mt-4 mb-6 text-ink">Methodology &amp; caveats</h1>

      <p className="mb-6">
        This site maps {people.length} figures from Jesus of Nazareth to John of Damascus
        ({rels.length} relationships) using a single rule: every link must be defensible from a
        cited source. The aim is to make the chain of teaching, correspondence, and acquaintance
        legible at a glance — without papering over the gaps in the record.
      </p>

      <h2 className="font-serif text-2xl mt-8 mb-3 text-ink">Strength tags</h2>
      <p className="mb-3">Each relationship carries one of three strengths:</p>
      <ul className="space-y-3 mb-6">
        <li>
          <strong className="text-ink">Documented ({docCount}).</strong> Solid line. A primary source from
          antiquity directly attests the relationship — either the person's own writing,
          a contemporary's, or a near-contemporary historian like Eusebius writing within ~150 years.
          Examples: Paul's epistles to Timothy; Cyprian's letters to Cornelius; Augustine on Ambrose
          in the <em>Confessions</em>; Irenaeus on his own boyhood listening to Polycarp.
        </li>
        <li>
          <strong className="text-ink">Tradition ({tradCount}).</strong> Dashed line. Attested only by a later
          source (Jerome's <em>De Viris Illustribus</em> writing centuries after, hagiographic Vitae,
          episcopal succession lists reconstructed by 4th-century historians). The link may well be
          true, but the chain of evidence is thinner. Most 1st- and 2nd-century Roman / Antiochene
          successions fall here.
        </li>
        <li>
          <strong className="text-ink">Disputed ({dispCount}).</strong> Dotted red. Modern scholarship contests
          or rejects the link. Currently this category is rare — the most prominent is Vincent of
          Lérins's <em>Commonitorium</em> as an attack on Augustine.
        </li>
      </ul>

      <h2 className="font-serif text-2xl mt-8 mb-3 text-ink">What's in, what's out</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Coverage: AD 0 – ~750. Ends with John of Damascus, the traditional final Father.</li>
        <li>
          Heterodox figures (Marcion, Valentinus, Arius, Nestorius, Pelagius, Severus of Antioch,
          etc.) are included where they were load-bearing for the orthodox story. Their bios flag
          the heterodoxy.
        </li>
        <li>Anonymous works (the Didache, the Epistle of Barnabas) appear as personless authors with stable ids.</li>
        <li>Churches / sees as entities are not nodes — only individuals.</li>
      </ul>

      <h2 className="font-serif text-2xl mt-8 mb-3 text-ink">Honest weak spots</h2>
      <ul className="list-disc pl-6 space-y-3 mb-6">
        <li>
          <strong>Aphrahat ↔ Ephrem the Syrian</strong> is tagged <em>tradition</em> with no primary
          citation. Aphrahat (the Persian Sage, d. ~345) and Ephrem (d. 373) wrote in the same Syriac
          milieu but neither cites the other in surviving works. The link rests on
          modern scholarly consensus (Murray, Brock) that they share theological vocabulary. Without
          this single edge, Aphrahat would be isolated from the rest of the graph. We've kept it
          flagged honestly rather than dropping it; readers should treat it as a contextual rather
          than evidentiary connection.
        </li>
        <li>
          <strong>Apostolic biographical dates</strong> (e.g. Andrew d. 60, Bartholomew d. 70,
          Thomas d. 72, Matthias d. 80) are tradition, not evidence. The New Testament gives no
          martyrdom dates for most apostles. Hovering reveals the precise dates we used; they should
          be read as central tendencies of later tradition, not hard facts.
        </li>
        <li>
          <strong>Episcopal succession lists</strong> for 1st-century Rome and Antioch were
          reconstructed by Irenaeus (Adv. Haer. 3.3) and Eusebius. They are tagged <em>tradition</em>;
          Hegesippus's notebooks, the source for some, are lost.
        </li>
        <li>
          <strong>Hippolytus of Rome</strong> may be two people, not one (Brent and Cerrato split
          the Roman presbyter from a Greek-writing easterner). We've kept a single entry with a
          note.
        </li>
      </ul>

      <h2 className="font-serif text-2xl mt-8 mb-3 text-ink">Sources we lean on</h2>
      <ul className="list-disc pl-6 space-y-1 mb-6">
        <li>Eusebius, <em>Historia Ecclesiastica</em></li>
        <li>Jerome, <em>De Viris Illustribus</em></li>
        <li>Irenaeus, <em>Adversus Haereses</em>; Letter to Florinus (in Eus. HE 5.20)</li>
        <li>Each Father's own letters and treatises (Paul, Cyprian, the Cappadocians, Augustine, etc.)</li>
        <li>Council acta (Nicaea, Ephesus, Chalcedon, Constantinople III)</li>
        <li>Reference: Quasten <em>Patrology</em>, ODCC, CCEL</li>
      </ul>

      <h2 className="font-serif text-2xl mt-8 mb-3 text-ink">Corrections</h2>
      <p>
        Each per-person page lists the citations for every claim. If you spot something wrong,
        the data is JSON in the repo — open an issue or a PR. We'd rather be corrected than wrong.
      </p>
    </div>
  );
}
