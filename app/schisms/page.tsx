import Link from "next/link";
import type { Metadata } from "next";
import { getPeople } from "@/lib/data";
import { dateRange } from "@/lib/dates";
import ShareBar from "@/components/ShareBar";
import BookShelf from "@/components/BookShelf";
import { getRecommendedBooks } from "@/lib/books";

export const metadata: Metadata = {
  title: "Schisms",
  description:
    "The unhealed and healed splits of the patristic age — Judaizers to the Great Schism. The arguments that didn't get resolved hardened into divisions, some still in effect 1,500 years later.",
};

type OutcomeKind = "resolved" | "persistent" | "ongoing";

type Schism = {
  slug: string;
  label: string;
  yearRange: [number, number];
  headline: string;
  parties: string[];
  decided: string;
  blurb: string;
  figures: string[];
  outcome: string;
  kind: OutcomeKind;
};

const SCHISMS: Schism[] = [
  {
    slug: "judaizers",
    label: "The Judaizing controversy",
    yearRange: [48, 70],
    headline: "Did gentile converts have to keep the Mosaic Law?",
    parties: ["Pauline Christianity", "Jewish-Christian conservatives"],
    decided:
      "Council of Jerusalem (c. AD 50) — Acts 15. Gentiles in without circumcision.",
    blurb:
      "The first Christian split decision. Without it, Christianity stays a Jewish sect.",
    figures: ["paul-of-tarsus", "peter-the-apostle", "james-the-just"],
    outcome: "resolved",
    kind: "resolved",
  },
  {
    slug: "marcionite",
    label: "Marcion and the rejection of the Old Testament",
    yearRange: [144, 200],
    headline:
      "Is the God of the Hebrew Bible the same as the Father of Jesus?",
    parties: ["Mainstream church", "Marcionites"],
    decided:
      "Marcion expelled from Roman church 144. Tertullian's Adversus Marcionem 207. The OT is canonical Christian scripture.",
    blurb:
      "Marcion taught two gods — the wrathful Demiurge of the OT vs. the loving Father of Jesus. The church drew the canon partly to refute him.",
    figures: [
      "marcion-of-sinope",
      "tertullian",
      "irenaeus-of-lyons",
      "polycarp-of-smyrna",
    ],
    outcome: "resolved",
    kind: "resolved",
  },
  {
    slug: "novatianist",
    label: "Novatianist schism",
    yearRange: [251, 600],
    headline:
      "Could the church readmit Christians who had lapsed under persecution?",
    parties: ["Catholic church (Cornelius)", "Novatianists (Novatian)"],
    decided:
      "Cornelius elected pope 251. Lapsed could be readmitted after penance. Novatian and his followers schismatic; movement persisted into the 6th c.",
    blurb:
      "Decian persecution forced the question of mercy vs. purity. Cornelius said mercy; Novatian said purity. Cyprian backed Cornelius.",
    figures: ["pope-cornelius", "novatian", "cyprian-of-carthage"],
    outcome: "schism (long-lived)",
    kind: "persistent",
  },
  {
    slug: "donatist",
    label: "Donatist schism",
    yearRange: [311, 411],
    headline: "Are sacraments valid when administered by lapsed clergy?",
    parties: ["Catholic church (Caecilian)", "Donatists"],
    decided:
      "Council of Carthage 411 (under Augustine's leadership) ruled definitively against Donatists. Sacraments valid ex opere operato regardless of minister's state.",
    blurb:
      "After Diocletian's persecution, North African Christians split over whether bishops who had handed over scriptures could ordain. Augustine spent decades fighting this.",
    figures: ["augustine-of-hippo", "constantine-the-great"],
    outcome: "resolved (formally) but bitter for centuries",
    kind: "persistent",
  },
  {
    slug: "arian",
    label: "Arian controversy",
    yearRange: [318, 381],
    headline: "Is the Son fully God or the highest creature?",
    parties: ["Nicene party", "Arians", "Semi-Arians"],
    decided:
      "Nicaea 325 (homoousios), Constantinople 381 (final settlement of Trinitarian doctrine).",
    blurb:
      "The defining theological war of the 4th century. Almost split the empire as well as the church. Athanasius spent 17 of his 45 years as bishop in exile for refusing to compromise.",
    figures: [
      "arius",
      "athanasius-of-alexandria",
      "constantine-the-great",
      "basil-of-caesarea",
      "gregory-of-nazianzus",
      "hilary-of-poitiers",
    ],
    outcome: "resolved (Nicene side wins)",
    kind: "resolved",
  },
  {
    slug: "meletian-antioch",
    label: "Meletian schism of Antioch",
    yearRange: [362, 415],
    headline:
      "Multiple bishops claiming the same see during the Arian aftermath.",
    parties: ["Meletians", "Eustathians", "Apollinarians", "Arians"],
    decided:
      "Healed gradually after Meletius's death; one bishop again under Alexander 415.",
    blurb:
      "At one point Antioch had four men each claiming to be its rightful bishop. The chaos shaped Cappadocian Trinitarian thought as Basil + Gregory worked to reconcile factions.",
    figures: [
      "basil-of-caesarea",
      "gregory-of-nazianzus",
      "john-chrysostom",
    ],
    outcome: "resolved",
    kind: "resolved",
  },
  {
    slug: "apollinarian",
    label: "Apollinarian controversy",
    yearRange: [360, 381],
    headline: "Did Christ have a human mind?",
    parties: ["Catholic church", "Apollinarians"],
    decided:
      "Constantinople 381 condemned Apollinaris's denial of Christ's human rational soul. 'What is not assumed is not healed' (Gregory of Nazianzus, Letter 101).",
    blurb:
      "Apollinaris taught the Logos replaced Christ's human mind. Gregory of Nazianzus's reply set the rule: full humanity for full salvation.",
    figures: [
      "apollinaris-of-laodicea",
      "gregory-of-nazianzus",
      "athanasius-of-alexandria",
    ],
    outcome: "resolved",
    kind: "resolved",
  },
  {
    slug: "nestorian",
    label: "Nestorian controversy",
    yearRange: [428, 451],
    headline:
      "Is Mary 'Mother of God' (Theotokos) or only 'Mother of Christ'?",
    parties: [
      "Cyril of Alexandria's party",
      "Nestorius and the Antiochenes",
    ],
    decided:
      "Ephesus 431 condemned Nestorius. Theotokos affirmed. Many Antiochene churches and Persian-Christian churches went with Nestorius — Church of the East persists today.",
    blurb:
      "About words, but really about how to talk about the union of God and man in one person. Echoes through every later Christological dispute.",
    figures: [
      "nestorius",
      "cyril-of-alexandria",
      "theodore-of-mopsuestia",
      "diodore-of-tarsus",
    ],
    outcome: "schism (Church of the East to this day)",
    kind: "ongoing",
  },
  {
    slug: "monophysite-chalcedon",
    label: "Chalcedonian / Monophysite schism",
    yearRange: [451, 600],
    headline:
      "Is Christ in two natures (divine + human) or one nature after the union?",
    parties: [
      "Chalcedonian (Catholic + Orthodox)",
      "Miaphysite (Coptic, Syriac, Armenian, Ethiopian)",
    ],
    decided:
      "Chalcedon 451 affirmed two natures in one person ('hypostatic union'). Egypt and Syria largely rejected Chalcedon — those churches persist as Oriental Orthodox today.",
    blurb:
      "The deepest, longest-running schism the patristic age produced. Modern ecumenical dialogue (Chambésy 1990) suggests the dispute was largely about language — but the structural split has held for 1,500 years.",
    figures: [
      "pope-leo-i",
      "cyril-of-alexandria",
      "eutyches",
      "severus-of-antioch",
      "dioscorus-of-alexandria",
    ],
    outcome: "schism (Oriental Orthodox to this day)",
    kind: "ongoing",
  },
  {
    slug: "acacian",
    label: "Acacian schism",
    yearRange: [484, 519],
    headline:
      "Could Constantinople be in communion with Rome while tolerating anti-Chalcedonians?",
    parties: ["Rome (Pope Felix III)", "Constantinople (Acacius)"],
    decided:
      "Healed under Pope Hormisdas 519. Constantinople signed the Formula of Hormisdas affirming papal primacy. First formal Rome–Constantinople schism.",
    blurb:
      "Eastern emperor Zeno's Henotikon tried to fudge Chalcedon to placate the East; Rome wouldn't have it. 35 years of broken communion. Sets the pattern.",
    figures: ["pope-leo-i"],
    outcome: "resolved",
    kind: "resolved",
  },
  {
    slug: "three-chapters",
    label: "Three Chapters controversy",
    yearRange: [543, 553],
    headline:
      "Should the church condemn three long-dead Antiochene theologians retroactively?",
    parties: ["Justinian's party", "Western (especially African) bishops"],
    decided:
      "Constantinople II (553) condemned Theodore of Mopsuestia, Theodoret of Cyrus's writings against Cyril, and Ibas's letter. Pope Vigilius bullied into agreement.",
    blurb:
      "Justinian tried to win back the miaphysites by condemning their old enemies. African bishops resisted. The Aquileian schism over this lasted to 698.",
    figures: ["theodore-of-mopsuestia", "theodoret-of-cyrus"],
    outcome: "resolved formally; western resentment lingered",
    kind: "persistent",
  },
  {
    slug: "monothelite",
    label: "Monothelite controversy",
    yearRange: [630, 681],
    headline: "Does Christ have one will or two?",
    parties: ["Imperial / monothelite", "Dyothelite (Maximus, Rome)"],
    decided:
      "Constantinople III (680–681) affirmed two wills, one personal subject. Maximus the Confessor died for this position before he was vindicated.",
    blurb:
      "Heraclius and Constans II promoted one will to win miaphysites back. Maximus the Confessor refused, was tortured, exiled, mutilated. The council vindicated him posthumously.",
    figures: ["maximus-the-confessor", "pope-martin-i"],
    outcome: "resolved",
    kind: "resolved",
  },
  {
    slug: "iconoclasm",
    label: "Iconoclasm",
    yearRange: [726, 843],
    headline: "Should Christians make and venerate icons?",
    parties: [
      "Iconoclasts (Byzantine emperors Leo III, Constantine V, etc.)",
      "Iconodules (John of Damascus, Theodore the Studite, Empress Irene, Empress Theodora)",
    ],
    decided:
      "Nicaea II (787) affirmed icon veneration. Final restoration 843 — 'Triumph of Orthodoxy' still celebrated annually in Eastern churches.",
    blurb:
      "John of Damascus, working at the court of a Muslim caliph, defended icons against Byzantine emperors who wanted them destroyed. The site closes here — John is the last Father.",
    figures: [
      "john-of-damascus",
      "leo-iii-isaurian",
      "germanus-of-constantinople",
    ],
    outcome: "resolved",
    kind: "resolved",
  },
  {
    slug: "photian",
    label: "Photian schism",
    yearRange: [863, 879],
    headline:
      "Filioque, papal primacy, and Slavic mission territory all at once.",
    parties: ["Pope Nicholas I + Pope Adrian II", "Patriarch Photius"],
    decided:
      "Healed under Pope John VIII 879–880, but the underlying tensions (filioque, papal claims, jurisdictional disputes) all flared again in 1054.",
    blurb:
      "Photius condemned the Western addition of 'and from the Son' to the creed and rejected papal claims to universal jurisdiction. After his time, all the issues remained.",
    figures: [],
    outcome: "resolved (briefly)",
    kind: "persistent",
  },
  {
    slug: "great-schism",
    label: "The Great Schism",
    yearRange: [1054, 1054],
    headline: "Rome and Constantinople formally excommunicate each other.",
    parties: [
      "Western (Catholic) church",
      "Eastern (Orthodox) churches",
    ],
    decided:
      "Mutual excommunications by Cardinal Humbert and Patriarch Cerularius in July 1054. The excommunications were formally lifted in 1965 — but the churches remain separated.",
    blurb:
      "The unhealed split that closes the patristic story. Filioque, papal primacy, unleavened bread, married clergy — most issues had patristic-era roots. The breach has lasted longer than the healed period preceding it.",
    figures: [],
    outcome: "schism (still in effect)",
    kind: "ongoing",
  },
];

const TIMELINE_MIN = 0;
const TIMELINE_MAX = 1100;
const TIMELINE_W = 100;

function pctFor(year: number) {
  return ((year - TIMELINE_MIN) / (TIMELINE_MAX - TIMELINE_MIN)) * TIMELINE_W;
}

const KIND_COLOR: Record<OutcomeKind, string> = {
  resolved: "#3a7a5e", // green
  persistent: "#b08940", // amber
  ongoing: "#8b1e2d", // accent red
};

const KIND_LABEL: Record<OutcomeKind, string> = {
  resolved: "Resolved",
  persistent: "Formally resolved, lingered",
  ongoing: "Still in effect today",
};

export default function SchismsPage() {
  const all = getPeople();
  const peopleById = new Map(all.map((p) => [p.id, p]));
  const ordered = [...SCHISMS].sort(
    (a, b) => a.yearRange[0] - b.yearRange[0]
  );
  const schismBooks = getRecommendedBooks({ eventSlug: "schisms", limit: 3 });

  return (
    <article className="max-w-5xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>
      <h1 className="font-serif text-5xl mt-4 mb-3 text-ink">Schisms</h1>
      <p className="text-ink/60 italic mb-8">
        The arguments that didn't end. Judaizers to 1054.
      </p>

      <section className="max-w-3xl mb-12 space-y-4">
        <p>
          The patristic age was decided by argument, and the arguments that
          didn't get resolved hardened into schisms. Some healed. Some are
          still holding the church apart 1,500 years later.
        </p>
        <p>
          Every council was a fight. Nicaea wasn't a calm theological seminar
          — it was a 4th-century empire trying to stop civil war over the
          status of the Son. Chalcedon split Egypt and Syria off from Rome
          and Constantinople, and that split has held longer than the period
          of unity that preceded it. Most of the schisms below were
          pastoral before they were dogmatic: who can be readmitted after
          apostasy, whose bishop is the real one, whose icon is acceptable.
          Theology came in to defend or attack the answer.
        </p>
        <p>
          What follows is every major split the first thousand years
          produced — through the Great Schism of 1054, where this site
          stops. Resolved schisms in green; "officially resolved but bitter
          for centuries" in amber; the ones still in force in red. For each
          you'll find the question, who decided what, and the figures whose
          names you'll meet repeatedly.
        </p>
        <p>
          We've included a few non-doctrinal schisms (Novatianist, Donatist,
          Meletian) because they shaped doctrine downstream. We've left out
          minor regional disputes that didn't outlive their bishops. The
          Great Schism is the closing case — by then the patristic age has
          ended and a different story has begun.
        </p>
      </section>

      <BookShelf
        books={schismBooks}
        title="Books for the arguments"
        blurb="A short shelf for the controversies behind this page: Gnosticism, Nicaea, Christology, and icons."
        moreHref="/books"
      />

      {/* Visual timeline */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl mb-1 text-ink">
          Fifteen schisms, AD 30 – 1100
        </h2>
        <p className="text-ink/55 text-sm mb-6">
          Each band's width is the years the schism was live. Color by
          outcome. Click any band to jump to its detail card.
        </p>
        <div className="relative border border-ink/10 rounded bg-parchment overflow-hidden">
          {/* AD year ruler */}
          <div className="relative h-6 border-b border-ink/10">
            {[0, 200, 400, 600, 800, 1000].map((y) => (
              <div
                key={y}
                className="absolute top-0 bottom-0 border-l border-ink/15"
                style={{ left: `${pctFor(y)}%` }}
              >
                <span className="absolute top-0.5 left-1 text-[10px] text-ink/55 tabular-nums">
                  AD {y}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 py-3 px-1">
            {ordered.map((s) => {
              const left = pctFor(s.yearRange[0]);
              const rawWidth = pctFor(s.yearRange[1]) - left;
              const width = Math.max(rawWidth, 0.6); // min visible width
              return (
                <a
                  key={s.slug}
                  href={`#${s.slug}`}
                  className="group relative block h-9"
                  style={{ marginLeft: `${left}%`, width: `${width}%` }}
                >
                  <div
                    className="absolute inset-0 rounded transition-all group-hover:brightness-95 group-hover:shadow-sm"
                    style={{
                      backgroundColor: KIND_COLOR[s.kind],
                      opacity: 0.18,
                    }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ backgroundColor: KIND_COLOR[s.kind] }}
                  />
                  <div className="relative z-10 px-3 h-full flex items-center justify-between gap-2 overflow-hidden">
                    <span className="font-serif text-sm text-ink truncate group-hover:text-accent">
                      {s.label}
                    </span>
                    <span className="text-[10px] tabular-nums text-ink/55 shrink-0">
                      {s.yearRange[0] === s.yearRange[1]
                        ? s.yearRange[0]
                        : `${s.yearRange[0]}–${s.yearRange[1]}`}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-ink/65">
          {(Object.keys(KIND_COLOR) as OutcomeKind[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: KIND_COLOR[k] }}
              />
              {KIND_LABEL[k]}
            </span>
          ))}
        </div>
      </section>

      {/* Detail cards */}
      <section className="space-y-8">
        {ordered.map((s) => {
          const figures = s.figures
            .map((id) => peopleById.get(id))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));
          const yearLabel =
            s.yearRange[0] === s.yearRange[1]
              ? `${s.yearRange[0]}`
              : `${s.yearRange[0]}–${s.yearRange[1]}`;
          return (
            <article
              key={s.slug}
              id={s.slug}
              className="border border-ink/10 rounded-lg bg-parchment p-6 scroll-mt-20"
              style={{ borderLeft: `4px solid ${KIND_COLOR[s.kind]}` }}
            >
              <div className="flex items-baseline gap-3 flex-wrap mb-1">
                <h3 className="font-serif text-2xl text-ink">{s.label}</h3>
                <span className="text-xs tabular-nums text-ink/55">
                  {yearLabel}
                </span>
                <span
                  className="ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    color: KIND_COLOR[s.kind],
                    backgroundColor: `${KIND_COLOR[s.kind]}1a`,
                  }}
                >
                  {s.outcome}
                </span>
              </div>
              <p className="font-serif text-lg text-ink/80 italic mb-4">
                {s.headline}
              </p>

              {/* Mini-axis */}
              <div className="relative h-1.5 bg-ink/8 rounded mb-5 overflow-hidden">
                <div
                  className="absolute inset-y-0 rounded"
                  style={{
                    left: `${pctFor(s.yearRange[0])}%`,
                    width: `${Math.max(
                      pctFor(s.yearRange[1]) - pctFor(s.yearRange[0]),
                      0.4
                    )}%`,
                    backgroundColor: KIND_COLOR[s.kind],
                    opacity: 0.7,
                  }}
                />
              </div>

              <p className="mb-4 leading-relaxed">{s.blurb}</p>

              <div className="grid sm:grid-cols-2 gap-5 mb-5 text-sm">
                <div className="border-l-2 border-ink/15 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink/45 mb-1">
                    Parties
                  </div>
                  <ul className="space-y-1 text-ink/80">
                    {s.parties.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="border-l-2 border-ink/15 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink/45 mb-1">
                    What was decided
                  </div>
                  <p className="text-ink/80">{s.decided}</p>
                </div>
              </div>

              {figures.length > 0 && (
                <div className="border-l-2 border-accent/30 pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink/45 mb-2">
                    Figures
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {figures.map((p) => (
                      <Link
                        key={p.id}
                        href={`/fathers/${p.id}`}
                        className="group flex flex-col items-center min-w-0 w-[78px]"
                      >
                        <span className="block w-12 h-12 rounded-full overflow-hidden bg-ink/5 border border-ink/15 group-hover:border-accent/60 transition">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image_url}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              style={{ objectPosition: "center 8%" }}
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center font-serif text-xs text-ink/40">
                              {p.name.charAt(0)}
                            </span>
                          )}
                        </span>
                        <span className="font-serif text-[10px] mt-1 leading-tight truncate w-full text-center text-ink/80 group-hover:text-accent">
                          {p.name.split(" of ")[0]}
                        </span>
                        <span className="text-[9px] text-ink/45 tabular-nums">
                          {dateRange(p).text}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Closing */}
      <section className="mt-16 max-w-3xl border-t border-ink/10 pt-8">
        <h2 className="font-serif text-2xl text-ink mb-3">After 1054</h2>
        <p className="mb-3">
          The Reformation, the English Reformation, and the modern
          denominational splits all sit downstream of the patristic
          settlement — and all of them are out of scope for this site,
          which closes with the patristic age. They aren't unimportant.
          They just belong to a different chapter.
        </p>
        <p>
          If your interest is in those, you'll need different resources —
          for now, this site closes at 1054 because that's when the
          church's first thousand years ends and a different story begins.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 mt-12 pt-8 border-t border-ink/10">
        <Link
          href="/"
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
        >
          See the full lineage
        </Link>
        <Link
          href="/eras"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Eras
        </Link>
        <Link
          href="/start-here"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Start here
        </Link>
      </div>

      <div className="mt-10">
        <ShareBar
          path="/schisms"
          title="Schisms of the Patristic Age — Patristic Lineage"
        />
      </div>
    </article>
  );
}
