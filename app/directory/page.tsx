import { getPeople } from "@/lib/data";
import DirectoryClient from "./DirectoryClient";
import { canonicalUrl } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Directory — Church Fathers",
  description: "All figures in the Patristic Lineage dataset, AD 30 to 750, searchable by name, see, or role.",
  alternates: { canonical: canonicalUrl("/directory") },
  openGraph: {
    title: "Directory — Church Fathers",
    description: "All figures in the Patristic Lineage dataset, AD 30 to 750, searchable by name, see, or role.",
    url: canonicalUrl("/directory"),
    type: "website",
  },
};

export default function DirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-2">Directory</h1>
      <p className="text-ink/60 mb-6">All {getPeople().length} figures, AD 30 – 750. Search by name, see, or role.</p>
      <DirectoryClient people={getPeople()} />
    </div>
  );
}
