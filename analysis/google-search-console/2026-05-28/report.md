# Google Search Console Analysis - patristic.io

Generated: 2026-05-28

## Export

- Search type: Web
- Date: Last 3 months
- Export files copied to: `analysis/google-search-console/2026-05-28/raw/`
- Analysis outputs: `analysis/google-search-console/2026-05-28/outputs/`

## Executive Summary

Search visibility is early but real: 5,645 impressions and 7 clicks from 2026-04-28 to 2026-05-26, for a 0.12% aggregate CTR. The weighted average position is 25.4.

The main issue is not broad indexing. Google is finding the site, but the pages with the best positions are not yet earning enough clicks. The clearest example is `/events/council-of-toledo-iii`, which has page-one average position and the most impressions in the export, but zero clicks. A live result also showed the title as `Third Council of Toledo (589) - Patristic Lineage - Patristic Lineage`; the event metadata path has been patched so future crawls should only append the brand once.

The `Search appearance` export contains no rich-result rows. That means there is no evidence in this export that Google is currently showing special rich-result appearances for the site. The site already had useful JSON-LD for `WebSite`, `Dataset`, `Person`, `FAQPage`, and `Article`; this run added `BreadcrumbList` markup to event, father/entity, era, question, and bishops pages.

Local first-party analytics exists in the repo, but no usable local onsite metrics were available during this run. The local stats pull returned zero pageviews for the last 30 days, and there was no other patristic.io analytics export in Downloads.

## Recommended Actions

1. Implemented: fixed duplicated event-page titles by removing the extra brand from event metadata.
2. Implemented: rewrote the Toledo III event intro/answer copy to match the live queries: Reccared, Leander, eight Arian bishops, Arianism, and the filioque.
3. Implemented: retitled `/bishops` around outsider language: `Apostolic succession: early bishops and sees`.
4. Implemented: added `BreadcrumbList` structured data for entity, event, era, question, and bishops pages.
5. Still recommended: build a small cluster of question-led pages from the queries that already rank: Corpus Areopagiticum/Pseudo-Dionysius, Hippolytus/Apostolic Tradition, and beginner-friendly apostolic succession.
6. Do not chase one-word entity queries like `tertullian`, `arius`, or `justin martyr` with metadata only. Those are broad encyclopedia-style searches where the site needs content depth and internal links.

## Top Page Opportunities

| Page | Clicks | Impressions | CTR | Position | Band | Recommended action |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| /events/council-of-toledo-iii | 0 | 389 | 0.00% | 7.9 | page 1 | High-priority snippet fix: page 1 rankings but no clicks. Add a direct first-screen answer for Toledo III/Arian-bishop-count queries and fix the duplicated branded title. |
| /bishops | 2 | 184 | 1.09% | 9.1 | page 1 | Retitle/snippet toward search intent: 'Apostolic succession: early bishops and sees' is clearer than 'Bishops & their sees' for non-insiders. |
| /questions/earliest-bishops-of-rome | 0 | 55 | 0.00% | 3.6 | top 5 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /fathers/melania-the-elder | 0 | 81 | 0.00% | 5.5 | page 1 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /fathers/john-of-damascus | 0 | 103 | 0.00% | 10.8 | page 2 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /fathers/hippolytus-of-rome | 0 | 163 | 0.00% | 18.1 | page 2 | Improve entity snippet: make the title/intro mention 'Apostolic Tradition', 'Roman presbyter', and the antipope complication. |
| /fathers/basil-of-caesarea | 0 | 101 | 0.00% | 12.5 | page 2 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /fathers/diodore-of-tarsus | 0 | 48 | 0.00% | 7.2 | page 1 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /fathers/rufinus-of-aquileia?via=episcopal | 0 | 60 | 0.00% | 9.9 | page 1 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /events/novatian-schism | 0 | 38 | 0.00% | 6.8 | page 1 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /schisms | 0 | 89 | 0.00% | 17.0 | page 2 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |
| /fathers/germanus-of-constantinople?via=episcopal | 0 | 39 | 0.00% | 8.1 | page 1 | Good quick-win candidate: improve title, meta description, and above-the-fold answer. |

## Top Query Opportunities

| Query | Clicks | Impressions | CTR | Position | Band | Recommended action |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| catholic encyclopedia rufinus melania the elder | 0 | 14 | 0.00% | 2.5 | top 5 | Metadata/snippet quick win. |
| britannica pseudo-dionysius corpus areopagiticum | 0 | 30 | 0.00% | 8.3 | page 1 | Add a Corpus Areopagiticum explainer section or question page. |
| diodore | 0 | 3 | 0.00% | 1.0 | top 5 | Metadata/snippet quick win. |
| palladius of galatia icon | 0 | 3 | 0.00% | 1.0 | top 5 | Metadata/snippet quick win. |
| third council of toledo arian bishops attended number | 0 | 16 | 0.00% | 8.6 | page 1 | Create/strengthen a Toledo III answer block matching the exact query, especially Arian-bishop count. |
| britannica rufinus of aquileia melania the elder | 0 | 13 | 0.00% | 7.9 | page 1 | Metadata/snippet quick win. |
| toletum iii eight arian bishops | 0 | 16 | 0.00% | 10.5 | page 2 | Create/strengthen a Toledo III answer block matching the exact query, especially Arian-bishop count. |
| "markus" "ignores" augustine predestination | 0 | 8 | 0.00% | 7.0 | page 1 | Metadata/snippet quick win. |
| shenoute | 0 | 1 | 0.00% | 1.0 | top 5 | Metadata/snippet quick win. |
| third council of toledo 589 arian bishops eight | 0 | 7 | 0.00% | 9.6 | page 1 | Create/strengthen a Toledo III answer block matching the exact query, especially Arian-bishop count. |
| third council of toledo 589 reccared | 0 | 6 | 0.00% | 9.0 | page 1 | Create/strengthen a Toledo III answer block matching the exact query, especially Arian-bishop count. |
| tertullian | 0 | 45 | 0.00% | 71.1 | low rank | Broad entity query; do not chase with metadata alone. Build richer question-led support pages. |
| "markus" "ignores" "predestination" augustine | 0 | 4 | 0.00% | 7.0 | page 1 | Metadata/snippet quick win. |
| catholic encyclopedia judas iscariot kerioth | 0 | 4 | 0.00% | 7.2 | page 1 | Metadata/snippet quick win. |
| council of chalcedon "peter has spoken through leo" | 0 | 4 | 0.00% | 8.2 | page 1 | Metadata/snippet quick win. |

## Countries

| Country | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| United States | 3 | 3,015 | 0.10% | 22.1 |
| Italy | 1 | 63 | 1.59% | 13.6 |
| Poland | 1 | 28 | 3.57% | 7.2 |
| Mozambique | 1 | 4 | 25.00% | 6.0 |
| United Kingdom | 1 | 411 | 0.24% | 60.2 |
| Uzbekistan | 0 | 2 | 0.00% | 3.5 |
| Uganda | 0 | 3 | 0.00% | 9.7 |
| Lithuania | 0 | 3 | 0.00% | 10.7 |
| Ethiopia | 0 | 3 | 0.00% | 30.3 |
| Belarus | 0 | 3 | 0.00% | 33.0 |

## Devices

| Device | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 5 | 5,007 | 0.10% | 25.3 |
| Mobile | 2 | 627 | 0.32% | 26.3 |
| Tablet | 0 | 11 | 0.00% | 7.3 |

## Notes

- Google Search Console data is sampled and averaged; position is not a guaranteed exact rank.
- CTR should be judged against query intent and position. Low CTR at position 70 is not a snippet problem; low CTR at position 8 often is.
- Google may generate title links and snippets from page content as well as metadata, so changing the `<title>` and description is helpful but not fully deterministic.

## Reference Links

- Google Search Central: https://developers.google.com/search/docs/appearance/title-link
- Google supported structured data gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Google BreadcrumbList markup: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
