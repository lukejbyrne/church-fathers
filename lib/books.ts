import { getPerson } from "@/lib/data";
import { pickContent } from "@/lib/picker";
import type { Content } from "@/lib/picker";
import type { Person, TraditionStatus, Work } from "@/lib/schema";
import type { EraSlug } from "@/lib/eras";

export type BookRecommendation = {
  id: string;
  personId: string;
  workTitle: string;
  displayTitle?: string;
  reason: string;
  audience: string;
  coverImageUrl?: string;
  coverAlt?: string;
  shelves: string[];
  eraSlugs?: EraSlug[];
  eventSlugs?: string[];
  priority: number;
};

export type ResolvedBookRecommendation = BookRecommendation & {
  person: Person;
  work: Work;
};

export const BOOK_RECOMMENDATIONS: BookRecommendation[] = [
  {
    id: "apostolic-fathers-holmes",
    personId: "clement-of-rome",
    workTitle: "1 Clement (Letter to the Corinthians)",
    displayTitle: "The Apostolic Fathers",
    reason:
      "Best first collection for Clement, Ignatius, Polycarp, the Didache, Barnabas, Hermas, and Papias in one place.",
    audience: "Start here if you want the generation just after the apostles.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/1506776-M.jpg",
    coverAlt: "Cover of The Apostolic Fathers, edited and translated by Michael W. Holmes",
    shelves: ["starter", "primary-sources"],
    eraSlugs: ["apostolic-fathers"],
    priority: 1,
  },
  {
    id: "athanasius-incarnation",
    personId: "athanasius-of-alexandria",
    workTitle: "On the Incarnation",
    reason:
      "Short, readable, and central: why God became man, written from inside the Nicene fight.",
    audience: "Start here if you want one patristic classic, not a whole library.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/4785278-M.jpg",
    coverAlt: "Cover of On the Incarnation by Athanasius",
    shelves: ["starter", "trinity"],
    eraSlugs: ["nicene"],
    eventSlugs: ["council-of-nicaea-i", "condemnation-of-arius", "schisms"],
    priority: 2,
  },
  {
    id: "justin-apologies",
    personId: "justin-martyr",
    workTitle: "First and Second Apology",
    displayTitle: "First and Second Apologies",
    reason:
      "The classic first stop for Christians explaining their faith before emperors, philosophers, and pagan Rome.",
    audience: "Start here for the Apologists and Christianity's public defense.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/12507358-M.jpg",
    coverAlt: "Cover of First and Second Apologies by Justin Martyr",
    shelves: ["starter", "primary-sources"],
    eraSlugs: ["apologists"],
    priority: 2.5,
  },
  {
    id: "augustine-confessions",
    personId: "augustine-of-hippo",
    workTitle: "Confessions",
    reason:
      "The most approachable major Latin Father: autobiography, prayer, memory, sin, grace, and desire.",
    audience: "Start here if you want something personal rather than technical.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/9022521-M.jpg",
    coverAlt: "Cover of Augustine's Confessions",
    shelves: ["starter", "western"],
    eraSlugs: ["post-nicene"],
    priority: 3,
  },
  {
    id: "augustine-enchiridion",
    personId: "augustine-of-hippo",
    workTitle: "Enchiridion",
    reason:
      "A compact Augustinian map of faith, hope, love, grace, and salvation after the Pelagian fight.",
    audience: "Read this when the question is grace, not Augustine's life story.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/693830-M.jpg",
    coverAlt: "Cover of Enchiridion on Faith, Hope, and Love by St. Augustine",
    shelves: ["western", "doctrine"],
    eraSlugs: ["post-nicene"],
    eventSlugs: ["condemnation-of-pelagius", "council-of-orange"],
    priority: 13.5,
  },
  {
    id: "augustine-city-of-god",
    personId: "augustine-of-hippo",
    workTitle: "City of God",
    reason:
      "Augustine's answer to Rome's collapse: two cities, providence, empire, worship, and Christian hope.",
    audience: "Read this when the newsletter is about Rome falling apart.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/104325-M.jpg",
    coverAlt: "Cover of City of God by Saint Augustine",
    shelves: ["western", "history"],
    eraSlugs: ["post-nicene"],
    eventSlugs: ["fall-of-rome"],
    priority: 13.6,
  },
  {
    id: "irenaeus-against-heresies",
    personId: "irenaeus-of-lyons",
    workTitle: "Against Heresies",
    reason:
      "The key text for public apostolic tradition, anti-gnostic argument, and the chain from John to Polycarp to Irenaeus.",
    audience: "Read this when you care about tradition, bishops, and heresy.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/8486479-M.jpg",
    coverAlt: "Cover of Against the Heresies by Irenaeus",
    shelves: ["tradition", "controversies"],
    eraSlugs: ["apologists", "ante-nicene"],
    eventSlugs: ["schisms"],
    priority: 4,
  },
  {
    id: "eusebius-history",
    personId: "eusebius-of-caesarea",
    workTitle: "Ecclesiastical History",
    reason:
      "The ancient source behind a huge amount of what we know about bishops, martyrs, succession lists, and early controversies.",
    audience: "Read this as the first ancient church history.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/8242899-M.jpg",
    coverAlt: "Cover of Eusebius's Ecclesiastical History",
    shelves: ["history", "reference"],
    eraSlugs: ["nicene"],
    eventSlugs: ["edict-of-milan", "council-of-nicaea-i"],
    priority: 5,
  },
  {
    id: "basil-holy-spirit",
    personId: "basil-of-caesarea",
    workTitle: "On the Holy Spirit",
    reason:
      "Basil gives the mature Cappadocian defense of the Spirit's divinity after Nicaea.",
    audience: "Read this after Athanasius if the Trinity question is your main thread.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/704434-M.jpg",
    coverAlt: "Cover of On the Holy Spirit by Basil of Caesarea",
    shelves: ["trinity"],
    eraSlugs: ["nicene"],
    eventSlugs: ["council-of-constantinople-i"],
    priority: 6,
  },
  {
    id: "gregory-theological-orations",
    personId: "gregory-of-nazianzus",
    workTitle: "Five Theological Orations",
    reason:
      "Dense but decisive sermons on the Trinity from the theologian of Constantinople.",
    audience: "Read this when you want the high-theology version of Nicaea.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/4744150-M.jpg",
    coverAlt: "Cover of On God and Christ by Gregory of Nazianzus",
    shelves: ["trinity"],
    eraSlugs: ["nicene"],
    eventSlugs: ["council-of-constantinople-i"],
    priority: 7,
  },
  {
    id: "origen-first-principles",
    personId: "origen-of-alexandria",
    workTitle: "On First Principles (De Principiis)",
    reason:
      "The bold, influential, and later contested system that explains why Origen became impossible to ignore.",
    audience: "Read this when the issue is Origen's brilliance and danger.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/9238404-M.jpg",
    coverAlt: "Cover of Origen: On First Principles and Against Celsus",
    shelves: ["controversies", "doctrine"],
    eraSlugs: ["ante-nicene"],
    eventSlugs: ["council-of-constantinople-ii", "condemnation-of-origen"],
    priority: 7.5,
  },
  {
    id: "desert-fathers-sayings",
    personId: "anthony-the-great",
    workTitle: "Sayings of the Desert Fathers",
    reason:
      "Short sayings from Egyptian monasticism: memorable, strange, practical, and easy to read in small doses.",
    audience: "Start here if doctrine pages feel too abstract.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/104241-M.jpg",
    coverAlt: "Cover of The Desert Fathers, translated by Benedicta Ward",
    shelves: ["monastic", "starter"],
    eraSlugs: ["desert-fathers"],
    priority: 8,
  },
  {
    id: "tertullian-marcion",
    personId: "tertullian",
    workTitle: "Against Marcion",
    reason:
      "The classic Latin attack on Marcion's rejection of the Old Testament and two-god theology.",
    audience: "Read this for canon, Old Testament, and early anti-heresy argument.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/5897234-M.jpg",
    coverAlt: "Cover of Tertullian's Against Marcion",
    shelves: ["controversies"],
    eraSlugs: ["ante-nicene"],
    eventSlugs: ["schisms"],
    priority: 9,
  },
  {
    id: "cyprian-unity",
    personId: "cyprian-of-carthage",
    workTitle: "On the Unity of the Catholic Church",
    reason:
      "A compact North African argument for episcopal unity during persecution and schism.",
    audience: "Read this for bishops, unity, lapsed Christians, and church order.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/592564-M.jpg",
    coverAlt: "Cover of The Lapsed and The Unity of the Catholic Church by Cyprian",
    shelves: ["bishops", "controversies"],
    eraSlugs: ["ante-nicene"],
    eventSlugs: ["donatist-schism", "novatian-schism", "schisms"],
    priority: 10,
  },
  {
    id: "cyril-unity",
    personId: "cyril-of-alexandria",
    workTitle: "On the Unity of Christ",
    reason:
      "The best short entry into the Nestorian controversy and why 'one Christ' mattered so much.",
    audience: "Read this when Christology gets confusing.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/5372628-M.jpg",
    coverAlt: "Cover of On the Unity of Christ by Cyril of Alexandria",
    shelves: ["christology", "controversies"],
    eraSlugs: ["post-nicene"],
    eventSlugs: ["council-of-ephesus", "condemnation-of-nestorius", "schisms"],
    priority: 11,
  },
  {
    id: "leo-tome",
    personId: "pope-leo-i",
    workTitle: "Tome (Letter to Flavian)",
    reason:
      "Leo's letter becomes a central text for Chalcedon and the two-natures formula.",
    audience: "Read this for Chalcedon in its shortest decisive form.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/13166438-M.jpg",
    coverAlt: "Cover of Sermons by Leo the Great",
    shelves: ["christology", "controversies"],
    eraSlugs: ["post-nicene"],
    eventSlugs: [
      "acacian-schism-onset",
      "council-of-chalcedon",
      "condemnation-of-eutyches",
      "three-chapters-controversy",
      "schisms",
    ],
    priority: 12,
  },
  {
    id: "john-chrysostom-wealth",
    personId: "john-chrysostom",
    workTitle: "On Wealth and Poverty",
    reason:
      "A direct, uncomfortable introduction to Chrysostom's preaching and social critique.",
    audience: "Read this if you want sermons that still sting.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/4744613-M.jpg",
    coverAlt: "Cover of On Wealth and Poverty by John Chrysostom",
    shelves: ["preaching", "starter"],
    eraSlugs: ["post-nicene"],
    priority: 13,
  },
  {
    id: "benedict-rule",
    personId: "benedict-of-nursia",
    workTitle: "The Rule of Saint Benedict",
    reason:
      "The compact rule that shaped Western monastic life for centuries.",
    audience: "Read this for the bridge from patristic learning into medieval practice.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/11703041-M.jpg",
    coverAlt: "Cover of RB 1980: The Rule of Saint Benedict",
    shelves: ["monastic"],
    eraSlugs: ["early-medieval"],
    priority: 14,
  },
  {
    id: "bede-history",
    personId: "bede-the-venerable",
    workTitle: "Ecclesiastical History of the English People",
    reason:
      "The classic early medieval church history in the West, written at the far end of this site's timeline.",
    audience: "Read this for Britain, missions, monasteries, and historical narrative.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/104113-M.jpg",
    coverAlt: "Cover of Bede's Ecclesiastical History of the English People",
    shelves: ["history"],
    eraSlugs: ["early-medieval"],
    eventSlugs: ["synod-of-whitby"],
    priority: 15,
  },
  {
    id: "john-damascus-images",
    personId: "john-of-damascus",
    workTitle: "Three Treatises on the Divine Images",
    reason:
      "The great defense of icons and a natural closing book for the patristic age.",
    audience: "Read this for iconoclasm and the last major Father in the dataset.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/4744195-M.jpg",
    coverAlt: "Cover of Three Treatises on the Divine Images by John of Damascus",
    shelves: ["controversies", "late-patristic"],
    eraSlugs: ["early-medieval"],
    eventSlugs: ["council-of-nicaea-ii", "death-of-john-of-damascus", "iconoclasm-onset", "schisms"],
    priority: 16,
  },
  {
    id: "maximus-selected",
    personId: "maximus-the-confessor",
    workTitle: "Centuries on Charity",
    reason:
      "A more approachable route into Maximus than starting with the Ambigua.",
    audience: "Read this after you have some footing in late Greek theology.",
    coverImageUrl: "https://covers.openlibrary.org/b/id/592561-M.jpg",
    coverAlt: "Cover of The Ascetic Life and The Four Centuries on Charity by Maximus the Confessor",
    shelves: ["late-patristic", "monastic"],
    eraSlugs: ["early-medieval"],
    eventSlugs: ["council-of-constantinople-iii"],
    priority: 17,
  },
];

export function resolveBookRecommendation(
  book: BookRecommendation
): ResolvedBookRecommendation | null {
  const person = getPerson(book.personId);
  const work = person?.works?.find((item) => item.title === book.workTitle);
  if (!person || !work) return null;
  return { ...book, person, work };
}

export function getRecommendedBooks({
  eraSlug,
  eventSlug,
  personId,
  shelf,
  limit,
}: {
  eraSlug?: EraSlug;
  eventSlug?: string;
  personId?: string;
  shelf?: string;
  limit?: number;
} = {}): ResolvedBookRecommendation[] {
  const books = BOOK_RECOMMENDATIONS.filter((book) => {
    if (eraSlug && !book.eraSlugs?.includes(eraSlug)) return false;
    if (eventSlug && !book.eventSlugs?.includes(eventSlug)) return false;
    if (personId && book.personId !== personId) return false;
    if (shelf && !book.shelves.includes(shelf)) return false;
    return true;
  })
    .map(resolveBookRecommendation)
    .filter((book): book is ResolvedBookRecommendation => Boolean(book))
    .sort((a, b) => a.priority - b.priority);

  return typeof limit === "number" ? books.slice(0, limit) : books;
}

const TRADITION_TO_ERA: Partial<Record<TraditionStatus, EraSlug>> = {
  apostle: "apostolic",
  "apostolic-father": "apostolic-fathers",
  apologist: "apologists",
  "ante-nicene": "ante-nicene",
  nicene: "nicene",
  "post-nicene": "post-nicene",
  "desert-father": "desert-fathers",
};

function dayIndex(date: Date): number {
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor(utc / 86_400_000);
}

function pickDeterministic(
  books: ResolvedBookRecommendation[],
  date: Date,
  salt = 0
): ResolvedBookRecommendation | null {
  if (books.length === 0) return null;
  const idx = ((dayIndex(date) + salt) % books.length + books.length) % books.length;
  return books[idx];
}

export function bookDisplayTitle(book: ResolvedBookRecommendation): string {
  return book.displayTitle ?? book.work.title;
}

function normalizeWorkTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function quoteSourceMatchesBook(source: string, book: ResolvedBookRecommendation): boolean {
  const normalizedSource = normalizeWorkTitle(source);
  const candidates = [
    book.work.title,
    book.displayTitle,
    book.workTitle,
  ]
    .filter((title): title is string => Boolean(title))
    .map(normalizeWorkTitle)
    .filter(Boolean);

  return candidates.some((candidate) => {
    const firstWords = candidate.split(" ").slice(0, 4).join(" ");
    return normalizedSource.includes(candidate) || (firstWords.length >= 5 && normalizedSource.includes(firstWords));
  });
}

export function eraSlugForTradition(status: TraditionStatus): EraSlug | null {
  return TRADITION_TO_ERA[status] ?? null;
}

export function getBookForPerson(
  person: Person,
  date: Date = new Date()
): ResolvedBookRecommendation | null {
  const direct = getRecommendedBooks({ personId: person.id });
  if (direct.length > 0) return pickDeterministic(direct, date);

  const eraSlug = eraSlugForTradition(person.tradition_status);
  if (eraSlug) {
    const eraPick = pickDeterministic(
      getRecommendedBooks({ eraSlug }),
      date,
      person.id.length
    );
    if (eraPick) return eraPick;
  }

  return null;
}

export function getBookForContent(
  content: Content,
  date: Date = new Date()
): ResolvedBookRecommendation | null {
  if (content.type === "quote") {
    const book = getBookForPerson(content.person, date);
    return book && quoteSourceMatchesBook(content.quote.source, book) ? book : null;
  }

  if (content.type === "father") {
    return getBookForPerson(content.person, date);
  }

  if (content.type === "heretic") {
    return content.anniversary
      ? pickDeterministic(getRecommendedBooks({ eventSlug: content.anniversary.id }), date)
      : null;
  }

  if (content.type === "era") {
    const eraSlug = eraSlugForTradition(content.era);
    if (eraSlug) {
      const eraBook = pickDeterministic(getRecommendedBooks({ eraSlug }), date);
      if (eraBook) return eraBook;
    }
    return null;
  }

  if (content.type === "schism") {
    return pickDeterministic(getRecommendedBooks({ eventSlug: content.anniversary.id }), date);
  }

  if (content.type === "council") {
    return pickDeterministic(getRecommendedBooks({ eventSlug: content.anniversary.id }), date);
  }

  return null;
}

export function getBookOfDay(date: Date = new Date()): ResolvedBookRecommendation | null {
  return getBookForContent(pickContent(date), date);
}
