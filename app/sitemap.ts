import type { MetadataRoute } from "next";
import { getPeople } from "@/lib/data";
import { questionPages } from "@/lib/questions";
import { canonicalUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const people = getPeople();
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
    { url: canonicalUrl("/"), priority: 1 },
    { url: canonicalUrl("/start-here"), priority: 0.9 },
    { url: canonicalUrl("/today"), priority: 0.95 },
    { url: canonicalUrl("/calendar"), priority: 0.85 },
    { url: canonicalUrl("/sent"), priority: 0.6 },
    { url: canonicalUrl("/map"), priority: 0.9 },
    { url: canonicalUrl("/eras"), priority: 0.9 },
    { url: canonicalUrl("/bishops"), priority: 0.8 },
    { url: canonicalUrl("/schisms"), priority: 0.8 },
    { url: canonicalUrl("/questions"), priority: 0.9 },
    { url: canonicalUrl("/books"), priority: 0.85 },
    { url: canonicalUrl("/resources"), priority: 0.85 },
    { url: canonicalUrl("/study-packs"), priority: 0.8 },
    { url: canonicalUrl("/directory"), priority: 0.8 },
    { url: canonicalUrl("/about"), priority: 0.6 },
    ...eras.map((e) => ({ url: canonicalUrl(`/eras/${e}`), priority: 0.7 })),
    ...questionPages.map((page) => ({ url: canonicalUrl(`/questions/${page.slug}`), priority: 0.75 })),
    ...people.map((p) => ({ url: canonicalUrl(`/fathers/${p.id}`), priority: 0.5 })),
  ];
}
