/** Content migrated from the current WordPress site (d4dx.co), October 2026. */

export const CATEGORIES = [
  { name: "Apps", slug: "app", description: "Flutter apps for Android and iOS.", order: 1 },
  { name: "Websites", slug: "web", description: "Websites and web applications.", order: 2 },
  { name: "ERP", slug: "erp", description: "Internal tools and business automation.", order: 3 },
  { name: "SaaS", slug: "saas", description: "Subscription software products.", order: 4 },
] as const;

export interface SeedProject {
  title: string;
  slug: string;
  category: (typeof CATEGORIES)[number]["slug"];
  client: string;
  date: string | null;
  summary: string;
  body: string;
  features: string[];
  platforms: ("android" | "ios" | "web")[];
  links: { playStore?: string; appStore?: string; website?: string };
  images: string[];
}

export const PROJECTS: SeedProject[] = [
  {
    title: "Hisaabi",
    slug: "hisaabi",
    category: "app",
    client: "D4DX",
    date: "2026-02-01",
    summary: "An Islamic lifestyle app built on Muhasabah, self-accountability: prayer tracking, Quran, duas, dhikr and Qibla in one place.",
    body: "<p>Hisaabi helps Muslims strengthen their daily connection with faith through Muhasabah, the practice of self-accountability. It combines practical tools that help people stay consistent in worship and improve their daily practice a little at a time.</p><p>Prayer tracking sits beside Quran reading, duas, dhikr, Qibla direction and activity monitoring, so one app carries the whole day.</p>",
    features: ["Prayer tracking", "Quran reading", "Duas and dhikr", "Qibla direction", "Daily activity monitoring"],
    platforms: ["android"],
    links: { playStore: "https://play.google.com/store/apps/details?id=app.hisaabi" },
    images: ["hisabi1a.avif", "hisabi1.avif", "hisabi2-2.avif", "hisabi3b-1.avif"],
  },
  {
    title: "Thanima Hajj & Umrah",
    slug: "thanima-hajj-umrah",
    category: "app",
    client: "Thanima",
    date: null,
    summary: "A pilgrim's companion for Makkah and Madinah: weather, camps, hospitals and helplines on the map, prayer times and Qibla, offline.",
    body: "<p>Thanima Hajj and Umrah is built for pilgrims travelling to Makkah and Madinah, many of them from Kerala. It puts the information a group needs in one place, verified by the group leaders, and keeps it available offline where the network is weak.</p><h2>On the ground</h2><p>Live weather for both cities, and GPS directions to the group's camps, buildings, hospitals and clinics, with official helplines one tap away.</p><h2>For worship</h2><p>Prayer times with notifications, a Qibla finder, a tasbeeh counter and the nearest mosques.</p>",
    features: ["Live weather for Makkah and Madinah", "Camps, buildings and hospitals on the map", "Official and group helplines", "Prayer times and notifications", "Qibla finder and tasbeeh counter", "Offline access"],
    platforms: ["android"],
    links: { playStore: "https://play.google.com/store/apps/details?id=com.thanimahajjumra.app" },
    images: ["hajj-app-2.avif", "hajj-app-4.avif", "hajj-app-3-1.avif"],
  },
  {
    title: "Thafheem ul Quran",
    slug: "thafheem-ul-quran-app",
    category: "app",
    client: "D4DX",
    date: "2021-01-01",
    summary: "Maulana Maududi's tafseer as a multilingual app: search across text, translation and commentary, Mushaf mode, offline reading.",
    body: "<p>Thafheem ul Quran is a widely used app for Quranic study based on the tafseer of Maulana Syed Abul Ala Maududi, on Android and iOS, in several languages.</p><p>Readers can search the Quran, its translation and the tafseer; keep unlimited bookmarks and continue from the last ayah; jump to any ayah or ruku; and share ayahs with or without translation. Mushaf mode recites alongside translation or tafseer, and a translation-only mode keeps reading focused. After the first download everything works offline.</p>",
    features: ["Complete tafseer by Maulana Maududi", "Search across Quran, translation and tafseer", "Arabic and Urdu fonts, dark and night themes", "Bookmarks, last-read and quick jump", "Mushaf and translation-only modes", "Offline reading", "Multilingual"],
    platforms: ["android", "ios"],
    links: { playStore: "https://play.google.com/store/apps/details?id=com.d4media.thafheem", website: "https://thafheem.net/" },
    images: ["thaf1.jpg", "1.avif", "3.avif", "5.avif"],
  },
  {
    title: "QSPOT",
    slug: "qspot",
    category: "app",
    client: "Quran Study Centre Kerala",
    date: null,
    summary: "An Islamic video streaming platform for Android and iOS that carries only authentic religious content.",
    body: "<p>QSPOT is a video streaming platform dedicated to the spiritual and intellectual journey of modern Muslims. Unlike general video services it carries only high-quality, authentic religious content, curated by the Quran Study Centre Kerala.</p>",
    features: ["Curated Islamic video library", "Streaming on Android and iOS"],
    platforms: ["android", "ios"],
    links: {
      playStore: "https://play.google.com/store/apps/details?id=co.d4dx.qspot",
      appStore: "https://apps.apple.com/in/app/qspot-ott/id6753100715",
    },
    images: ["q-spot1.avif", "q-spot-2.avif"],
  },
  {
    title: "Janaza Guide",
    slug: "janaza-guide",
    category: "app",
    client: "D4DX",
    date: null,
    summary: "Clear, step-by-step guidance on Islamic funeral rites for families at a difficult time, on Android and iOS.",
    body: "<p>At a sensitive and often overwhelming time, Janaza Guide gives families clear, detailed instructions on Islamic funeral rites, so every step follows Islamic law and tradition.</p>",
    features: ["Step-by-step funeral rites", "Duas for each stage", "Available on Android and iOS"],
    platforms: ["android", "ios"],
    links: {
      playStore: "https://play.google.com/store/apps/details?id=co.d4dx.janazaguide",
      appStore: "https://apps.apple.com/in/app/janaza-guide/id6742624606",
    },
    images: ["janazaguide1.avif"],
  },
  {
    title: "Thafheem ul Quran website",
    slug: "thafheem-website",
    category: "web",
    client: "D4DX",
    date: null,
    summary: "thafheem.net: the full tafseer online in several languages, with audio commentary and search.",
    body: "<p>Thafheem.net is the official website of Thafheem ul Quran, the Quranic exegesis by Maulana Syed Abul Ala Maududi. It gives access to the full tafseer in several languages, with audio lectures and explanations and a search across the text.</p>",
    features: ["Complete tafseer online", "Audio commentary", "Search across verses and topics"],
    platforms: ["web"],
    links: { website: "https://thafheem.net/" },
    images: ["thaf-web.avif"],
  },
  {
    title: "Zai Toon Kids",
    slug: "zai-toon-kids",
    category: "app",
    client: "D4DX",
    date: "2024-11-01",
    summary: "Illustrated stories for children aged five and up, in Malayalam and English, with interactive pages that build a reading habit.",
    body: "<p>Zai Toon Kids is a story-reading app for children aged five and up, in Malayalam and English. Colourful illustrations and interactive elements make each story memorable and encourage a daily reading habit.</p>",
    features: ["Stories in Malayalam and English", "Illustrated, interactive pages", "Made for ages 5+"],
    platforms: ["android"],
    links: { playStore: "https://play.google.com/store/apps/details?id=co.d4dx.zaitoon" },
    images: ["zaitoon1b.avif", "zaitoon2b.avif", "zaitoon3b.avif"],
  },
  {
    title: "Hira Plus",
    slug: "hira-plus",
    category: "app",
    client: "Hira Centre",
    date: null,
    summary: "Mess management for an office: staff mark breakfast, lunch and dinner in advance, so the kitchen cooks what will be eaten.",
    body: "<p>Hira Plus is a mess management and food-marking app for office environments. Staff mark their meals in advance for each day and each slot, breakfast, lunch and dinner, which cuts food waste and lets the mess plan exactly.</p>",
    features: ["Meal marking per day and slot", "Monthly meal counts", "Less food waste"],
    platforms: ["android"],
    links: { playStore: "https://play.google.com/store/apps/details?id=com.d4dx.hiraplus" },
    images: ["hira.avif", "hira2.avif"],
  },
  {
    title: "Quran Lalithasaram",
    slug: "quran-lalithasaram-app",
    category: "app",
    client: "D4DX",
    date: "2020-01-01",
    summary: "The Quran with Lalithasaram's plain Malayalam translation, recitations, bookmarks, notes and search, readable offline.",
    body: "<p>Quran Lalithasaram makes reading and understanding the Quran simple for readers of every age: clear Arabic script with adjustable sizes, high-quality recitations, bookmarks and personal notes, search, and offline access.</p>",
    features: ["Clear Arabic text, adjustable size", "Audio recitations", "Bookmarks and notes", "Search", "Offline access"],
    platforms: ["android"],
    links: { playStore: "https://play.google.com/store/apps/details?id=com.d4media.lalithasaram", website: "https://lalithasaram.net/" },
    images: ["lali-app.avif", "lali-app-2.avif", "lali-app3.avif"],
  },
  {
    title: "Al Quran Malayalam",
    slug: "al-quran-malayalam",
    category: "app",
    client: "Prof. V. Mohammed",
    date: "2020-01-01",
    summary: "The Quran's Malayalam translation with word-by-word meanings, bookmarks and offline reading.",
    body: "<p>Al Quran Malayalam brings an accurate, easy Malayalam translation of the Quran to Malayalam-speaking readers, with the meaning of each word in every verse, bookmarks for favourite verses and full offline reading.</p>",
    features: ["Complete Malayalam translation", "Word-by-word meanings", "Bookmarks", "Offline access"],
    platforms: ["android"],
    links: { playStore: "https://play.google.com/store/apps/details?id=com.d4media.AlQuranMalayalam", website: "https://alquranmalayalam.net/" },
    images: ["alquran.jpg", "alquran2.jpg", "alquran3.jpg"],
  },
  {
    title: "Quran Lalithasaram website",
    slug: "lalithasaram-website",
    category: "web",
    client: "D4DX",
    date: null,
    summary: "lalithasaram.net: the Malayalam translation online, organised by topic, with audio recitations.",
    body: "<p>Quran Lalithasaram's website gives the full Malayalam translation online, with topic-based sections on faith, family and society, and an audio section for recitations and translations.</p>",
    features: ["Complete Quran in Malayalam", "Topic-based navigation", "Audio recitations"],
    platforms: ["web"],
    links: { website: "https://lalithasaram.net/" },
    images: ["lalithasaram-web2.avif"],
  },
];

export const SERVICES = [
  {
    title: "Mobile apps",
    slug: "mobile-apps",
    summary: "Flutter apps for Android and iOS from one codebase, with the API and cloud backend behind them. Offline reading, prayer-time notifications, maps and video streaming have all shipped.",
    proof: "Thafheem ul Quran, Hisaabi, Janaza Guide and QSPOT are live on Google Play and the App Store.",
    points: ["Cross-platform apps for iOS and Android", "API integration and cloud backend", "Store listings and release management"],
    proofProjectSlug: "hisaabi",
  },
  {
    title: "Websites and web apps",
    slug: "websites",
    summary: "Fast sites your team can update themselves: WordPress where it fits, custom-coded React and Next.js where it doesn't, with UI and UX design done in house.",
    proof: "thafheem.net and lalithasaram.net serve the full Quran text, audio and search.",
    points: ["Website design and development", "WordPress and custom-coded sites", "UI/UX design", "Hosting and maintenance"],
    proofProjectSlug: "thafheem-website",
  },
  {
    title: "ERP and automation",
    slug: "erp",
    summary: "Internal tools that replace spreadsheets and paper: meal marking, approvals, stock and staff records, built around how your office already works.",
    proof: "Hira Plus runs daily meal planning for the staff of Hira Centre.",
    points: ["Custom business automation", "Role-based staff apps", "Reports your managers read"],
    proofProjectSlug: "hira-plus",
  },
  {
    title: "SaaS products",
    slug: "saas",
    summary: "Subscription products with sign-up, payments and an admin, built to grow from the first customer to the thousandth.",
    proof: "QSPOT streams curated Islamic video to its subscribers on Android and iOS.",
    points: ["Product design and MVP", "Accounts, billing and admin", "Scaling and monitoring"],
    proofProjectSlug: "qspot",
  },
];

export const TEAM = [
  { name: "Shameer Babu", role: "CEO", photo: "shameer.avif" },
  { name: "KA Naser", role: "HR and Admin", photo: "nasar.avif" },
  { name: "Safeer K K", role: "Digital Product Designer", photo: "safeer.avif" },
  { name: "Jahfar Swadikh K", role: "MERN Stack Developer", photo: "jahfer.avif" },
  { name: "Muhammed Ilyas MK", role: "MERN Stack Developer", photo: "illyas1-1.avif" },
  { name: "Muhammed Nihal M", role: "Flutter Developer", photo: "nihal.avif" },
  { name: "Shamil Thasneem TM", role: "Business Executive", photo: "shamil.avif" },
  { name: "Shahjaz Saleem", role: "Flutter Developer", photo: "shahjaz-1.avif" },
  { name: "Risha Mariyam KV", role: "Quality Analyst Intern", photo: "risha.avif" },
  { name: "Shanida", role: "MERN Stack Intern", photo: "shahida2.avif" },
  { name: "Aliya Rasheed", role: "Flutter Intern", photo: "aliya2.avif" },
  { name: "Suhana RS", role: "ERP Executive Intern", photo: "suhana.avif" },
  { name: "Jahana Sherin KJ", role: "Quality Analyst Intern", photo: "jahan.avif" },
];

export const TESTIMONIALS = [
  {
    quote: "Very useful, and highly recommended.",
    name: "Syed Sadatullah Husaini",
    role: "Ameer, JIH",
    context: "On the Thafheem ul Quran multilingual app, for bringing Maulana Maududi's tafseer to a modern, interactive format.",
    projectSlug: "thafheem-ul-quran-app",
  },
  {
    quote: "A reliable and helpful app for Quranic study.",
    name: "T. Arif Ali",
    role: "Secretary General, JIH",
    context: "On Thafheem ul Quran, praising its continuous updates and how it responds to feedback.",
    projectSlug: "thafheem-ul-quran-app",
  },
];

export const JOBS = [
  {
    title: "Flutter Developer",
    slug: "flutter-developer",
    level: "Experienced",
    experience: "1+ year",
    location: "Calicut, on site",
    summary: "Build and ship cross-platform apps in Dart and Flutter for Android and iOS, working on live projects for clients in India and abroad.",
    requirements: [
      "Proficiency in Dart and cross-platform mobile development with Flutter",
      "At least a year of building and shipping mobile apps",
      "State management with GetX or Bloc is a plus",
    ],
  },
];

export const SETTINGS = {
  tagline: "We build mobile apps, websites, ERP and SaaS from our studio on Mavoor Road, Calicut.",
  email: "info@d4dx.co",
  careersEmail: "admin@d4dx.co",
  phone: "+91 98958 04006",
  careersPhone: "+91 99466 66139",
  whatsapp: "919895804006",
  addressLines: ["AMH Tower, First Floor, 63/3965 B", "Mavoor Road, Thiruthiyad", "Kozhikode, Kerala 673004"],
  mapUrl: "https://maps.app.goo.gl/Y3mnkw77rmNgYBkr5",
  socials: {
    linkedin: "https://www.linkedin.com/company/d4dx-innovations",
    instagram: "https://www.instagram.com/d4dx.co/",
    facebook: "https://www.facebook.com/profile.php?id=61566573721379",
  },
};
