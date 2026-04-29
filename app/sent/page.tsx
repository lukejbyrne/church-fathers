import Link from "next/link";
import type { Metadata } from "next";
import { listSends } from "@/lib/send-log";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Past issues",
  description:
    "Every Patristic Lineage newsletter we've sent — date, content type, and the figure or council featured.",
};

const TYPE_LABEL: Record<string, string> = {
  father: "Father",
  council: "Council",
  schism: "Schism",
  heretic: "Heretic",
  era: "Era",
  quote: "Quote",
};

export default async function SentArchive() {
  const records = await listSends(60);

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 text-ink/85 leading-relaxed">
      <div className="mb-6">
        <Link href="/today" className="text-sm text-ink/60 hover:text-accent">
          ← Today
        </Link>
      </div>
      <h1 className="font-serif text-4xl mb-3 text-ink">Past issues</h1>
      <p className="text-ink/70 mb-8">
        The archive of every Patristic Lineage email we've sent. Each entry is deterministic and
        citable — pick a date, click through to the figure's page, and cross-reference the primary
        sources behind it.
      </p>

      {records.length === 0 ? (
        <div className="border border-ink/15 rounded p-6 text-ink/60 text-sm">
          No sends logged yet. The archive populates from the daily function.
        </div>
      ) : (
        <div className="border border-ink/15 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink/5">
              <tr>
                <th className="text-left px-4 py-2 font-serif font-normal text-ink/70">Date</th>
                <th className="text-left px-4 py-2 font-serif font-normal text-ink/70">Type</th>
                <th className="text-left px-4 py-2 font-serif font-normal text-ink/70">Title</th>
                <th className="text-left px-4 py-2 font-serif font-normal text-ink/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const link =
                  (r.type === "father" || r.type === "heretic" || r.type === "quote") && r.primary_id
                    ? `/fathers/${r.primary_id}`
                    : `/today?d=${r.date}`;
                return (
                  <tr key={r.date} className="border-t border-ink/10">
                    <td className="px-4 py-2 font-mono text-xs text-ink/70">{r.date}</td>
                    <td className="px-4 py-2 text-ink/65">{TYPE_LABEL[r.type] ?? r.type}</td>
                    <td className="px-4 py-2">
                      <Link href={link} className="hover:text-accent">
                        {r.title}
                      </Link>
                      {r.override ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-accent/80">override</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {r.status === "sent" ? (
                        <span className="text-green-700">✓ sent</span>
                      ) : (
                        <span className="text-red-700" title={r.error}>✗ failed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-xs text-ink/50 italic">
        Newest first. Storage: Netlify Blobs. Retention: indefinite.
      </p>
    </article>
  );
}
