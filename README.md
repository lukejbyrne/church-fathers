# Church Fathers Lineage

Visualizes the human chain from Jesus → Apostles → Apostolic Fathers → Patristic era (~AD 30 – 750).

Each person is a node placed on a vertical time axis. Edges show who knew (solid), who knew of (dashed), or disputed connections (dotted red). Bishops have a gold ring; apostles are filled red.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- D3 for the timeline viz
- Fuse.js for directory search
- Zod for data schema
- Netlify deploy

## Data pipeline

```
data/sources/<era>.json     ← LLM research output, era-split
        ↓ pnpm merge
data/people.json
data/relationships.json     ← canonical, used by app
        ↓ pnpm validate
        (dangling refs, lifespan sanity, citation presence)
        ↓ pnpm enrich
data/enrich-report.md       ← Wikidata cross-check, manual review
```

## Develop

```sh
pnpm install
pnpm data       # merge + validate
pnpm dev
```

## Schema

See `data/SCHEMA.md` for the full data contract. Every relationship requires `strength` (`documented` / `tradition` / `disputed`) and ≥1 citation.

## Editing data

Hand-edit `data/sources/<era>.json` and re-run `pnpm data`. Citations should prefer primary sources (Eusebius HE, Irenaeus Adv. Haer., Jerome De Viris, the Father's own letters).
