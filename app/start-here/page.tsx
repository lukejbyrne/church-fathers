import Link from "next/link";

export const metadata = {
  title: "Start here — Patristic Lineage",
  description:
    "What is this site, who are the Church Fathers, and what do all the terms mean. Plain English for beginners.",
};

export default function StartHere() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">← Lineage</Link>
      <h1 className="font-serif text-5xl mt-4 mb-3 text-ink">Start here</h1>
      <p className="text-ink/60 italic mb-8">
        New to all this? Read this once, then go play with the timeline.
      </p>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-3 text-ink">What is this site?</h2>
        <p className="mb-3">
          A map of the human chain that carried Christianity from Jesus to the early Middle Ages —
          AD 30 to 750. Each person on the timeline is a real historical figure. Each line between
          them is a relationship — they taught each other, wrote letters, were ordained by, met,
          opposed each other. Every claim is sourced.
        </p>
        <p className="mb-3">
          The point is to make a thing that's usually presented as a list of names feel like what it
          actually was: a relay race. People who knew each other, taught each other, argued with
          each other, sometimes died for what the previous person handed down.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-3 text-ink">Who are the Church Fathers?</h2>
        <p className="mb-3">
          The Church Fathers (in Latin, <em>Patres</em> — hence "patristic") are the major Christian
          theologians, bishops, and writers of roughly the first seven centuries. Catholic tradition
          requires four things to formally count as a Father: antiquity, holiness of life,
          orthodoxy of doctrine, and church approval. In practice the term is used more loosely.
        </p>
        <p className="mb-3">
          The patristic age is conventionally said to end with John of Damascus, who died around
          749. Before him, Christian theology was done by bishops in cities arguing with heretics.
          After him, it gets done by professors in universities arguing with each other. We end the
          site there.
        </p>
        <p className="mb-3">
          We also include figures who weren't orthodox — Arius, Nestorius, Marcion — because you
          can't tell the story of orthodoxy without the figures it defined itself against. We flag
          them clearly.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-3 text-ink">The eras at a glance</h2>
        <dl className="space-y-4">
          <div>
            <dt className="font-medium text-ink">Apostolic age (AD 30 – 100)</dt>
            <dd className="text-ink/70">Jesus, the Twelve, Paul. The New Testament is written.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Apostolic Fathers (100 – 150)</dt>
            <dd className="text-ink/70">
              The generation that personally knew the apostles or their immediate students.
              Polycarp, Ignatius, Clement of Rome.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Apologists & Ante-Nicene (150 – 325)</dt>
            <dd className="text-ink/70">
              Christianity defends itself in writing against pagans and heretics. Justin Martyr,
              Irenaeus, Tertullian, Origen, Cyprian. Persecutions throughout. Ends when Constantine
              calls the Council of Nicaea in 325.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Nicene & Post-Nicene (325 – 451)</dt>
            <dd className="text-ink/70">
              Christianity is now legal, then official. The great councils settle the Trinity (325,
              381) and Christology (431, 451). Athanasius, Ambrose, the Cappadocians, Augustine,
              Jerome, Chrysostom.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Late Patristic & Early Medieval (451 – 750)</dt>
            <dd className="text-ink/70">
              The Western Roman Empire collapses. Theology gets carried by monks and bishops.
              Gregory the Great, Maximus the Confessor, Bede, John of Damascus.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-3 text-ink">Words you'll see and what they mean</h2>
        <dl className="space-y-4">
          <div>
            <dt className="font-medium text-ink">Patristic</dt>
            <dd className="text-ink/70">
              "Of the Fathers." A patristic theologian is one of these early Fathers. The
              <em> patristic age</em> is the era of the Fathers.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">See</dt>
            <dd className="text-ink/70">
              The city a bishop is bishop of. "Bishop of Carthage" = the bishop whose see is
              Carthage. "The Roman see" = the bishopric of Rome.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Episcopal succession</dt>
            <dd className="text-ink/70">
              The chain of bishops in a single see. "Bishop A, then Bishop B, then Bishop C — each
              ordained by the previous." Catholic and Orthodox Christianity treat this as a
              guarantee of doctrinal continuity going back to the apostles.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Apostolic succession</dt>
            <dd className="text-ink/70">
              The bigger claim that bishops form an unbroken chain back to one of the apostles.
              Different from "transmission" in general (see below).
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Transmission (vs succession)</dt>
            <dd className="text-ink/70">
              Any way a teaching gets passed down — letters, citation, teacher → student, formal
              ordination, casual influence. <em>Succession</em> is one specific kind of transmission.
              On figure pages you can switch the chain to see only one type at a time.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Documented / tradition / disputed</dt>
            <dd className="text-ink/70">
              How strong the evidence is for a relationship. <strong>Documented</strong> = a primary
              source from antiquity attests it directly. <strong>Tradition</strong> = the link is
              attested only by later writers (Jerome's <em>De Viris</em>, hagiographies). <strong>Disputed</strong>{" "}
              = modern scholarship contests it. We mark every link with one of these three. Most
              popular Christian sites don't do this and you should be suspicious of ones that don't.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Primary source</dt>
            <dd className="text-ink/70">
              Something written by the person themselves or by a contemporary. Polycarp's letter to
              the Philippians is a primary source for Polycarp. Jerome writing about Polycarp 250
              years later is a secondary source.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Heresy / orthodoxy</dt>
            <dd className="text-ink/70">
              <em>Orthodoxy</em> is what the church eventually decided was the correct teaching;{" "}
              <em>heresy</em> is what got rejected. The boundary was usually drawn during a
              specific controversy: Arianism (the divinity of Christ), Pelagianism (sin and grace),
              Nestorianism (how Christ is one person), and so on. Most heresies are named after the
              person whose teaching defined them.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Council</dt>
            <dd className="text-ink/70">
              A formal meeting of bishops. <em>Ecumenical</em> means universal — the whole church.
              Seven ecumenical councils are recognised by Catholic, Orthodox, and most Protestant
              traditions: Nicaea I (325), Constantinople I (381), Ephesus (431), Chalcedon (451),
              Constantinople II (553), Constantinople III (680), Nicaea II (787). They set the
              creeds and rejected the major heresies.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Doctor of the Church</dt>
            <dd className="text-ink/70">
              Catholic title for a Father whose teaching is considered especially authoritative.
              The four original Western Doctors: Ambrose, Augustine, Jerome, Gregory the Great. Four
              original Eastern Doctors: Athanasius, Basil, Gregory of Nazianzus, John Chrysostom.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Anathema</dt>
            <dd className="text-ink/70">
              A formal curse / excommunication. Councils end with lists of anathematised positions —
              "if anyone says X, let him be anathema." That's how heresies got formally ruled out.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Anno Domini (AD)</dt>
            <dd className="text-ink/70">
              "In the year of the Lord." We use AD throughout because it's the convention the Fathers
              themselves used (well — Bede invented it). Same as "CE" if that's what you grew up on.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-3 text-ink">How to use this site</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Hover</strong> any name on the timeline to highlight their lineage temporarily.
          </li>
          <li>
            <strong>Click</strong> to lock the lineage. The chain to Jesus is then traceable across
            the centuries; everything else dims.
          </li>
          <li>
            <strong>Double-click</strong> to open the full page for that figure.
          </li>
          <li>
            On a figure page, the <strong>Chain to Jesus</strong> section lets you switch routes:
            all transmission (default), pedagogical only, episcopal succession only, or documented
            only. Same person, four different views of how their tradition reached them.
          </li>
          <li>
            On the network graph, hold <strong>⌘ / Ctrl + scroll</strong> to zoom; drag to pan.
            Buttons top-right do the same thing without the modifier.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-3 text-ink">Where to start reading</h2>
        <p className="mb-3">
          If you're going to read one Father this year, read{" "}
          <Link href="/fathers/athanasius-of-alexandria" className="underline hover:text-accent">
            Athanasius
          </Link>
          's <em>On the Incarnation</em>. It's about 100 pages. C.S. Lewis wrote the introduction
          for the standard edition specifically because he thought everyone should read it.
        </p>
        <p className="mb-3">
          If you want autobiography, read{" "}
          <Link href="/fathers/augustine-of-hippo" className="underline hover:text-accent">
            Augustine
          </Link>
          's <em>Confessions</em> in the Pine-Coffin Penguin translation. It's the founding text of
          spiritual autobiography in the West.
        </p>
        <p className="mb-3">
          If you want the early generation, read the Apostolic Fathers — Holmes' edition includes{" "}
          <Link href="/fathers/clement-of-rome" className="underline hover:text-accent">
            Clement
          </Link>
          ,{" "}
          <Link href="/fathers/ignatius-of-antioch" className="underline hover:text-accent">
            Ignatius
          </Link>
          ,{" "}
          <Link href="/fathers/polycarp-of-smyrna" className="underline hover:text-accent">
            Polycarp
          </Link>
          , and the Didache. About 300 pages of the second-century church in their own words.
        </p>
        <p>
          Each figure page has a <strong>Works</strong> section with the edition we'd recommend.
          Buying through those links supports the site.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-2xl mb-3 text-ink">A note on honesty</h2>
        <p className="mb-3">
          A lot of what people say about the early church is more confident than the evidence
          supports. We try to mark exactly how confident you should be about each link — and we{" "}
          <Link href="/about" className="underline hover:text-accent">
            spell out the methodology
          </Link>{" "}
          so you can disagree with our calls. The data is open, every claim is sourced, the JSON is
          on GitHub.
        </p>
        <p className="text-ink/60 italic text-sm">
          If you spot something wrong, tell us. Better to be corrected than wrong.
        </p>
      </section>

      <div className="flex gap-3 mt-12">
        <Link
          href="/"
          className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
        >
          See the lineage
        </Link>
        <Link
          href="/directory"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Browse all 192
        </Link>
        <Link
          href="/about"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Methodology
        </Link>
      </div>
    </article>
  );
}
