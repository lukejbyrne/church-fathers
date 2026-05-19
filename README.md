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

### Email provider

The daily newsletter is sent by `netlify/functions/daily-email.ts` through Resend. Subscribers are stored in Netlify Blobs, so signups survive future provider swaps.

Required production env vars:

- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`
- `NEWSLETTER_FROM_NAME`
- `NEWSLETTER_REPLY_TO_EMAIL` optional
- `ADMIN_TOKEN` or `UNSUBSCRIBE_SECRET` for signed unsubscribe links
- `NEWSLETTER_BASE_URL` optional, defaults to `https://patristic.io`

The Netlify scheduled function runs at 06:00 UTC. For a safe live check, call `/.netlify/functions/daily-email?dry_run=1`.

## Local traffic stats

The site records first-party, anonymous pageviews to a Netlify Blob store named `analytics-events`.
It does not store raw IP addresses, raw user agents, cookies, or names. Visitors are counted with a
salted hash of IP + user-agent so the local report can estimate unique visitors.
Stats start collecting after this code is deployed; it cannot recover historical traffic from before
the beacon existed.

Recommended env vars:

```sh
ANALYTICS_SALT=use-a-long-random-string
NETLIFY_SITE_ID=your-site-id
NETLIFY_AUTH_TOKEN=your-netlify-personal-access-token
```

Set `ANALYTICS_SALT` in Netlify too, so visitor hashes are stable across deploys. Set
`NEXT_PUBLIC_ANALYTICS_DISABLED=true` if you need to temporarily disable collection.

Pull and summarize the last 30 days locally:

```sh
pnpm stats
```

Useful options:

```sh
pnpm stats -- --days 7
pnpm stats -- --json
pnpm stats -- --include-bots
```
