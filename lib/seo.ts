export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://patristic.io").replace(/\/$/, "");

export const SITE_NAME = "Patristic Lineage";

export const SITE_DESC =
  "Trace how Christianity was handed down from Jesus to the early Church Fathers through a sourced transmission graph, AD 30 to 750.";

export function canonicalUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
