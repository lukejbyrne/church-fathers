"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import type { Person } from "@/lib/schema";
import { dateRange } from "@/lib/dates";

export default function DirectoryClient({ people }: { people: Person[] }) {
  const [q, setQ] = useState("");
  const fuse = useMemo(
    () =>
      new Fuse(people, {
        keys: ["name", "alt_names", "see", "role", "tradition_status", "short_bio"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [people]
  );

  const results = q.trim() === "" ? people : fuse.search(q).map((r) => r.item);
  const sorted = [...results].sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999));

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Polycarp, Antioch, apologist…"
        className="w-full border border-ink/20 rounded px-3 py-2 mb-6 bg-parchment focus:outline-none focus:border-accent"
      />
      <table className="w-full text-sm">
        <thead className="text-ink/60 border-b border-ink/15">
          <tr>
            <th className="text-left py-2">Name</th>
            <th className="text-left py-2">Dates</th>
            <th className="text-left py-2">See / Region</th>
            <th className="text-left py-2">Role</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-b border-ink/5 hover:bg-ink/5">
              <td className="py-2">
                <Link href={`/fathers/${p.id}`} className="font-medium hover:text-accent">
                  {p.name}
                </Link>
              </td>
              <td className="py-2 text-ink/70" title={dateRange(p).explanation || undefined}>
                {dateRange(p).text}
              </td>
              <td className="py-2 text-ink/70">{p.see ?? p.region}</td>
              <td className="py-2 text-ink/70">{p.role.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
