import Link from "next/link";
import { getPeople, getPerson, getRelationships } from "@/lib/data";
import { dateRange } from "@/lib/dates";

export const metadata = {
  title: "Start here",
  description:
    "A visual beginner guide to Patristic Lineage: the relay from Jesus to the Church Fathers, evidence labels, eras, and first routes to click.",
};

const RELAY = [
  {
    id: "jesus-of-nazareth",
    display: "Jesus",
    label: "Source",
    note: "Jesus and the apostles",
  },
  {
    id: "john-the-apostle",
    display: "John",
    label: "Apostle",
    note: "Witness and teacher",
  },
  {
    id: "polycarp-of-smyrna",
    display: "Polycarp",
    label: "Bridge",
    note: "John to Irenaeus",
  },
  {
    id: "irenaeus-of-lyons",
    display: "Irenaeus",
    label: "Tradition",
    note: "Public chain argument",
  },
  {
    id: "athanasius-of-alexandria",
    display: "Athanasius",
    label: "Nicaea",
    note: "Defends Christ's divinity",
  },
  {
    id: "augustine-of-hippo",
    display: "Augustine",
    label: "West",
    note: "Grace, memory, desire",
  },
  {
    id: "john-of-damascus",
    display: "John of Damascus",
    label: "End point",
    note: "Late patristic synthesis",
  },
];

const ROUTES = [
  {
    eyebrow: "I want the big picture",
    title: "See the whole relay",
    body: "Start with the timeline. Click a name and watch the chain light up.",
    href: "/",
  },
  {
    eyebrow: "I want proof",
    title: "Jesus to Irenaeus",
    body: "The clearest short chain: Jesus, John, Polycarp, Irenaeus.",
    href: "/questions/shortest-chain-from-jesus-to-irenaeus",
  },
  {
    eyebrow: "I have a question",
    title: "Guided answers",
    body: "Nicaea, succession, bishops, heresies, first Fathers to read.",
    href: "/questions",
  },
  {
    eyebrow: "I want the strict version",
    title: "Bishop succession",
    body: "Only bishops, grouped by see, ordered by date.",
    href: "/bishops",
  },
];

const EVIDENCE = [
  {
    label: "Documented",
    className: "border-green-900/25 bg-green-900/10 text-green-950",
    body: "Ancient source directly attests the link.",
  },
  {
    label: "Tradition",
    className: "border-yellow-900/25 bg-yellow-900/10 text-yellow-950",
    body: "Later ancient or medieval source preserves it.",
  },
  {
    label: "Disputed",
    className: "border-accent/25 bg-accent/10 text-accent",
    body: "The claim exists, but scholarship contests it.",
  },
];

const ERAS = [
  {
    href: "/eras/apostolic",
    years: "AD 30-100",
    title: "Apostolic age",
    body: "Jesus, the Twelve, Paul. The New Testament is written.",
  },
  {
    href: "/eras/apostolic-fathers",
    years: "100-150",
    title: "Apostolic Fathers",
    body: "Clement, Ignatius, Polycarp. The generation just after the apostles.",
  },
  {
    href: "/eras/ante-nicene",
    years: "150-325",
    title: "Before Nicaea",
    body: "Apologists, martyrs, bishops, heresy fights, and persecution.",
  },
  {
    href: "/eras/nicene",
    years: "325-451",
    title: "Council age",
    body: "Nicaea, Constantinople, Ephesus, Chalcedon. Trinity and Christology.",
  },
  {
    href: "/eras/post-nicene",
    years: "451-600",
    title: "After Chalcedon",
    body: "Augustine's legacy, monastic learning, Christology aftermath.",
  },
  {
    href: "/eras/early-medieval",
    years: "600-750",
    title: "Early medieval",
    body: "Bede, Maximus, John of Damascus. The patristic age closes.",
  },
];

const TERMS = [
  {
    term: "Father",
    meaning: "An early Christian teacher, bishop, or writer whose work shaped doctrine.",
  },
  {
    term: "See",
    meaning: "The city a bishop serves. Rome, Antioch, Alexandria, Carthage.",
  },
  {
    term: "Transmission",
    meaning: "Any link that passes teaching along: taught, cited, wrote, met, ordained.",
  },
  {
    term: "Succession",
    meaning: "The stricter bishop-to-bishop chain, especially in Catholic and Orthodox usage.",
  },
  {
    term: "Heresy",
    meaning: "A teaching the church eventually rejected during a controversy.",
  },
  {
    term: "Council",
    meaning: "A formal meeting of bishops that defines, clarifies, or condemns doctrine.",
  },
];

const FIRST_STEPS = [
  "Click Polycarp and look for the Chain to Jesus block.",
  "Switch the chain to documented only.",
  "Open the Nicaea question page.",
  "Browse one era instead of all 206 people.",
];

const READ_FIRST = [
  {
    title: "Earliest voices",
    href: "/questions/what-did-the-apostolic-fathers-believe",
    body: "Clement, Ignatius, Polycarp, the Didache.",
  },
  {
    title: "Best first book",
    href: "/fathers/athanasius-of-alexandria",
    body: "Athanasius, On the Incarnation.",
  },
  {
    title: "Most personal",
    href: "/fathers/augustine-of-hippo",
    body: "Augustine, Confessions.",
  },
];

export default function StartHere() {
  const totalPeople = getPeople().length;
  const totalRelationships = getRelationships().length;
  const relayPeople = RELAY.map((step) => ({
    ...step,
    person: getPerson(step.id),
  })).filter((step) => step.person);

  return (
    <article className="max-w-6xl mx-auto px-4 py-12 text-ink/85">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>

      <header className="grid lg:grid-cols-[1fr_360px] gap-8 items-end mt-4 mb-12">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mb-3">
            Beginner map
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-ink leading-[1.02] max-w-3xl">
            Start with the relay, not the textbook
          </h1>
          <p className="text-lg text-ink/70 mt-4 max-w-2xl leading-relaxed">
            This site shows how Christianity was handed down from Jesus to the early
            Church Fathers. People are dots. Relationships are lines. Every line has
            an evidence label.
          </p>
        </div>

        <section className="rounded-md border border-ink/10 bg-ink/[0.025] p-5">
          <h2 className="font-serif text-2xl text-ink mb-4">What you are looking at</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-serif text-3xl text-ink">{totalPeople}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink/45">People</div>
            </div>
            <div>
              <div className="font-serif text-3xl text-ink">{totalRelationships}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink/45">Links</div>
            </div>
            <div>
              <div className="font-serif text-3xl text-ink">720</div>
              <div className="text-[10px] uppercase tracking-wider text-ink/45">Years</div>
            </div>
          </div>
          <p className="text-sm text-ink/65 mt-4">
            It is not a list of famous names. It is a transmission graph.
          </p>
        </section>
      </header>

      <section className="mb-14">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-serif text-3xl text-ink">The story in one line</h2>
            <p className="text-sm text-ink/60 mt-1">
              A few anchor figures. The full site has the rest.
            </p>
          </div>
          <Link href="/" className="hidden sm:inline text-sm text-ink/60 hover:text-accent">
            Open full timeline →
          </Link>
        </div>

        <div className="-mx-4 sm:mx-0 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ol className="flex lg:grid lg:grid-cols-7 min-w-[900px] lg:min-w-0 gap-3 px-4 sm:px-0">
            {relayPeople.map(({ person, display, label, note }, index) => {
              if (!person) return null;
              return (
                <li key={person.id} className="relative flex-1 min-w-0">
                  {index > 0 && (
                    <span
                      aria-hidden
                      className="absolute top-12 -left-3 w-3 border-t border-ink/25"
                    />
                  )}
                  <Link
                    href={`/fathers/${person.id}`}
                    className="group block h-full rounded-md border border-ink/10 bg-ink/[0.025] p-3 hover:border-accent transition-colors"
                  >
                    <span className="flex flex-col items-center text-center gap-2">
                      <span className="block w-14 h-14 rounded-full overflow-hidden bg-ink/10 border border-ink/15 shrink-0">
                        {person.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={person.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ objectPosition: "center 8%" }}
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center font-serif text-xl text-ink/40">
                            {person.name.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-ink/45">
                          {label}
                        </span>
                        <span className="block font-serif text-lg leading-tight text-ink group-hover:text-accent">
                          {display}
                        </span>
                        <span className="block text-[11px] text-ink/50 tabular-nums">
                          {dateRange(person).text}
                        </span>
                      </span>
                    </span>
                    <span className="block text-xs text-ink/60 mt-3 leading-snug">{note}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-3xl text-ink mb-5">Pick what you need</h2>
        <div className="grid md:grid-cols-4 gap-3">
          {ROUTES.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="group rounded-md border border-ink/10 bg-ink/[0.025] p-4 hover:border-accent transition-colors"
            >
              <span className="block text-[10px] uppercase tracking-wider text-ink/45 mb-2">
                {route.eyebrow}
              </span>
              <span className="block font-serif text-2xl leading-tight text-ink group-hover:text-accent">
                {route.title}
              </span>
              <span className="block text-sm text-ink/65 mt-3 leading-snug">{route.body}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-14 grid lg:grid-cols-[320px_1fr] gap-8">
        <div>
          <h2 className="font-serif text-3xl text-ink">How to trust a line</h2>
          <p className="text-sm text-ink/65 mt-2">
            The evidence label is the most important feature. It tells you how hard
            the site is asking you to believe each relationship.
          </p>
          <Link href="/about" className="inline-block text-sm text-ink/60 hover:text-accent mt-4">
            Read the methodology →
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {EVIDENCE.map((item) => (
            <div key={item.label} className={`rounded-md border p-4 ${item.className}`}>
              <div className="text-[10px] uppercase tracking-wider mb-3">{item.label}</div>
              <p className="text-sm leading-snug">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-3xl text-ink mb-5">The eras at a glance</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ERAS.map((era) => (
            <Link
              key={era.href}
              href={era.href}
              className="group rounded-md border border-ink/10 bg-ink/[0.025] p-4 hover:border-accent transition-colors"
            >
              <span className="text-[10px] uppercase tracking-wider text-ink/45">{era.years}</span>
              <h3 className="font-serif text-2xl text-ink group-hover:text-accent mt-1">
                {era.title}
              </h3>
              <p className="text-sm text-ink/65 mt-2 leading-snug">{era.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-14 grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <h2 className="font-serif text-3xl text-ink mb-5">Six words you need</h2>
          <dl className="grid sm:grid-cols-2 gap-3">
            {TERMS.map((item) => (
              <div key={item.term} className="rounded-md border border-ink/10 bg-ink/[0.025] p-4">
                <dt className="font-serif text-xl text-ink">{item.term}</dt>
                <dd className="text-sm text-ink/65 mt-1 leading-snug">{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="rounded-md border border-ink/10 bg-ink/[0.025] p-5 self-start">
          <h2 className="font-serif text-2xl text-ink mb-4">First 10 minutes</h2>
          <ol className="space-y-3">
            {FIRST_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-ink/70">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-parchment text-xs">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <section className="mb-14">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <h2 className="font-serif text-3xl text-ink">If you want to read one thing</h2>
          <Link href="/books" className="text-sm text-ink/60 hover:text-accent">
            Full reading path →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {READ_FIRST.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-md border border-ink/10 bg-ink/[0.025] p-4 hover:border-accent transition-colors"
            >
              <h3 className="font-serif text-2xl text-ink group-hover:text-accent">{item.title}</h3>
              <p className="text-sm text-ink/65 mt-2">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12 border-t border-ink/10 pt-8">
        <details className="group">
          <summary className="cursor-pointer list-none font-serif text-2xl text-ink hover:text-accent">
            Longer explanation, if you want it
            <span className="text-sm font-sans text-ink/45 ml-2 group-open:hidden">open</span>
            <span className="hidden text-sm font-sans text-ink/45 ml-2 group-open:inline">close</span>
          </summary>
          <div className="mt-5 grid md:grid-cols-2 gap-6 text-sm text-ink/70 leading-relaxed">
            <div>
              <h3 className="font-serif text-xl text-ink mb-2">Who are the Fathers?</h3>
              <p>
                The Church Fathers are early Christian theologians, bishops, monks,
                apologists, and writers from roughly the first seven centuries. The
                site also includes disputed and heterodox figures because the story of
                orthodoxy only makes sense if you can see the arguments.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-xl text-ink mb-2">What is the site doing?</h3>
              <p>
                It turns names into relationships: who taught whom, who cited whom,
                who succeeded whom, who argued with whom. The goal is not just a list
                of saints or scholars, but a visible chain of transmission.
              </p>
            </div>
          </div>
        </details>
      </section>

      <div className="flex flex-wrap gap-3">
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
          Browse all {totalPeople}
        </Link>
        <Link
          href="/questions"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Guided questions
        </Link>
        <Link
          href="/books"
          className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
        >
          Recommended books
        </Link>
      </div>
    </article>
  );
}
