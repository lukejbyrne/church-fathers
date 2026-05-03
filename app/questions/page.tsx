import Link from "next/link";
import { questionPages } from "@/lib/questions";

export const metadata = {
  title: "Questions about the early Church",
  description:
    "Guided, sourced answers to common questions about the Church Fathers, apostolic succession, Nicaea, heresies, and early Christian tradition.",
};

export default function QuestionsPage() {
  return (
    <article className="max-w-5xl mx-auto px-4 py-12 text-ink/85">
      <Link href="/" className="text-sm text-ink/60 hover:text-accent">
        ← Lineage
      </Link>
      <header className="max-w-3xl mt-4 mb-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mb-3">
          Guided answers
        </p>
        <h1 className="font-serif text-5xl mb-4 text-ink leading-tight">
          Questions about the early Church
        </h1>
        <p className="text-lg text-ink/70 leading-relaxed">
          Start with the questions people actually ask, then follow the named Fathers,
          evidence labels, and relationships behind each answer.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {questionPages.map((page) => (
          <Link
            key={page.slug}
            href={`/questions/${page.slug}`}
            className="group rounded-md border border-ink/10 bg-ink/[0.025] p-5 hover:border-accent transition-colors"
          >
            <h2 className="font-serif text-2xl text-ink group-hover:text-accent leading-tight">
              {page.title}
            </h2>
            <p className="text-sm text-ink/65 mt-2 leading-relaxed">{page.description}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}
