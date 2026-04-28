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

## Newsletter

A "Father of the Day" rotates deterministically by date — the same calendar day always returns the same figure, so emails are reproducible and cacheable.

- Page: `/today` (also accepts `?d=YYYY-MM-DD`).
- JSON: `/api/today` (and `/api/today?d=YYYY-MM-DD`) — returns `{ date, person, next_date }` for ESPs.
- Signup: `/api/subscribe` accepts `POST { email }`. By default it just logs and returns `{ ok: true }`.

### Going live with an ESP

Pick one provider, set its env vars, and uncomment the matching block in `app/api/subscribe/route.ts`. No SDK is added as a dependency — all three are plain HTTP.

| Provider    | Env vars                                       |
|-------------|------------------------------------------------|
| Resend      | `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`         |
| ConvertKit  | `CONVERTKIT_API_KEY`, `CONVERTKIT_FORM_ID`     |
| Buttondown  | `BUTTONDOWN_API_KEY`                           |

### Scheduling the daily send

Have any cron-style runner hit `GET /api/today` once per morning, then post the returned JSON to your ESP's broadcast/draft endpoint. The `next_date` field tells you what tomorrow will be so you can queue ahead. Options:

- **Vercel Cron** — `vercel.json` with `{ "crons": [{ "path": "/api/today", "schedule": "0 8 * * *" }] }`.
- **Netlify Scheduled Functions** — wrap the fetch in a scheduled function (`@netlify/functions` `schedule`).
- **GitHub Actions** — `on: schedule: - cron: '0 8 * * *'`, `curl https://patristic.io/api/today | …`.
- **Plain cron** on any box — `curl` to `/api/today`, pipe to your ESP send script.

Because `featuredOfDay(date)` is pure and deterministic, you can pre-render the next 30 days for review with `featuredQueue(30)`.
