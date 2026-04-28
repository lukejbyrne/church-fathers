import type { MetadataRoute } from "next";
import { getPeople } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";
  const people = getPeople();
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/start-here`, priority: 0.9 },
    { url: `${base}/map`, priority: 0.9 },
    { url: `${base}/directory`, priority: 0.8 },
    { url: `${base}/about`, priority: 0.6 },
    ...people.map((p) => ({ url: `${base}/fathers/${p.id}`, priority: 0.5 })),
  ];
}
