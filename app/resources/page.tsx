import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Fathers resources",
  description:
    "Free Church Fathers resources, study routes, reading shelves, calendars, and classroom-ready starting points from Patristic Lineage.",
};

const FREE_RESOURCES = [
  {
    title: "Beginner route",
    body: "A visual introduction to the relay from Jesus to the early Church Fathers, with evidence labels explained plainly.",
    href: "/start-here",
    label: "Start here",
  },
  {
    title: "Bishops and sees",
    body: "The apostolic-succession-proper view: bishops grouped by city, ordered chronologically.",
    href: "/bishops",
    label: "Open bishops",
  },
  {
    title: "Question guides",
    body: "Guided answers for Nicaea, apostolic succession, heresies, the first Fathers to read, and related searches.",
    href: "/questions",
    label: "Read guides",
  },
  {
    title: "Patristic calendar",
    body: "Daily feast days, council anniversaries, schism dates, era spotlights, and primary-source quote rotations.",
    href: "/calendar",
    label: "Open calendar",
  },
];

const STUDY_ROUTES = [
  {
    title: "For a one-evening overview",
    steps: ["Read Start here", "Open the Jesus to Irenaeus guide", "Finish with the bishops page"],
  },
  {
    title: "For a church class",
    steps: ["Start with the question guides", "Assign one Father or council", "Check evidence labels on every chain"],
  },
  {
    title: "For self-study",
    steps: ["Choose one era", "Pick a first book", "Trace the chain on a figure page"],
  },
];

export default function ResourcesPage() {
  return (
    <article className="max-w-6xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        Back to lineage
      </Link>

      <header className="grid lg:grid-cols-[1fr_340px] gap-8 mt-4 mb-12 items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mb-3">
            Public resources
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-ink leading-[1.02] max-w-3xl">
            Church Fathers resources for study and teaching
          </h1>
          <p className="text-lg text-ink/70 mt-4 max-w-2xl">
            Use the free lineage graph, calendar, question guides, and reading path here. Support
            helps maintain the same public pages, source trails, and visual explanations.
          </p>
        </div>

        <section className="rounded-md border border-ink/10 bg-ink/[0.025] p-5">
          <h2 className="font-serif text-2xl text-ink mb-3">Support the work</h2>
          <p className="text-sm text-ink/65 mb-4">
            The public graph stays free. Support pays for source checking, guide upkeep, image
            cleanup, and existing page maintenance.
          </p>
          <a
            href="https://www.buymeacoffee.com/lukebyrne"
            className="inline-block px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
          >
            Support Patristic Lineage
          </a>
        </section>
      </header>

      <section className="grid sm:grid-cols-2 gap-4 mb-12">
        {FREE_RESOURCES.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-md border border-ink/10 bg-ink/[0.025] p-5 hover:border-accent transition-colors"
          >
            <h2 className="font-serif text-2xl text-ink group-hover:text-accent mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-ink/65 mb-4">{item.body}</p>
            <span className="text-sm text-accent">{item.label}</span>
          </Link>
        ))}
      </section>

      <section className="mb-12 border-t border-ink/10 pt-8">
        <h2 className="font-serif text-3xl text-ink mb-5">Study routes</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {STUDY_ROUTES.map((route) => (
            <div key={route.title} className="rounded-md border border-ink/10 bg-parchment p-4">
              <h3 className="font-serif text-2xl text-ink mb-3">{route.title}</h3>
              <ol className="space-y-2 text-sm text-ink/65">
                {route.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-ink/12 bg-ink/[0.025] p-6 sm:p-7">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mb-3">
          Support and sponsorship
        </p>
        <h2 className="font-serif text-3xl text-ink mb-3">
          Want to help maintain this free project?
        </h2>
        <p className="text-ink/70 max-w-3xl mb-5">
          Support keeps the public research checked and readable. Sponsorships can focus on an
          existing page, source trail, or visual explanation that readers can inspect right away.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/study-packs"
            className="px-4 py-2 bg-ink text-parchment rounded hover:bg-accent transition-colors text-sm"
          >
            Support Patristic Lineage
          </Link>
          <Link
            href="/books"
            className="px-4 py-2 border border-ink/30 rounded hover:border-accent hover:text-accent transition-colors text-sm"
          >
            Recommended books
          </Link>
        </div>
      </section>
    </article>
  );
}
