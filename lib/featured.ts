// Back-compat shim — the picker now lives in lib/picker.ts and supports
// multiple content types. Existing callers that only want today's Person can
// keep importing from here.
export {
  featuredOfDay,
  featuredQueue,
  isoDate,
  parseIsoDate,
  addDays,
  dayIndex,
  pickContent,
  type Content,
} from "./picker";
