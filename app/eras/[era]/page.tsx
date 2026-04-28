import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPeople } from "@/lib/data";
import type { Person, TraditionStatus } from "@/lib/schema";
import { dateRange } from "@/lib/dates";

type EraSlug =
  | "apostolic"
  | "apostolic-fathers"
  | "apologists"
  | "ante-nicene"
  | "nicene"
  | "post-nicene"
  | "early-medieval"
  | "desert-fathers";

type EraDef = {
  slug: EraSlug;
  label: string;
  yearLabel: string;
  years: [number, number];
  filterYears: [number, number];
  statuses: TraditionStatus[];
  blurb: string;
  intro: string[];
  events: { year: string; text: string }[];
  decided: string[];
};

const ERAS: Record<EraSlug, EraDef> = {
  apostolic: {
    slug: "apostolic",
    label: "Apostolic age",
    yearLabel: "AD 5 – 100",
    years: [5, 100],
    filterYears: [5, 100],
    statuses: ["apostle", "apostolic-father"],
    blurb: "Jesus, the Twelve, Paul. The New Testament being written.",
    intro: [
      "This is the only generation that touched Jesus. Everyone after them is downstream. Within seventy years of the crucifixion, twelve Galileans and a Pharisee from Tarsus had pushed a Jewish messianic movement out of Jerusalem and into every major city of the empire — Antioch, Ephesus, Corinth, Rome, Alexandria. Most of them were dead by the end of it. Tradition counts eleven of the Twelve as martyrs.",
      "The dominant fact of the period is the destruction of Jerusalem in AD 70. Before it, Christianity is a sect inside Judaism arguing about the messiah; after it, the temple is gone, the Jewish-Christian church in Jerusalem scatters, and the centre of gravity moves north and west into the Greek-speaking diaspora. Paul has already done most of the work of making that transition theologically possible — circumcision is not required, gentiles are in, the law is fulfilled in Christ. The Council of Jerusalem (c. AD 50) settled it before the temple even fell.",
      "By the time John dies on Patmos around AD 95–100, the New Testament canon is largely written: four gospels, Acts, the Pauline corpus, the catholic epistles, Revelation. There is no central authority yet. Bishops are emerging but still indistinguishable from presbyters in most places. The faith is being carried by people who heard the apostles in person and are now teaching the next generation what they were told.",
    ],
    events: [
      { year: "c. 30", text: "Crucifixion of Jesus; Pentecost in Jerusalem." },
      { year: "c. 35", text: "Conversion of Paul on the road to Damascus." },
      { year: "c. 50", text: "Council of Jerusalem — gentiles admitted without circumcision." },
      { year: "64", text: "Neronian persecution in Rome; Peter and Paul traditionally martyred." },
      { year: "70", text: "Destruction of the Second Temple by Titus." },
      { year: "c. 95", text: "Domitianic persecution; John exiled to Patmos, writes Revelation." },
    ],
    decided: [
      "Gentiles join the church without becoming Jews first.",
      "The four canonical gospels and Pauline corpus take written form.",
      "A threefold ministry — bishop, presbyter, deacon — begins to crystallise.",
      "The Eucharist on the Lord's Day (Sunday) is the universal weekly act.",
    ],
  },

  "apostolic-fathers": {
    slug: "apostolic-fathers",
    label: "Apostolic Fathers",
    yearLabel: "AD 100 – 150",
    years: [100, 150],
    filterYears: [80, 160],
    statuses: ["apostolic-father"],
    blurb: "The generation that knew the apostles or their immediate students.",
    intro: [
      "The first Christians who weren't Christians by birth. The apostles were dead or dying when this generation was being formed; they grew up hearing about Jesus from people who'd touched him and heard him talk. None of them wrote a gospel. They wrote letters — to congregations in trouble, to bishops they'd never met, to the emperors who were starting to notice.",
      "Three names carry the weight of the period. Clement of Rome, writing to the Corinthians around AD 96, is already invoking apostolic authority to settle a leadership dispute — the first non-canonical Christian text we have. Ignatius of Antioch, on his way to martyrdom in Rome around 110, fires off seven letters that fix the shape of the church: one bishop per city, no Eucharist without him, hold the line on the real humanity and real divinity of Christ. Polycarp of Smyrna, taught by John himself, lives until 155 and becomes the bridge from the apostles to Irenaeus and the next century.",
      "By 150 AD, Christianity has shape: a single bishop per city, a fixed weekly Eucharist, an emerging canon, a refusal to sacrifice to the emperor. The Didache circulates as a manual for new churches. The Shepherd of Hermas circulates as devotional reading. The faith is no longer being made up; it is being passed on.",
    ],
    events: [
      { year: "c. 96", text: "Clement of Rome writes 1 Clement to the Corinthians." },
      { year: "c. 107", text: "Ignatius of Antioch martyred in Rome; writes seven letters en route." },
      { year: "c. 112", text: "Pliny the Younger writes to Trajan asking how to handle Christians in Bithynia." },
      { year: "c. 130", text: "Epistle of Barnabas; Didache circulating widely." },
      { year: "144", text: "Marcion expelled from the Roman church for rejecting the Old Testament." },
      { year: "155", text: "Polycarp of Smyrna martyred at age 86." },
    ],
    decided: [
      "Monepiscopacy: one bishop per city, presbyters and deacons under him.",
      "No Eucharist apart from the bishop or his delegate.",
      "Christ is fully God and fully man — Docetism rejected.",
      "The Old Testament is Christian scripture (against Marcion).",
    ],
  },

  apologists: {
    slug: "apologists",
    label: "Apologists",
    yearLabel: "AD 130 – 200",
    years: [130, 200],
    filterYears: [120, 220],
    statuses: ["apologist"],
    blurb: "Christians defending the faith in writing to pagans and heretics.",
    intro: [
      "Once Christianity got big enough that emperors and philosophers had to take notice, it had to learn to argue back. The Apologists are the first Christians to write for outsiders — addressing emperors directly, refuting pagan philosophy on its own terms, taking the gnostic and Marcionite heresies apart line by line.",
      "Justin Martyr is the prototype: a philosopher in a philosopher's cloak who walked into Rome, opened a school, and wrote two Apologies to Antoninus Pius arguing that Christianity is the true philosophy and Socrates was a Christian without knowing it. He was beheaded for his trouble around 165. Tatian, his student, wrote the Diatessaron — the four gospels woven into one narrative, the standard Syrian gospel for centuries. Athenagoras pleaded for tolerance. Theophilus of Antioch coined the word 'Trinity.'",
      "Late in the period Irenaeus of Lyon writes Against Heresies, the first systematic theology in Christian history. He had heard Polycarp as a boy; Polycarp had heard John. Irenaeus puts the apostolic-succession argument on the map: the gnostics have secret traditions, but the bishops have a public chain back to the apostles, and that's where you find the truth. The argument has run ever since.",
    ],
    events: [
      { year: "c. 144", text: "Marcion forms a parallel church in Rome; rejected by orthodox bishops." },
      { year: "c. 150", text: "Justin Martyr opens a Christian school in Rome." },
      { year: "c. 165", text: "Justin Martyr beheaded under Marcus Aurelius." },
      { year: "177", text: "Persecution at Lyon; martyrdom of Pothinus and the slave-girl Blandina." },
      { year: "c. 180", text: "Irenaeus writes Against Heresies." },
      { year: "c. 200", text: "Tertullian active in Carthage; first major Latin theologian." },
    ],
    decided: [
      "Christianity is publicly defensible philosophy, not a mystery cult.",
      "Apostolic succession of bishops is the test of authentic teaching (Irenaeus).",
      "Gnosticism — secret saving knowledge, evil creator — is heresy.",
      "The four-gospel canon is fixed (Irenaeus: 'four gospels, no more, no less').",
    ],
  },

  "ante-nicene": {
    slug: "ante-nicene",
    label: "Ante-Nicene",
    yearLabel: "AD 200 – 325",
    years: [200, 325],
    filterYears: [180, 330],
    statuses: ["ante-nicene", "apologist"],
    blurb: "Bishops define orthodoxy under persecution. Ends with the Council of Nicaea.",
    intro: [
      "The two centuries before Constantine are when Christianity stops being a fringe movement and becomes a durable institution. Three things drive the period: persecution, theological consolidation, and the rise of the great catechetical schools.",
      "Persecution comes in waves — Severus (202), Decius (250), Valerian (257), and finally the Great Persecution under Diocletian (303–311), the most systematic and bloody of all. Cyprian of Carthage is martyred in 258 wrestling with what to do with Christians who lapsed; the church almost splits over forgiveness. Origen of Alexandria, the most prolific theologian of antiquity, is tortured in the Decian persecution and dies of his injuries. Through it all the church grows.",
      "On the theological side, Tertullian invents Latin Christian vocabulary — Trinity, person, substance — out of legal Latin. Origen builds the first systematic biblical scholarship and the first speculative theology, both wildly ambitious and later partly condemned. By the time Constantine wins at the Milvian Bridge in 312 and legalises Christianity in 313, the church has bishops in every major city, an established creed shape, a Latin and a Greek theological tradition, and a brewing fight about whether the Son is fully God or a high creature. That fight breaks open in Alexandria in 318 and lands at Nicaea in 325.",
    ],
    events: [
      { year: "202", text: "Severan persecution; Perpetua and Felicity martyred at Carthage." },
      { year: "250", text: "Decian persecution; first empire-wide demand to sacrifice." },
      { year: "258", text: "Cyprian of Carthage martyred under Valerian." },
      { year: "303", text: "Diocletian launches the Great Persecution." },
      { year: "312", text: "Constantine wins at the Milvian Bridge." },
      { year: "313", text: "Edict of Milan: Christianity legalised." },
      { year: "325", text: "Council of Nicaea: Arius condemned; Nicene Creed drafted." },
    ],
    decided: [
      "Trinitarian and Christological vocabulary (persona, substantia, hypostasis) takes shape.",
      "Apostolic succession + rule of faith + scripture are the three-legged stool of orthodoxy.",
      "The Son is homoousios — of the same substance as the Father (Nicaea, against Arius).",
      "Easter date partially standardised at Nicaea.",
      "Lapsed Christians can be readmitted to communion after penance (against Novatianism).",
    ],
  },

  nicene: {
    slug: "nicene",
    label: "Nicene era",
    yearLabel: "AD 325 – 451",
    years: [325, 451],
    filterYears: [320, 460],
    statuses: ["nicene"],
    blurb: "The great councils — Nicaea, Constantinople, Ephesus, Chalcedon.",
    intro: [
      "The Nicene era is the century and a quarter when the church and the empire fuse, and the four ecumenical councils define what Christians are still arguing about today. By 380 Theodosius makes Nicene Christianity the official religion of the Roman empire. By 451 the council of Chalcedon has carved out the boundaries of orthodoxy on the Trinity and the person of Christ that Catholic, Orthodox, and most Protestant churches still hold.",
      "The fight after Nicaea is brutal. Arius is condemned, but Arianism doesn't die — it captures imperial favour for fifty years. Athanasius of Alexandria is exiled five times defending the homoousios. The Cappadocians — Basil the Great, Gregory of Nazianzus, Gregory of Nyssa — finally win the argument at Constantinople in 381 by clarifying that God is one ousia in three hypostases. The creed we say in church on Sunday comes from this council, not Nicaea.",
      "Then the fight moves to Christology. If Christ is fully God and fully man, how does that work? Nestorius says two persons; Cyril of Alexandria says one. Ephesus (431) goes to Cyril. Eutyches over-corrects and says one nature; Chalcedon (451) condemns him too and lands on 'one person in two natures, without confusion or division.' Meanwhile in the Latin west Augustine of Hippo writes the Confessions, the City of God, and the anti-Pelagian treatises, and effectively founds Western theology single-handed. Rome falls to Alaric in 410 while he's writing.",
    ],
    events: [
      { year: "325", text: "Council of Nicaea; Arius condemned." },
      { year: "337", text: "Death of Constantine; he is baptised on his deathbed." },
      { year: "381", text: "Council of Constantinople I; Trinity definitively defined." },
      { year: "410", text: "Sack of Rome by Alaric the Visigoth." },
      { year: "430", text: "Augustine of Hippo dies as Vandals besiege his city." },
      { year: "431", text: "Council of Ephesus; Nestorius condemned, Mary called Theotokos." },
      { year: "451", text: "Council of Chalcedon; one person in two natures." },
    ],
    decided: [
      "The Father, Son, and Holy Spirit are one God in three hypostases (Constantinople 381).",
      "Mary is Theotokos — God-bearer — not merely Christotokos (Ephesus 431).",
      "Christ is one person in two natures, divine and human, without confusion (Chalcedon 451).",
      "The Nicene-Constantinopolitan Creed is fixed as the universal creed.",
      "Pelagianism — that humans can take the first step toward God without grace — is condemned.",
    ],
  },

  "post-nicene": {
    slug: "post-nicene",
    label: "Post-Nicene",
    yearLabel: "AD 451 – 600",
    years: [451, 600],
    filterYears: [440, 620],
    statuses: ["post-nicene"],
    blurb: "Christology aftermath, the rise of monasticism, and Augustine's legacy.",
    intro: [
      "Chalcedon settled the doctrine but split the church. The Coptic, Ethiopian, Syriac, and Armenian churches reject Chalcedon as too Nestorian and go their own way — they are still going their own way fifteen centuries later. The Byzantine emperors spend the rest of the century trying and failing to reconcile them; Justinian's Three Chapters edict (544) and the Second Council of Constantinople (553) are the high-water mark of that effort.",
      "The bigger story is the collapse of the Western empire and the rise of the monasteries. Rome had already fallen to Alaric in 410. By the late 400s the western provinces are run by Goths, Vandals, and Franks. The bishops are now the only Roman institution still standing in the west — Leo the Great talks Attila the Hun out of sacking Rome in 452. Augustine's vast theological corpus is being sorted, copied, and transmitted by Cassiodorus and Boethius. Benedict of Nursia writes the Rule around 540 that will define western monasticism for the next millennium.",
      "In the east, the great age of liturgy and mysticism. Pseudo-Dionysius writes the Mystical Theology around 500. The hymns of Romanos the Melodist fill the Hagia Sophia. Justinian rebuilds the Hagia Sophia itself in 537, the largest church in Christendom for a thousand years. Gregory the Great closes the period — bishop of Rome 590–604, sends Augustine to evangelise the English, and is conventionally counted as the last Latin Father.",
    ],
    events: [
      { year: "452", text: "Pope Leo the Great meets Attila the Hun outside Rome; Attila turns back." },
      { year: "476", text: "Last western Roman emperor deposed; conventional fall of the Western empire." },
      { year: "c. 540", text: "Benedict of Nursia writes the Rule at Monte Cassino." },
      { year: "537", text: "Hagia Sophia consecrated by Justinian." },
      { year: "553", text: "Second Council of Constantinople; Three Chapters condemned." },
      { year: "590", text: "Gregory the Great elected pope." },
    ],
    decided: [
      "The Rule of Benedict becomes the norm of Western monasticism.",
      "Origenism is formally condemned (Constantinople II, 553).",
      "Latin theology consolidates around an Augustinian framework.",
      "Non-Chalcedonian churches (Coptic, Syriac, Armenian) separate permanently.",
    ],
  },

  "early-medieval": {
    slug: "early-medieval",
    label: "Early Medieval",
    yearLabel: "AD 600 – 750",
    years: [600, 750],
    filterYears: [580, 760],
    statuses: ["post-nicene"],
    blurb: "Patristic learning carried by monasteries. Closes with John of Damascus.",
    intro: [
      "Theology in this period is done in monasteries, not cities. The western half of the old empire is now a patchwork of Frankish, Anglo-Saxon, Visigothic, and Lombard kingdoms, and the bishops have either died, fled, or become petty kings. What survives of patristic learning survives because monks copy it. Cassiodorus had the right idea a century earlier; now it's policy. Bede in Northumbria writes the Ecclesiastical History of the English People in 731 with a library of two hundred volumes that monks shipped to him from Rome.",
      "The other big story is Islam. Muhammad dies in 632; within a century Arab armies have taken Syria, Palestine, Egypt, North Africa, and most of Spain. Three of the five great patriarchates — Antioch, Jerusalem, Alexandria — are now under a Muslim caliphate. The Christian intellectual centre of the east contracts to Constantinople. John of Damascus, the last Greek Father, writes from inside the caliphate as a civil servant of the Umayyads. He composes the first Christian engagement with Islam, defends icon veneration against the Byzantine emperors who want to ban it, and sums up the entire Greek patristic tradition in his Exposition of the Orthodox Faith.",
      "He dies around 749. The patristic age is conventionally said to end with him. After this, theology in the west becomes scholastic — done by monks then professors in cathedral schools and universities, with new tools (Aristotelian logic, dialectical method) and new questions. The relay race ends; the seminar begins.",
    ],
    events: [
      { year: "604", text: "Death of Gregory the Great; Augustine of Canterbury baptises the Kentish king." },
      { year: "632", text: "Death of Muhammad." },
      { year: "638", text: "Arab conquest of Jerusalem." },
      { year: "680", text: "Council of Constantinople III; Monothelitism condemned." },
      { year: "726", text: "Emperor Leo III launches Byzantine iconoclasm." },
      { year: "731", text: "Bede completes the Ecclesiastical History." },
      { year: "c. 749", text: "Death of John of Damascus — the last Father." },
    ],
    decided: [
      "Christ has two wills, divine and human, not one (Constantinople III, 680).",
      "Icon veneration is defended theologically (John of Damascus, On the Divine Images).",
      "The patristic age formally closes; scholasticism begins.",
      "Monastic copying becomes the lifeline of patristic learning in the west.",
    ],
  },

  "desert-fathers": {
    slug: "desert-fathers",
    label: "Desert Fathers",
    yearLabel: "AD 250 – 500",
    years: [250, 500],
    filterYears: [250, 520],
    statuses: ["desert-father"],
    blurb: "Egyptian and Syrian ascetic movement; overlaps Ante-Nicene through Post-Nicene.",
    intro: [
      "When persecution stopped, the radicals went to the desert. Once Constantine made Christianity legal in 313, dying for the faith was no longer an option. So thousands of Christians, mostly in Egypt and Syria, went out into the wilderness instead — to fast, pray, weep, fight demons, and try to live the gospel literally. They invented monasticism in the process.",
      "Anthony of Egypt is the prototype: a young man who heard 'sell what you have and give to the poor' read in church around 270 and walked into the Egyptian desert that afternoon. He stayed for sixty years. Athanasius wrote his Life around 360, and the book detonated across the empire — Augustine reads it in the Confessions and converts on the spot. Pachomius founds the first communal monastery (a koinonia) on the Nile around 320. Macarius the Great gathers a colony at Scetis. By 400 there are thousands of monks in the Egyptian desert alone.",
      "The Sayings of the Desert Fathers — the Apophthegmata Patrum — are the literature of the movement: short, dry, often funny stories about humility, anger, sex, food, and silence. Evagrius Ponticus systematises desert spirituality into the eight thoughts (later the seven deadly sins). John Cassian carries it west and writes the Conferences and Institutes for Latin readers; Benedict reads Cassian and builds the Rule on him. Every Western and Eastern monk after this point is a child of these people.",
    ],
    events: [
      { year: "c. 270", text: "Anthony of Egypt withdraws to the desert." },
      { year: "c. 320", text: "Pachomius founds the first cenobitic monastery on the Nile." },
      { year: "356", text: "Death of Anthony, aged about 105." },
      { year: "c. 360", text: "Athanasius writes the Life of Anthony." },
      { year: "c. 400", text: "Evagrius Ponticus dies in the Egyptian desert; systematic ascetic theology." },
      { year: "c. 420", text: "John Cassian writes the Conferences in Marseille." },
      { year: "c. 451", text: "Simeon Stylites on his pillar in Syria; pillar-saints proliferate." },
    ],
    decided: [
      "Asceticism becomes the new martyrdom — the highest form of Christian life.",
      "Monasticism splits into eremitic (solitary) and cenobitic (communal) forms.",
      "The eight thoughts / seven deadly sins schema is established (Evagrius, Cassian).",
      "Spiritual fatherhood — the staretz / abba relationship — becomes a core institution.",
    ],
  },
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(ERAS).map((era) => ({ era }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ era: string }>;
}): Promise<Metadata> {
  const { era: slug } = await params;
  const era = ERAS[slug as EraSlug];
  if (!era) return { title: "Era not found" };
  return {
    title: `${era.label} (${era.yearLabel})`,
    description: era.blurb,
  };
}

function inEra(p: Person, era: EraDef): boolean {
  if (era.statuses.includes(p.tradition_status)) return true;
  const y = p.born ?? p.died;
  if (y == null) return false;
  return y >= era.filterYears[0] && y <= era.filterYears[1];
}

function sortKey(p: Person): number {
  return p.born ?? p.died ?? 9999;
}

function FigureCard({ p }: { p: Person }) {
  const dr = dateRange(p);
  return (
    <Link
      href={`/fathers/${p.id}`}
      className="group block border border-ink/10 rounded-md bg-parchment hover:border-accent/60 hover:shadow-sm transition overflow-hidden"
    >
      <div className="aspect-[4/5] bg-ink/5 overflow-hidden">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink/30 font-serif text-3xl">
            {p.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <div className="font-serif text-base text-ink group-hover:text-accent leading-tight">
          {p.name}
        </div>
        <div className="text-[11px] text-ink/55 mt-0.5" title={dr.explanation}>
          {dr.text}
        </div>
      </div>
    </Link>
  );
}

export default async function EraPage({
  params,
}: {
  params: Promise<{ era: string }>;
}) {
  const { era: slug } = await params;
  const era = ERAS[slug as EraSlug];
  if (!era) notFound();

  const all = getPeople();
  const figures = all
    .filter((p) => inEra(p, era))
    .sort((a, b) => {
      const sigDiff = (b.significance ?? 0) - (a.significance ?? 0);
      if (sigDiff !== 0) return sigDiff;
      return sortKey(a) - sortKey(b);
    });

  // For grid: top by significance. For "read further": works of top figures.
  const headline = figures.slice(0, 12);
  const withWorks = figures.filter((p) => (p.works?.length ?? 0) > 0).slice(0, 2);

  return (
    <article className="max-w-5xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>
      <h1 className="font-serif text-5xl mt-4 mb-1 text-ink">{era.label}</h1>
      <p className="text-ink/55 italic mb-8">{era.yearLabel}</p>

      <div className="grid lg:grid-cols-[1fr,260px] gap-10 mb-12">
        <section>
          {era.intro.map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
        </section>

        <aside className="lg:border-l lg:border-ink/10 lg:pl-6">
          <h2 className="font-serif text-lg text-ink mb-3">Key events</h2>
          <ul className="space-y-2 text-sm">
            {era.events.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-ink/50 tabular-nums shrink-0 w-14">{e.year}</span>
                <span className="text-ink/80">{e.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {headline.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-ink mb-1">Major figures</h2>
          <p className="text-ink/55 text-sm mb-5">
            {figures.length} figure{figures.length === 1 ? "" : "s"} placed in this era. Showing the
            most prominent.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {headline.map((p) => (
              <FigureCard key={p.id} p={p} />
            ))}
          </div>
          {figures.length > headline.length && (
            <p className="text-sm text-ink/55 mt-4">
              Plus {figures.length - headline.length} more —{" "}
              <Link href="/directory" className="underline hover:text-accent">
                see the full directory
              </Link>
              .
            </p>
          )}
        </section>
      )}

      <section className="mb-12">
        <h2 className="font-serif text-2xl text-ink mb-3">What was decided</h2>
        <ul className="list-disc pl-6 space-y-2 text-ink/80">
          {era.decided.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </section>

      {withWorks.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-ink mb-3">Read further</h2>
          <ul className="space-y-3 text-ink/80">
            {withWorks.map((p) => {
              const w = p.works![0];
              return (
                <li key={p.id}>
                  <Link href={`/fathers/${p.id}`} className="font-serif text-lg hover:text-accent">
                    {p.name}
                  </Link>
                  <span className="text-ink/55"> — </span>
                  <em>{w.title}</em>
                  {w.description ? (
                    <span className="text-ink/65">. {w.description}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3 mt-12 pt-8 border-t border-ink/10">
        <Link
          href="/"
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
        >
          See the full lineage
        </Link>
        <Link
          href="/start-here"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Start here
        </Link>
        <Link
          href="/directory"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Browse all figures
        </Link>
      </div>
    </article>
  );
}
