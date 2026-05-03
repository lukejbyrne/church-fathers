import type { MetadataRoute } from "next";
import { getAnniversaries, getPeople } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io";
  const people = getPeople();
  const events = getAnniversaries();
  const eras = [
    "apostolic",
    "apostolic-fathers",
    "apologists",
    "ante-nicene",
    "nicene",
    "post-nicene",
    "early-medieval",
    "desert-fathers",
  ];
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/start-here`, priority: 0.9 },
    { url: `${base}/today`, priority: 0.95 },
    { url: `${base}/calendar`, priority: 0.85 },
    { url: `${base}/sent`, priority: 0.6 },
    { url: `${base}/map`, priority: 0.9 },
    { url: `${base}/eras`, priority: 0.9 },
    { url: `${base}/events`, priority: 0.85 },
    { url: `${base}/bishops`, priority: 0.8 },
    { url: `${base}/schisms`, priority: 0.8 },
    { url: `${base}/directory`, priority: 0.8 },
    { url: `${base}/about`, priority: 0.6 },
    ...eras.map((e) => ({ url: `${base}/eras/${e}`, priority: 0.7 })),
    ...events.map((e) => ({ url: `${base}/events/${e.id}`, priority: 0.65 })),
    ...people.map((p) => ({ url: `${base}/fathers/${p.id}`, priority: 0.5 })),
  ];
}
