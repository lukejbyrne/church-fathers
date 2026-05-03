import type { ChainKind } from "./lineage";

export type QuestionPage = {
  slug: string;
  title: string;
  description: string;
  shortAnswer: string;
  sections: {
    heading: string;
    body: string[];
  }[];
  figureIds: string[];
  chainTargetId?: string;
  chainKind?: ChainKind;
  relatedSlugs?: string[];
};

export const questionPages: QuestionPage[] = [
  {
    slug: "shortest-chain-from-jesus-to-irenaeus",
    title: "The shortest documented chain from Jesus to Irenaeus",
    description:
      "The closest sourced transmission route from Jesus to Irenaeus runs through John the Apostle and Polycarp of Smyrna.",
    shortAnswer:
      "The tightest documented route in the dataset is Jesus -> John the Apostle -> Polycarp of Smyrna -> Irenaeus of Lyons.",
    sections: [
      {
        heading: "Why this chain matters",
        body: [
          "Irenaeus is one of the first major Christian theologians outside the New Testament. His link to Polycarp matters because Polycarp is remembered as a hearer of John the Apostle.",
          "That makes Irenaeus unusually close to apostolic memory: not in the same generation as the apostles, but close enough that his argument from public apostolic teaching has historical weight.",
        ],
      },
      {
        heading: "What documented means here",
        body: [
          "Documented does not mean modern video-level certainty. It means the relationship is directly attested in the ancient source base used by this dataset.",
          "For Polycarp and Irenaeus, the key evidence is Irenaeus's own memory of hearing Polycarp and his report that Polycarp had known John and others who had seen the Lord.",
        ],
      },
    ],
    figureIds: [
      "jesus-of-nazareth",
      "john-the-apostle",
      "polycarp-of-smyrna",
      "irenaeus-of-lyons",
    ],
    chainTargetId: "irenaeus-of-lyons",
    chainKind: "documented_only",
    relatedSlugs: ["who-taught-polycarp", "what-did-irenaeus-say-about-tradition"],
  },
  {
    slug: "was-the-trinity-invented-at-nicaea",
    title: "Was the Trinity invented at Nicaea?",
    description:
      "A plain-English answer tracing Trinitarian language and debate before and after the Council of Nicaea.",
    shortAnswer:
      "No. Nicaea did not invent the Trinity. It gave conciliar boundaries and vocabulary to a dispute about the Son's divinity that was already visible in earlier Christian writers.",
    sections: [
      {
        heading: "What Nicaea did",
        body: [
          "The Council of Nicaea in AD 325 answered the Arian controversy by confessing the Son as of the same substance as the Father.",
          "That was a formal council definition, not the first time Christians worshiped Christ or spoke of Father, Son, and Spirit.",
        ],
      },
      {
        heading: "The pre-Nicene trail",
        body: [
          "Ignatius, Justin, Irenaeus, Theophilus, Tertullian, and Origen all sit before Nicaea in the data. They do not use one identical later formula, but they show the question was already inside Christian theology.",
          "The post-Nicene figures, especially Athanasius and the Cappadocians, clarify and defend the Nicene settlement rather than starting from nothing.",
        ],
      },
    ],
    figureIds: [
      "ignatius-of-antioch",
      "justin-martyr",
      "irenaeus-of-lyons",
      "theophilus-of-antioch",
      "tertullian",
      "origen-of-alexandria",
      "athanasius-of-alexandria",
      "basil-of-caesarea",
      "gregory-of-nazianzus",
      "gregory-of-nyssa",
    ],
    relatedSlugs: ["church-fathers-timeline", "early-christian-heresies-mapped"],
  },
  {
    slug: "what-did-the-apostolic-fathers-believe",
    title: "What did the Apostolic Fathers believe?",
    description:
      "A beginner guide to Clement, Ignatius, Polycarp, Papias, Hermas, the Didache, and other earliest post-apostolic witnesses.",
    shortAnswer:
      "The Apostolic Fathers show a church already organized around bishops, worship, martyrdom, moral discipline, Scripture, and public teaching received from the apostles.",
    sections: [
      {
        heading: "Why this group is different",
        body: [
          "The Apostolic Fathers are the earliest Christian writers after the New Testament. They are close enough to the apostles that their testimony is often used as a bridge between Scripture and the later Fathers.",
          "They are not systematic theologians in the later academic sense. Their works are letters, exhortations, church orders, visions, and martyrdom accounts.",
        ],
      },
      {
        heading: "What to notice first",
        body: [
          "Clement shows Roman concern for order in another church. Ignatius strongly emphasizes the bishop, Eucharist, and unity. Polycarp anchors Smyrna to John and Irenaeus. The Didache shows early catechesis and worship practice.",
          "Read them as early witnesses, not as a finished medieval or modern theological manual.",
        ],
      },
    ],
    figureIds: [
      "clement-of-rome",
      "ignatius-of-antioch",
      "polycarp-of-smyrna",
      "papias-of-hierapolis",
      "hermas-of-rome",
      "didache-author",
      "pseudo-barnabas",
    ],
    relatedSlugs: ["who-taught-polycarp", "apostolic-succession-explained-simply"],
  },
  {
    slug: "who-taught-polycarp",
    title: "Who taught Polycarp?",
    description:
      "Polycarp's link to John the Apostle, why Irenaeus matters, and how the site grades that relationship.",
    shortAnswer:
      "The important ancient claim is that Polycarp was instructed by John the Apostle and by others who had seen the Lord. Irenaeus, who heard Polycarp as a young man, is the key witness.",
    sections: [
      {
        heading: "The basic chain",
        body: [
          "The chain is Jesus -> John -> Polycarp. Polycarp then becomes the bridge to Irenaeus.",
          "That is why Polycarp is one of the most important figures on the site even though only one short letter survives under his name.",
        ],
      },
      {
        heading: "Why Irenaeus is central",
        body: [
          "Irenaeus is not merely repeating a remote rumor. He describes remembering Polycarp's teaching from his own youth.",
          "Because of that, this dataset marks the John and Polycarp connection as documented rather than merely traditional.",
        ],
      },
    ],
    figureIds: ["jesus-of-nazareth", "john-the-apostle", "polycarp-of-smyrna", "irenaeus-of-lyons"],
    chainTargetId: "polycarp-of-smyrna",
    chainKind: "documented_only",
    relatedSlugs: ["shortest-chain-from-jesus-to-irenaeus", "what-did-the-apostolic-fathers-believe"],
  },
  {
    slug: "earliest-bishops-of-rome",
    title: "Who were the earliest bishops of Rome?",
    description:
      "A sourced guide to the earliest Roman episcopal succession in the patristic period.",
    shortAnswer:
      "In this dataset, the earliest Roman sequence begins with Peter, then Linus, Anacletus, and Clement of Rome. The early lists matter, but first- and second-century succession should be read with the evidence labels visible.",
    sections: [
      {
        heading: "The earliest names",
        body: [
          "The Roman succession is one of the most important ancient test cases for apostolic succession. Irenaeus appeals to Rome because its public succession list was already being used against secret gnostic claims.",
          "The earliest names are not all equally documented by contemporary records. The site separates documented links from traditional succession-list material.",
        ],
      },
      {
        heading: "How to read the list",
        body: [
          "Do not read a first-century succession list like a modern HR file. Read it as an ancient public memory used by later Christian writers to argue for continuity of teaching.",
          "For the stricter bishop-to-bishop view, use the Bishops page and the episcopal mode on figure pages.",
        ],
      },
    ],
    figureIds: [
      "peter-the-apostle",
      "linus-of-rome",
      "anacletus-of-rome",
      "clement-of-rome",
      "pope-anicetus",
      "pope-soter",
      "pope-eleutherius",
      "pope-victor-i",
    ],
    relatedSlugs: ["apostolic-succession-explained-simply", "what-did-irenaeus-say-about-tradition"],
  },
  {
    slug: "apostolic-succession-explained-simply",
    title: "Apostolic succession explained simply",
    description:
      "The difference between apostolic succession, episcopal succession, teaching transmission, and general influence.",
    shortAnswer:
      "Apostolic succession is the claim that the church's public teaching and ministry continue from the apostles through bishops. This site separates strict episcopal succession from broader transmission by teaching, citation, correspondence, and influence.",
    sections: [
      {
        heading: "The strict meaning",
        body: [
          "In the strict Catholic and Orthodox sense, succession is bishop-to-bishop continuity in an apostolic see or wider episcopal line.",
          "That is why the Bishops page only shows bishops grouped by city and ordered chronologically.",
        ],
      },
      {
        heading: "The broader transmission view",
        body: [
          "The homepage graph is broader. It includes teaching, correspondence, citation, opposition, ordination, baptism, and other historically meaningful links.",
          "That broader view is useful for learning. The strict episcopal view is useful when the question is formal succession.",
        ],
      },
    ],
    figureIds: [
      "peter-the-apostle",
      "clement-of-rome",
      "ignatius-of-antioch",
      "polycarp-of-smyrna",
      "irenaeus-of-lyons",
      "cyprian-of-carthage",
    ],
    relatedSlugs: ["earliest-bishops-of-rome", "shortest-chain-from-jesus-to-irenaeus"],
  },
  {
    slug: "church-fathers-timeline",
    title: "Church Fathers timeline",
    description:
      "A simple era-by-era timeline from Jesus and the apostles to John of Damascus.",
    shortAnswer:
      "The patristic timeline runs from the Apostolic age through the Apostolic Fathers, Apologists, Ante-Nicene writers, Nicene councils, Post-Nicene theologians, and early medieval transmitters.",
    sections: [
      {
        heading: "Read by era first",
        body: [
          "A timeline is easier than an alphabetized list. Start with the apostles, then the Apostolic Fathers, then the apologists and anti-heretical writers, then the council-era theologians.",
          "The site's era pages are built for that route, while individual figure pages give the chain and citations.",
        ],
      },
      {
        heading: "The basic shape",
        body: [
          "The first two centuries preserve memory and defend the faith. The third and fourth centuries sharpen doctrine under persecution and controversy. The fifth through eighth centuries preserve, synthesize, and transmit the settled tradition.",
        ],
      },
    ],
    figureIds: [
      "jesus-of-nazareth",
      "john-the-apostle",
      "polycarp-of-smyrna",
      "irenaeus-of-lyons",
      "origen-of-alexandria",
      "athanasius-of-alexandria",
      "augustine-of-hippo",
      "john-of-damascus",
    ],
    relatedSlugs: ["what-did-the-apostolic-fathers-believe", "best-church-fathers-to-read-first"],
  },
  {
    slug: "early-christian-heresies-mapped",
    title: "Early Christian heresies mapped",
    description:
      "A guided route through Marcion, Valentinus, Arius, Nestorius, Pelagius, and other disputed teachers in the patristic data.",
    shortAnswer:
      "The early church's doctrine often becomes clearest in controversy. Map the heresies by the question they raised and by the Fathers who answered them.",
    sections: [
      {
        heading: "Why include heretics at all",
        body: [
          "You cannot understand the Fathers by only listing approved writers. Much of patristic theology was written in response to rival teachings.",
          "Including heterodox figures makes the map more honest because it shows what the Fathers were arguing against and where those disputes happened.",
        ],
      },
      {
        heading: "How to use this route",
        body: [
          "Start with Marcion and the gnostic teachers for the second century, then move to Arius for Nicaea, Nestorius and Eutyches for Christology, and Pelagius for grace and sin.",
          "The connections marked opposed help show which Fathers and councils engaged each controversy.",
        ],
      },
    ],
    figureIds: [
      "marcion-of-sinope",
      "valentinus",
      "basilides",
      "arius",
      "apollinaris-of-laodicea",
      "nestorius",
      "eutyches",
      "pelagius",
      "irenaeus-of-lyons",
      "athanasius-of-alexandria",
      "augustine-of-hippo",
    ],
    relatedSlugs: ["was-the-trinity-invented-at-nicaea", "church-fathers-timeline"],
  },
  {
    slug: "what-did-irenaeus-say-about-tradition",
    title: "What did Irenaeus say about tradition?",
    description:
      "Why Irenaeus used public apostolic succession against secret gnostic claims.",
    shortAnswer:
      "Irenaeus argues that true apostolic teaching is public, traceable, and preserved in the churches founded by the apostles, rather than hidden in secret gnostic traditions.",
    sections: [
      {
        heading: "The argument",
        body: [
          "Irenaeus writes against teachers who claimed secret knowledge. His answer is historical and public: look at the churches, their bishops, and the teaching openly handed down from the apostles.",
          "Rome is especially important in his argument, but the logic is wider than Rome alone.",
        ],
      },
      {
        heading: "Why the Polycarp link matters",
        body: [
          "Irenaeus can also appeal to personal memory. He had heard Polycarp, and Polycarp was remembered as a hearer of John.",
          "That gives Irenaeus's anti-gnostic appeal a concrete human chain rather than an abstract appeal to institutional authority.",
        ],
      },
    ],
    figureIds: [
      "john-the-apostle",
      "polycarp-of-smyrna",
      "irenaeus-of-lyons",
      "peter-the-apostle",
      "linus-of-rome",
      "anacletus-of-rome",
      "clement-of-rome",
    ],
    chainTargetId: "irenaeus-of-lyons",
    chainKind: "documented_only",
    relatedSlugs: ["shortest-chain-from-jesus-to-irenaeus", "earliest-bishops-of-rome"],
  },
  {
    slug: "best-church-fathers-to-read-first",
    title: "Best Church Fathers to read first",
    description:
      "A practical first reading path through the Apostolic Fathers, Athanasius, Augustine, Irenaeus, and Chrysostom.",
    shortAnswer:
      "Start with the Apostolic Fathers for the earliest voice, Athanasius for Christology, Augustine for interior life and grace, Irenaeus for tradition, and John Chrysostom for preaching.",
    sections: [
      {
        heading: "A good first stack",
        body: [
          "Read the Apostolic Fathers to hear the generation just after the apostles. Then read Athanasius's On the Incarnation and Augustine's Confessions.",
          "After that, Irenaeus and Chrysostom help you move from beginner reading into the wider patristic world.",
        ],
      },
      {
        heading: "Use the site while reading",
        body: [
          "When a name appears, open the figure page and check the chain to Jesus, works, and documented connections.",
          "This keeps the Fathers from becoming isolated names and shows where each writer sits in the larger relay.",
        ],
      },
    ],
    figureIds: [
      "clement-of-rome",
      "ignatius-of-antioch",
      "polycarp-of-smyrna",
      "athanasius-of-alexandria",
      "augustine-of-hippo",
      "irenaeus-of-lyons",
      "john-chrysostom",
    ],
    relatedSlugs: ["church-fathers-timeline", "what-did-the-apostolic-fathers-believe"],
  },
];

export function getQuestionPage(slug: string): QuestionPage | undefined {
  return questionPages.find((page) => page.slug === slug);
}
