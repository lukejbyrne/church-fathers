import { z } from "zod";

export const Region = z.enum([
  "east",
  "west",
  "syria",
  "egypt",
  "asia-minor",
  "gaul",
  "africa",
  "palestine",
  "other",
]);
export type Region = z.infer<typeof Region>;

export const Role = z.enum([
  "apostle",
  "bishop",
  "presbyter",
  "deacon",
  "monk",
  "apologist",
  "theologian",
  "martyr",
  "emperor",
  "layman",
]);
export type Role = z.infer<typeof Role>;

export const TraditionStatus = z.enum([
  "apostle",
  "apostolic-father",
  "apologist",
  "ante-nicene",
  "nicene",
  "post-nicene",
  "desert-father",
]);
export type TraditionStatus = z.infer<typeof TraditionStatus>;

export const RelationshipType = z.enum([
  "taught_by",
  "taught",
  "met",
  "corresponded",
  "knew_of",
  "succeeded_in_see",
  "baptized_by",
  "ordained_by",
  "opposed",
  "cited",
]);
export type RelationshipType = z.infer<typeof RelationshipType>;

export const Strength = z.enum(["documented", "tradition", "disputed"]);
export type Strength = z.infer<typeof Strength>;

const optStr = z.string().nullish().transform((v) => v ?? undefined);
const optUrl = z
  .string()
  .nullish()
  .transform((v) => (v && /^https?:\/\//.test(v) ? v : undefined));

export const Citation = z.object({
  source: z.string().min(1),
  url: optUrl,
  kind: z.enum(["primary", "secondary", "reference"]),
});
export type Citation = z.infer<typeof Citation>;

export const Work = z.object({
  title: z.string().min(1),
  year: z.number().int().nullish().transform((v) => v ?? undefined),
  description: optStr,
  amazon_asin: optStr,
  amazon_query: optStr,
  ccel_url: optUrl,
});
export type Work = z.infer<typeof Work>;

export const Person = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "must be kebab-case slug"),
  name: z.string().min(1),
  alt_names: z.array(z.string()).nullish().transform((v) => v ?? undefined),
  born: z.number().int().nullish().transform((v) => v ?? undefined),
  born_circa: z.boolean().nullish().transform((v) => v ?? undefined),
  died: z.number().int().nullish().transform((v) => v ?? undefined),
  died_circa: z.boolean().nullish().transform((v) => v ?? undefined),
  birth_place: optStr,
  death_place: optStr,
  region: Region,
  role: z.array(Role).min(1),
  see: optStr,
  tradition_status: TraditionStatus,
  significance: z.number().int().min(1).max(4),
  short_bio: z.string().min(1),
  wikipedia_url: optUrl,
  wikidata_id: optStr,
  ccel_url: optUrl,
  citations: z.array(Citation).min(1),
  image_url: optUrl,
  image_credit: optStr,
  image_license: optStr,
  works: z.array(Work).nullish().transform((v) => v ?? undefined),
  why_matters: optStr,
  feast_day_catholic: optStr,
  feast_day_orthodox: optStr,
});
export type Person = z.infer<typeof Person>;

export const Anniversary = z.object({
  id: z.string(),
  kind: z.enum(["council", "schism", "heresy-condemnation"]),
  date: z.string().regex(/^\d{2}-\d{2}$/, "must be MM-DD"),
  year: z.number().int(),
  title: z.string().min(1),
  blurb: z.string().min(1),
  related_person_ids: z.array(z.string()).optional(),
  citation: z.string().optional(),
});
export type Anniversary = z.infer<typeof Anniversary>;

export const Quote = z.object({
  person_id: z.string(),
  text: z.string().min(1),
  source: z.string().min(1),
  translation: z.string().optional(),
});
export type Quote = z.infer<typeof Quote>;

export const Relationship = z.object({
  from: z.string(),
  to: z.string(),
  type: RelationshipType,
  strength: Strength,
  notes: optStr,
  citations: z.array(Citation).min(1),
});
export type Relationship = z.infer<typeof Relationship>;

export const EraFile = z.object({
  era: z.enum(["apostolic", "ante-nicene", "nicene", "post-nicene"]),
  people: z.array(Person),
  relationships: z.array(Relationship),
});
export type EraFile = z.infer<typeof EraFile>;

export function relationshipId(r: Pick<Relationship, "from" | "to" | "type">) {
  return `${r.from}__${r.type}__${r.to}`;
}
