# Research-agent data contract

You are producing structured data about early Christian figures (AD 0–750) for a lineage visualization. **Output exactly one JSON file** matching the shape below. Every claim must be defensible from a citable source.

## Output shape

```json
{
  "era": "apostolic | ante-nicene | nicene | post-nicene",
  "people": [Person, ...],
  "relationships": [Relationship, ...]
}
```

## Person

```json
{
  "id": "polycarp-of-smyrna",                  // kebab-case slug, unique across whole project
  "name": "Polycarp of Smyrna",
  "alt_names": ["Polycarp"],
  "born": 69,                                  // AD year (integer). Negative for BC. null if unknown.
  "born_circa": true,                          // true if approximate
  "died": 155,
  "died_circa": true,
  "birth_place": "Smyrna",
  "death_place": "Smyrna",
  "region": "asia-minor",                      // one of: east | west | syria | egypt | asia-minor | gaul | africa | palestine | other
  "role": ["bishop", "martyr"],                // array, any of: messiah | god | apostle | bishop | presbyter | deacon | monk | apologist | theologian | martyr | emperor | layman
  "see": "Smyrna",                             // omit if not a bishop
  "tradition_status": "apostolic-father",      // one of: apostle | apostolic-father | apologist | ante-nicene | nicene | post-nicene | desert-father
  "significance": 3,                           // 1 = minor, 2 = notable, 3 = major Father, 4 = apostle/Jesus
  "short_bio": "Bishop of Smyrna and disciple of John the Apostle. Wrote to the Philippians, was martyred by burning c. 155.",
  "wikipedia_url": "https://en.wikipedia.org/wiki/Polycarp",
  "wikidata_id": "Q170472",
  "ccel_url": "https://ccel.org/ccel/schaff/anf01.iv.ii.html",
  "citations": [
    { "source": "Irenaeus, Against Heresies 3.3.4", "kind": "primary" },
    { "source": "Eusebius, Hist. Eccl. 4.14-15", "kind": "primary" }
  ]
}
```

Required: `id`, `name`, `region`, `role`, `tradition_status`, `significance`, `short_bio`, `citations` (≥1).
Use `null` for unknown numeric fields. Do not invent dates — mark `_circa: true` if approximate.

## Relationship

```json
{
  "from": "irenaeus-of-lyons",
  "to": "polycarp-of-smyrna",
  "type": "taught_by",                         // taught_by | taught | met | corresponded | knew_of | succeeded_in_see | baptized_by | ordained_by | opposed | cited
  "strength": "documented",                    // documented | tradition | disputed
  "notes": "Irenaeus describes hearing Polycarp preach in his youth.",
  "citations": [
    { "source": "Irenaeus, Letter to Florinus (in Eusebius HE 5.20)", "kind": "primary" }
  ]
}
```

Required: `from`, `to`, `type`, `strength`, `citations` (≥1).

### Strength rules — be strict

- **documented** = a primary source from antiquity directly attests the relationship (the person, a contemporary, or near-contemporary historian like Eusebius writing within ~150 years).
- **tradition** = later attestation, hagiographic, or attested only by one source writing centuries later.
- **disputed** = modern scholarship (Quasten, ODCC, mainstream patristic scholarship) considers the link contested or rejected.

If you would mark `documented` but the only source is Eusebius citing a now-lost work, downgrade to `tradition` unless the chain is strong.

## Edge type semantics

- `taught_by` / `taught` — direct discipleship
- `met` — physically met, no formal teaching relationship
- `corresponded` — exchanged letters
- `knew_of` — aware of, e.g. cited, praised, or refuted in writing
- `succeeded_in_see` — episcopal succession (`from` succeeded `to`)
- `cited` — quoted or referenced in writing (one-directional)
- `opposed` — theological opponent (Arius opposed by Athanasius)

## What to include

- Every named figure traditionally counted in your assigned era.
- Every relationship attested in primary sources OR significant traditional/scholarly claims (mark strength accordingly).
- Borderline cases (e.g. Pseudo-Dionysius) — include with `disputed` markings.

## What to skip

- Unnamed disciples, generic "the church at X."
- Modern reconstructions without ancient basis.
- Don't pad — fewer well-cited entries beats more guessed ones.

## Citation format

- Primary sources: `"Author, Work Booknumber.Chapternumber"` — e.g. `"Eusebius, Hist. Eccl. 5.20"`, `"Irenaeus, Adv. Haer. 3.3.4"`, `"Jerome, De Viris Illustribus 17"`.
- Secondary: `"Quasten, Patrology vol. 1, p. 76"`, `"ODCC s.v. Polycarp"`.
- Include `url` field when a stable web version exists (CCEL, Wikipedia for cross-reference, etc.).

## Final check before returning

1. Every relationship's `from` and `to` exists in your `people` array OR you've noted the cross-era person id explicitly.
2. No person has `died < born`.
3. Every relationship has ≥1 citation.
4. IDs are stable kebab-case slugs you'd be comfortable seeing as a URL.
