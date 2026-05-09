import { getPeople } from "@/lib/data";
import MapView from "@/components/MapView";
import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Map — geographic view across time",
  description:
    "A geographic map of early Christian figures (AD 30–760) with a year scrubber. Watch the centers of gravity shift from Palestine to Asia Minor, Rome, North Africa, and beyond.",
  alternates: { canonical: canonicalUrl("/map") },
  openGraph: {
    title: "Map — geographic view across time",
    description:
      "A geographic map of early Christian figures (AD 30–760) with a year scrubber. Watch the centers of gravity shift from Palestine to Asia Minor, Rome, North Africa, and beyond.",
    url: canonicalUrl("/map"),
    type: "website",
  },
};

export default function MapPage() {
  const people = getPeople();
  // Keep figures with any geographic anchor we can plot
  const anchored = people.filter((p) => p.birth_place || p.see || p.death_place);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl mb-2">Map</h1>
      <p className="text-sm text-ink/60 mb-6 max-w-3xl">
        A geographic view of the early church across the Mediterranean. Drag the
        scrubber, or hit play, to watch which cities are alive with figures at
        any given moment between AD 30 and 760. Click a figure to open their
        page.
      </p>
      <MapView people={anchored} />
    </div>
  );
}
