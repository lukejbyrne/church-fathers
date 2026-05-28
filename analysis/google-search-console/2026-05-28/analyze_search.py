from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd


ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
OUT = ROOT / "outputs"
SITE = "https://patristic.io"


def pct_to_float(value: object) -> float | None:
    if value is None or pd.isna(value):
        return None
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("%"):
        text = text[:-1]
    try:
        return float(text) / 100
    except ValueError:
        return None


def num(value: object) -> float | None:
    if value is None or pd.isna(value):
        return None
    text = str(value).replace(",", "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def read_gsc_csv(name: str) -> pd.DataFrame:
    path = RAW / name
    df = pd.read_csv(path)
    for col in ["Clicks", "Impressions", "Position"]:
        if col in df.columns:
            df[col] = df[col].map(num)
    if "CTR" in df.columns:
        df["CTR_decimal"] = df["CTR"].map(pct_to_float)
    return df


def weighted_position(df: pd.DataFrame) -> float | None:
    if "Position" not in df.columns or "Impressions" not in df.columns:
        return None
    weighted = df.dropna(subset=["Position", "Impressions"])
    weighted = weighted[weighted["Impressions"] > 0]
    if weighted.empty:
        return None
    return float((weighted["Position"] * weighted["Impressions"]).sum() / weighted["Impressions"].sum())


def path_from_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    return path


def opportunity_band(position: float | None) -> str:
    if position is None:
        return "unknown"
    if position <= 5:
        return "top 5"
    if position <= 10:
        return "page 1"
    if position <= 20:
        return "page 2"
    if position <= 40:
        return "striking distance"
    return "low rank"


def page_action(path: str, impressions: float, clicks: float, ctr: float | None, position: float | None) -> str:
    if path.startswith("/events/council-of-toledo-iii"):
        return (
            "High-priority snippet fix: page 1 rankings but no clicks. Add a direct first-screen answer "
            "for Toledo III/Arian-bishop-count queries and fix the duplicated branded title."
        )
    if path == "/bishops":
        return (
            "Retitle/snippet toward search intent: 'Apostolic succession: early bishops and sees' is clearer "
            "than 'Bishops & their sees' for non-insiders."
        )
    if path.startswith("/fathers/hippolytus-of-rome"):
        return (
            "Improve entity snippet: make the title/intro mention 'Apostolic Tradition', 'Roman presbyter', "
            "and the antipope complication."
        )
    if path.startswith("/fathers/pseudo-dionysius"):
        return (
            "Add query-led copy for 'Corpus Areopagiticum' and Pseudo-Dionysius; the page ranks too low for "
            "broad entity searches but has specialist-intent upside."
        )
    if clicks > 0:
        return "Already earning some clicks; keep monitoring before changing."
    if position is not None and position <= 20 and impressions >= 20:
        return "Good quick-win candidate: improve title, meta description, and above-the-fold answer."
    if position is not None and position <= 40 and impressions >= 50:
        return "Content-depth candidate: add question-led sections and internal links before metadata tweaks."
    return "Low immediate priority."


def query_action(query: str, impressions: float, position: float | None) -> str:
    q = query.lower()
    if "toledo" in q or "toletum" in q:
        return "Create/strengthen a Toledo III answer block matching the exact query, especially Arian-bishop count."
    if "pseudo" in q or "areopagiticum" in q or "dionysius" in q:
        return "Add a Corpus Areopagiticum explainer section or question page."
    if q in {"tertullian", "justin martyr", "arius", "chrysostom", "maximus the confessor"}:
        return "Broad entity query; do not chase with metadata alone. Build richer question-led support pages."
    if position is not None and position <= 10:
        return "Metadata/snippet quick win."
    if position is not None and position <= 20:
        return "Needs stronger page section and internal links."
    return "Longer-term authority/content depth."


@dataclass
class Summary:
    generated_on: str
    date_start: str
    date_end: str
    clicks: int
    impressions: int
    ctr: float
    weighted_position: float | None
    query_rows: int
    page_rows: int
    countries: int
    devices: int
    search_appearance_rows: int
    onsite_analytics_available: bool


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    chart = read_gsc_csv("Chart.csv")
    queries = read_gsc_csv("Queries.csv")
    pages = read_gsc_csv("Pages.csv")
    countries = read_gsc_csv("Countries.csv")
    devices = read_gsc_csv("Devices.csv")
    search_appearance = read_gsc_csv("Search appearance.csv")
    filters = read_gsc_csv("Filters.csv")

    chart["Date"] = pd.to_datetime(chart["Date"]).dt.date
    clicks = int(chart["Clicks"].sum())
    impressions = int(chart["Impressions"].sum())
    ctr = clicks / impressions if impressions else 0

    pages["Path"] = pages["Top pages"].map(path_from_url)
    pages["Band"] = pages["Position"].map(opportunity_band)
    pages["Opportunity score"] = (
        pages["Impressions"].fillna(0)
        * (1 - pages["CTR_decimal"].fillna(0).clip(0, 1))
        / pages["Position"].fillna(100).clip(lower=1)
    )
    pages["Recommended action"] = pages.apply(
        lambda row: page_action(
            row["Path"],
            row["Impressions"],
            row["Clicks"],
            row.get("CTR_decimal"),
            row["Position"],
        ),
        axis=1,
    )
    page_opps = pages.sort_values("Opportunity score", ascending=False).head(25)

    queries["Band"] = queries["Position"].map(opportunity_band)
    queries["Opportunity score"] = (
        queries["Impressions"].fillna(0)
        * (1 - queries["CTR_decimal"].fillna(0).clip(0, 1))
        / queries["Position"].fillna(100).clip(lower=1)
    )
    queries["Recommended action"] = queries.apply(
        lambda row: query_action(row["Top queries"], row["Impressions"], row["Position"]),
        axis=1,
    )
    query_opps = queries.sort_values("Opportunity score", ascending=False).head(40)

    country_top = countries.sort_values("Clicks", ascending=False).head(10)
    device_top = devices.sort_values("Clicks", ascending=False).head(10)

    summary = Summary(
        generated_on=date.today().isoformat(),
        date_start=chart["Date"].min().isoformat(),
        date_end=chart["Date"].max().isoformat(),
        clicks=clicks,
        impressions=impressions,
        ctr=ctr,
        weighted_position=weighted_position(chart),
        query_rows=len(queries),
        page_rows=len(pages),
        countries=len(countries),
        devices=len(devices),
        search_appearance_rows=max(len(search_appearance) - 1, 0)
        if list(search_appearance.columns) == ["Search Appearance", "Clicks", "Impressions", "CTR", "Position"]
        else len(search_appearance.dropna(how="all")),
        onsite_analytics_available=False,
    )

    (OUT / "summary.json").write_text(json.dumps(asdict(summary), indent=2), encoding="utf-8")
    page_opps.to_csv(OUT / "page_opportunities.csv", index=False, quoting=csv.QUOTE_MINIMAL)
    query_opps.to_csv(OUT / "query_opportunities.csv", index=False, quoting=csv.QUOTE_MINIMAL)
    chart.to_csv(OUT / "daily_search_performance.csv", index=False, quoting=csv.QUOTE_MINIMAL)

    report = build_report(
        summary,
        page_opps,
        query_opps,
        country_top,
        device_top,
        filters,
    )
    (ROOT / "report.md").write_text(report, encoding="utf-8")


def fmt_int(value: float | int) -> str:
    return f"{int(value):,}"


def fmt_pct(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value * 100:.2f}%"


def fmt_pos(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.1f}"


def table_rows(df: pd.DataFrame, cols: list[str], limit: int) -> str:
    rows = []
    for _, row in df.head(limit).iterrows():
        cells = []
        for col in cols:
            value = row[col]
            if col in {"Clicks", "Impressions"}:
                value = fmt_int(value)
            elif col == "CTR_decimal":
                value = fmt_pct(value)
            elif col == "Position":
                value = fmt_pos(value)
            else:
                value = str(value)
            cells.append(value.replace("\n", " "))
        rows.append("| " + " | ".join(cells) + " |")
    return "\n".join(rows)


def build_report(
    summary: Summary,
    page_opps: pd.DataFrame,
    query_opps: pd.DataFrame,
    country_top: pd.DataFrame,
    device_top: pd.DataFrame,
    filters: pd.DataFrame,
) -> str:
    filter_lines = [
        f"- {row['Filter']}: {row['Value']}"
        for _, row in filters.iterrows()
        if "Filter" in row and "Value" in row
    ]
    return f"""# Google Search Console Analysis - patristic.io

Generated: {summary.generated_on}

## Export

{chr(10).join(filter_lines)}
- Export files copied to: `analysis/google-search-console/2026-05-28/raw/`
- Analysis outputs: `analysis/google-search-console/2026-05-28/outputs/`

## Executive Summary

Search visibility is early but real: {fmt_int(summary.impressions)} impressions and {fmt_int(summary.clicks)} clicks from {summary.date_start} to {summary.date_end}, for a {fmt_pct(summary.ctr)} aggregate CTR. The weighted average position is {fmt_pos(summary.weighted_position)}.

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
{table_rows(page_opps, ["Path", "Clicks", "Impressions", "CTR_decimal", "Position", "Band", "Recommended action"], 12)}

## Top Query Opportunities

| Query | Clicks | Impressions | CTR | Position | Band | Recommended action |
| --- | ---: | ---: | ---: | ---: | --- | --- |
{table_rows(query_opps, ["Top queries", "Clicks", "Impressions", "CTR_decimal", "Position", "Band", "Recommended action"], 15)}

## Countries

| Country | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
{table_rows(country_top, ["Country", "Clicks", "Impressions", "CTR_decimal", "Position"], 10)}

## Devices

| Device | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
{table_rows(device_top, ["Device", "Clicks", "Impressions", "CTR_decimal", "Position"], 10)}

## Notes

- Google Search Console data is sampled and averaged; position is not a guaranteed exact rank.
- CTR should be judged against query intent and position. Low CTR at position 70 is not a snippet problem; low CTR at position 8 often is.
- Google may generate title links and snippets from page content as well as metadata, so changing the `<title>` and description is helpful but not fully deterministic.

## Reference Links

- Google Search Central: https://developers.google.com/search/docs/appearance/title-link
- Google supported structured data gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Google BreadcrumbList markup: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
"""


if __name__ == "__main__":
    main()
