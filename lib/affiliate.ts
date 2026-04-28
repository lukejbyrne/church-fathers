// Amazon affiliate link helper.
// Set NEXT_PUBLIC_AMAZON_TAG (e.g. "lukebyrne-21" for UK, "lukebyrne-20" for US)
// in your env to monetize. Falls back to a tag-less search if unset.

const TAG = process.env.NEXT_PUBLIC_AMAZON_TAG;
// UK ".co.uk" or US ".com" — pick per audience. Default UK since the site author is UK-based.
const TLD = process.env.NEXT_PUBLIC_AMAZON_TLD ?? "co.uk";

export function amazonUrl({
  asin,
  query,
}: {
  asin?: string;
  query?: string;
}): string | null {
  if (asin) {
    const url = `https://www.amazon.${TLD}/dp/${encodeURIComponent(asin)}`;
    return TAG ? `${url}?tag=${TAG}` : url;
  }
  if (query) {
    const url = `https://www.amazon.${TLD}/s?k=${encodeURIComponent(query)}`;
    return TAG ? `${url}&tag=${TAG}` : url;
  }
  return null;
}

export const hasAffiliateTag = !!TAG;
