import type { Post, RoleDef, Service, Settings } from "./types";
import { ACTION_PERMS, PAGE_PERMS } from "./types";
import { SERVICE_STOCK, STOCK } from "./stock";

/**
 * Default catalog. Prices are starting values in EGP — the owner edits them
 * (and everything else here) from Dashboard › Services. Once edited, the
 * stored version replaces this list.
 */
const s = (x: Partial<Service> & Pick<Service, "id" | "category" | "name" | "price">, i: number): Service => ({
  short: "", description: "", includes: [], duration: "", unit: "per person", scene: "reef",
  requiresConsent: true, slots: ["09:00"], capacity: 8, active: true, sort: i, ...x
});

export const DEFAULT_SERVICES: Service[] = [
  // ——— Certification courses ———
  { id: "dsd", category: "course", name: "Discover Scuba — intro dive", price: 3000, duration: "Half day · 1 dive",
    short: "Your first breath underwater, one-to-one with an instructor.",
    description: "A short briefing on land, skills practice in shallow water, then a guided dive on the Lighthouse reef to a maximum of 12 m. No experience needed — just basic comfort in water.",
    includes: ["Instructor 1:2 ratio", "Full equipment", "Theory briefing", "Photos on request"], scene: "diver", minAge: 10, level: "Beginner", badge: "First timers", slots: ["09:00", "13:00"], capacity: 4 },
  { id: "owd", category: "course", name: "Open Water Diver", price: 20000, duration: "3–4 days · 4 open-water dives",
    short: "The internationally recognised licence to dive anywhere in the world to 18 m.",
    description: "Theory (eLearning or classroom), confined-water skills, and four open-water training dives on Dahab's calm shore sites. You finish certified to dive with a buddy to 18 m.",
    includes: ["Digital learning materials", "International certification card", "All equipment", "4 open-water dives", "Logbook"], scene: "classroom", minAge: 10, level: "Beginner", badge: "Most booked", capacity: 4 },
  { id: "aowd", category: "course", name: "Advanced Open Water", price: 18000, duration: "2 days · 5 adventure dives",
    short: "Deep, navigation and three adventures — including the Canyon.",
    description: "Five adventure dives: Deep and Underwater Navigation plus three electives such as the Canyon, Bells to Blue Hole, night or buoyancy. Certifies you to 30 m.",
    includes: ["5 adventure dives", "Certification card", "Equipment", "Transport to dive sites"], scene: "canyon", minAge: 12, level: "Certified", capacity: 4 },
  { id: "combo", category: "course", name: "Open Water + Advanced package", price: 30000, duration: "5–6 days · 9 dives",
    short: "Zero to 30 m in under a week. Our best-value bundle.",
    description: "Both courses back to back with the same instructor. Finish with an Advanced dive at Bells to Blue Hole — the classic Dahab graduation dive.",
    includes: ["Both certification cards", "9 dives", "Equipment", "Transport", "Lunch at Blue Hole"], scene: "bluehole", minAge: 12, level: "Beginner", badge: "Best value", capacity: 4 },
  { id: "rescue", category: "course", name: "Rescue Diver + First Aid", price: 24000, duration: "3–4 days",
    short: "Learn to prevent and manage problems — the course divers call the most rewarding.",
    description: "Self-rescue, recognising diver stress, emergency management and rescue scenarios, with Emergency First Response (CPR & first aid) included.",
    includes: ["Rescue + EFR certification", "Scenarios & dives", "Equipment", "Pocket mask"], scene: "reef", minAge: 12, level: "Advanced", capacity: 4 },
  { id: "nitrox", category: "course", name: "Enriched Air (Nitrox)", price: 8500, duration: "1 day · 2 dives",
    short: "Longer no-stop times and shorter surface intervals.",
    description: "Theory, analysing your own tank and two Nitrox dives. The most popular specialty in Dahab.",
    includes: ["Certification card", "2 Nitrox fills", "Equipment"], scene: "gear", minAge: 12, level: "Certified", capacity: 6 },
  { id: "refresh", category: "course", name: "Scuba Refresher", price: 3500, duration: "Half day · 1 dive",
    short: "Haven't dived in a while? Brush up your skills first.",
    description: "Review of skills and equipment set-up in shallow water, followed by a relaxed reef dive.",
    includes: ["Instructor", "Equipment", "1 dive"], scene: "turtle", level: "Certified", capacity: 4 },
  { id: "dm", category: "course", name: "Divemaster internship", price: 55000, duration: "4–6 weeks",
    short: "Your first professional level. Live in Dahab and train with our team.",
    description: "Mentored internship covering dive leadership, assisting courses, mapping a dive site and stamina tests. Price excludes membership fees.",
    includes: ["Unlimited training dives", "Mentoring", "Equipment during training"], scene: "bells", minAge: 18, level: "Pro", badge: "Pro", slots: ["Flexible"], capacity: 2 },

  // ——— Guided / fun dives ———
  { id: "shore", category: "fun", name: "Guided shore dive", price: 1800, unit: "per dive", duration: "1 dive · ~50 min",
    short: "Lighthouse, Eel Garden, Islands — reef straight from the beach.",
    description: "Dahab is famous for shore diving. Your guide picks the site for the day's conditions and your level.",
    includes: ["Guide", "Tank & weights", "Transport"], scene: "reef", level: "Certified", slots: ["08:30", "11:00", "14:00"] },
  { id: "bh-dive", category: "fun", name: "Bells to Blue Hole dive day", price: 4200, duration: "Full day · 2 dives",
    short: "Drop through the Bells chimney, drift along the wall, finish across the Blue Hole saddle.",
    description: "Dahab's signature dive followed by a second dive at Blue Hole. Advanced certification (or deep experience) recommended for the Bells.",
    includes: ["2 guided dives", "Transport", "Lunch at Blue Hole", "Park fees"], scene: "bells", level: "Advanced", badge: "Signature" },
  { id: "canyon-dive", category: "fun", name: "Canyon dive", price: 2200, unit: "per dive", duration: "1 dive",
    short: "Swim through a narrow crack in the reef lit by shafts of sunlight.",
    description: "A dramatic reef canyon a short drive north of town. Recommended for Advanced divers.",
    includes: ["Guide", "Tank & weights", "Transport"], scene: "canyon", level: "Advanced" },
  { id: "pack10", category: "fun", name: "10-dive package", price: 15000, unit: "package", duration: "Use within 7 days",
    short: "Best price per dive for certified divers on holiday.",
    description: "Ten guided dives at the sites of your choice, including Blue Hole and Canyon.",
    includes: ["10 dives", "Guide", "Tanks & weights", "Transport"], scene: "turtle", level: "Certified", slots: ["08:30"] },

  // ——— Dahab trips ———
  { id: "bh-snorkel", category: "tour", name: "Blue Hole & Bells snorkel day", price: 1500, duration: "6 hours",
    short: "Snorkel the edge of the world's most famous sinkhole.",
    description: "Pick-up from your hotel, snorkel the coral rim of the Blue Hole and the reef at Bells, lunch at a beach café, and free time in the sun.",
    includes: ["Hotel pick-up", "Snorkel set", "Guide", "Lunch", "Park entrance"], scene: "bluehole", minAge: 6, badge: "Classic", slots: ["09:30"], capacity: 14 },
  { id: "pools", category: "tour", name: "Three Pools & Wadi Gnai", price: 1300, duration: "5 hours",
    short: "Three natural coral pools with sandy bottoms, then a palm oasis in the wadi.",
    description: "South of town, three shallow lagoons ringed by coral make the calmest snorkelling in Dahab. Add a horse or camel ride along the coast, then visit the small oasis of Wadi Gnai.",
    includes: ["Transport", "Snorkel set", "Guide", "Bedouin tea"], scene: "pools", minAge: 5, slots: ["09:00", "14:00"], capacity: 14 },
  { id: "lagoon", category: "tour", name: "Blue Lagoon & Ras Abu Galum", price: 2200, duration: "Full day",
    short: "Boat from Blue Hole into a protected area with no road access.",
    description: "Take a small boat north from Blue Hole to the Ras Abu Galum protectorate, snorkel untouched reef and relax at the turquoise Blue Lagoon in a Bedouin camp.",
    includes: ["Transport to Blue Hole", "Boat both ways", "Snorkel set", "Lunch", "Protectorate fees"], scene: "lagoon", minAge: 6, slots: ["09:00"], capacity: 12 },
  { id: "tawilat", category: "tour", name: "Gabal El Tawilat night", price: 1800, duration: "Evening · 5 hours",
    short: "4×4 into the mountains, the suspension bridge, Bedouin tea and a sky full of stars.",
    description: "A winding desert drive into the Tawilat mountains, a walk across the hanging bridge between peaks, then Bedouin tea, dinner and music around the fire under the stars.",
    includes: ["4×4 transport", "Guide", "Bedouin dinner & tea", "Camp entrance"], scene: "tawilat", requiresConsent: false, badge: "After dark", slots: ["17:00"], capacity: 16 },
  { id: "ghazala", category: "tour", name: "Wadi El Ghazala sunset safari", price: 1600, duration: "4 hours",
    short: "Golden canyon walls, quiet sand and sunset tea with a Bedouin guide.",
    description: "Drive out into the desert valleys behind Dahab, walk between the rock walls with a local guide and watch the sunset over the mountains with tea on the fire.",
    includes: ["4×4 transport", "Bedouin guide", "Tea & snacks"], scene: "ghazala", requiresConsent: false, slots: ["14:30"], capacity: 16 },
  { id: "sinai", category: "tour", name: "Mount Sinai sunrise & St Catherine", price: 2500, duration: "Overnight · 10 hours",
    short: "Night hike up the mountain to watch the sun rise over Sinai.",
    description: "Leave Dahab late at night, hike with a Bedouin guide under the stars and reach the summit for sunrise. Visit St Catherine's Monastery on the way back when it is open.",
    includes: ["Transport", "Bedouin guide", "Entrance fees"], scene: "sinai", requiresConsent: false, slots: ["23:00"], capacity: 14 },
  { id: "colored", category: "tour", name: "Colored Canyon trek", price: 2500, duration: "Full day",
    short: "Squeeze between canyon walls striped in red, gold and violet.",
    description: "A jeep ride into the desert followed by an easy-to-moderate trek through the Colored Canyon, with lunch at a Bedouin camp.",
    includes: ["4×4 transport", "Guide", "Lunch", "Entrance"], scene: "wadi", requiresConsent: false, slots: ["08:00"], capacity: 14 },
  { id: "weshwash", category: "tour", name: "Wadi El Weshwash pools", price: 2000, duration: "Full day",
    short: "Hike to fresh-water pools hidden between granite walls.",
    description: "A desert drive and a rocky hike to natural pools carved by flash floods — swim in fresh water in the middle of the mountains.",
    includes: ["4×4 transport", "Guide", "Lunch"], scene: "wadi", requiresConsent: false, slots: ["07:30"], capacity: 12 },

  // ——— Rentals ———
  { id: "r-full", category: "rental", name: "Full scuba set", price: 1200, unit: "per day", duration: "Daily", short: "BCD, regulator, wetsuit, mask, fins, computer.", description: "Everything except the tank. Serviced and rinsed after every use.", includes: ["BCD", "Regulator + octopus", "Wetsuit 3/5 mm", "Mask & fins", "Dive computer"], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, badge: "Save 30%" },
  { id: "r-bcd", category: "rental", name: "BCD", price: 400, unit: "per day", duration: "Daily", short: "Jacket-style, sizes XS–XXL.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20 },
  { id: "r-reg", category: "rental", name: "Regulator set", price: 450, unit: "per day", duration: "Daily", short: "1st & 2nd stage, octopus, SPG.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20 },
  { id: "r-suit", category: "rental", name: "Wetsuit 3 mm / 5 mm", price: 250, unit: "per day", duration: "Daily", short: "Choose 5 mm in winter months.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 30 },
  { id: "r-comp", category: "rental", name: "Dive computer", price: 400, unit: "per day", duration: "Daily", short: "Air & Nitrox compatible.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 12 },
  { id: "r-mask", category: "rental", name: "Mask, snorkel & fins", price: 150, unit: "per day", duration: "Daily", short: "Also for snorkellers.", description: "", includes: [], scene: "pools", requiresConsent: false, slots: ["08:00"], capacity: 40 },
  { id: "r-torch", category: "rental", name: "Dive torch", price: 200, unit: "per day", duration: "Daily", short: "For night dives and the Canyon.", description: "", includes: [], scene: "night", requiresConsent: false, slots: ["08:00"], capacity: 10 },
  { id: "r-tank", category: "rental", name: "Tank fill — air / Nitrox", price: 250, unit: "per fill", duration: "Per fill", short: "12 L or 15 L aluminium. Nitrox +150 EGP.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 40 },
  { id: "r-cam", category: "rental", name: "Action camera + housing", price: 600, unit: "per day", duration: "Daily", short: "Film your own reel underwater.", description: "", includes: [], scene: "turtle", requiresConsent: false, slots: ["08:00"], capacity: 4 },

  // ——— Add-ons (offered in the trip cart) ———
  { id: "t-sharm", category: "addon", name: "Sharm El Sheikh airport transfer", price: 2500, unit: "per car, one way", duration: "About 1.5 hours", short: "Private car between Sharm airport and your hotel in Dahab.", description: "", includes: ["Up to 4 people", "Meet and greet"], scene: "sinai", requiresConsent: false, slots: ["Any time"], capacity: 10 },
  { id: "t-hotel", category: "addon", name: "Hotel pick-up and drop-off", price: 150, unit: "per person", duration: "In Dahab", short: "We collect you from your hotel or camp in Dahab.", description: "", includes: [], scene: "lagoon", requiresConsent: false, slots: ["Any time"], capacity: 40 },
  { id: "photos", category: "addon", name: "Photo and video package", price: 1500, unit: "per booking", duration: "Delivered within 48 h", short: "All the photos and clips our team takes of you, in full quality.", description: "", includes: ["Edited reel", "All photos in full resolution"], scene: "turtle", requiresConsent: false, slots: ["Any time"], capacity: 99 },
  { id: "lunch", category: "addon", name: "Beach lunch", price: 350, unit: "per person", duration: "Dive days", short: "Lunch at a beach café between dives.", description: "", includes: [], scene: "pools", requiresConsent: false, slots: ["Any time"], capacity: 40 }
].map((x, i) => s({ mediaUrl: SERVICE_STOCK[(x as Service).id], ...(x as Service) }, i));

export const CATEGORY_LABEL: Record<string, string> = {
  course: "Courses", fun: "Guided dives", tour: "Dahab trips", rental: "Rentals", addon: "Extras"
};

export const DEFAULT_SETTINGS: Settings = {
  centerName: "Dahab Days Diving Center",
  phone: "+20 100 051 5039",
  whatsapp: "201000515039",
  email: "info@dahabdays.com",
  address: "Dahab, South Sinai, Egypt",
  instagram: "",
  gatewayFeePct: 2.75,
  gatewayFixed: 3,
  centerSigner: "",
  centerSignature: "",
  adminPin: "dahab",
  ownerPhone: "+20 100 051 5039",
  ownerEmail: "",
  depositPct: 25,
  rates: { USD: 50, EUR: 58 },
  photoPackagePrice: 1500,
  pixelId: "",
  ga4Id: "",
  googleReviewsUrl: "",
  freeCancelHours: 48,
  heroVideo: STOCK.heroVideo
};

/** Medical questionnaire — any YES means a physician's written approval is needed before water activities. */
export const MEDICAL_QUESTIONS: { id: string; en: string; ar: string }[] = [
  { id: "heart", en: "Have you ever had a heart attack, heart disease, heart surgery or chest pain on exertion?", ar: "هل أُصبت من قبل بأزمة قلبية أو مرض في القلب أو أجريت جراحة في القلب أو تشعر بألم في الصدر عند المجهود؟" },
  { id: "bp", en: "Do you have high blood pressure or take medicine to control it?", ar: "هل تعاني من ارتفاع ضغط الدم أو تتناول دواءً له؟" },
  { id: "lungs", en: "Have you had asthma, wheezing, a collapsed lung or any other lung disease?", ar: "هل عانيت من الربو أو صفير الصدر أو انخماص الرئة أو أي مرض رئوي آخر؟" },
  { id: "seizure", en: "Have you had epilepsy, seizures, fainting or blackouts?", ar: "هل عانيت من الصرع أو التشنجات أو الإغماء أو فقدان الوعي؟" },
  { id: "diabetes", en: "Do you have diabetes?", ar: "هل أنت مصاب بالسكري؟" },
  { id: "ears", en: "Do you have ear or sinus problems, hearing loss or have you had ear surgery?", ar: "هل لديك مشاكل في الأذن أو الجيوب الأنفية أو ضعف في السمع أو أجريت جراحة في الأذن؟" },
  { id: "surgery", en: "Have you had back or spine problems, or any surgery in the last 12 months?", ar: "هل تعاني من مشاكل في الظهر أو العمود الفقري، أو أجريت أي جراحة خلال الـ ١٢ شهراً الماضية؟" },
  { id: "dcs", en: "Have you ever had decompression sickness or a diving accident?", ar: "هل أُصبت من قبل بمرض تخفيف الضغط أو تعرضت لحادث غوص؟" },
  { id: "head", en: "Have you had a head injury with loss of consciousness in the last 5 years?", ar: "هل تعرضت لإصابة في الرأس مع فقدان للوعي خلال الـ ٥ سنوات الماضية؟" },
  { id: "pregnant", en: "Are you pregnant, or could you be pregnant?", ar: "هل أنتِ حامل أو يُحتمل أن تكوني حاملاً؟" },
  { id: "mental", en: "Do you have panic attacks, claustrophobia, or a mental-health condition that affects you in stressful situations?", ar: "هل تعاني من نوبات هلع أو رهاب الأماكن المغلقة أو حالة نفسية تؤثر عليك في المواقف الضاغطة؟" },
  { id: "meds", en: "Do you regularly take prescription medication (other than contraceptives)?", ar: "هل تتناول بانتظام أدوية بوصفة طبية (غير موانع الحمل)؟" },
  { id: "age45", en: "Are you over 45 and smoke, have high cholesterol, or a family history of heart attack or stroke?", ar: "هل عمرك فوق ٤٥ عاماً وتدخن أو لديك ارتفاع في الكوليسترول أو تاريخ عائلي لأزمات قلبية أو سكتات دماغية؟" },
  { id: "swim", en: "Are you uncomfortable in water, or unable to swim 200 m?", ar: "هل تشعر بعدم الارتياح في الماء أو لا تستطيع السباحة لمسافة ٢٠٠ متر؟" },
  { id: "unwell", en: "Are you unwell right now (cold, flu, congestion, ear pain)?", ar: "هل تشعر بتوعك حالياً (برد، إنفلونزا، احتقان، ألم في الأذن)؟" }
];

export const ACKNOWLEDGEMENTS: { id: string; en: string; ar: string; required: boolean }[] = [
  { id: "truth", required: true, en: "My answers are true and complete. I will tell the staff immediately if my health changes.", ar: "إجاباتي صحيحة وكاملة، وسأبلغ الفريق فوراً بأي تغيير في حالتي الصحية." },
  { id: "risk", required: true, en: "I understand that diving and snorkelling carry risks, including decompression sickness, drowning and injury, and I take part voluntarily.", ar: "أدرك أن الغوص والسنوركلينج ينطويان على مخاطر منها مرض تخفيف الضغط والغرق والإصابات، وأشارك بإرادتي." },
  { id: "rules", required: true, en: "I will follow the briefings and my instructor's or guide's instructions, and dive within my training and certification limits.", ar: "سألتزم بالتعليمات وإرشادات المدرب أو المرشد، وأغوص في حدود تدريبي وشهادتي." },
  { id: "clearance", required: true, en: "If I answered YES to any medical question, I will provide a doctor's written approval before entering the water.", ar: "إذا أجبت بـ «نعم» على أي سؤال طبي، سأقدم موافقة كتابية من الطبيب قبل النزول إلى الماء." },
  { id: "fly", required: true, en: "I will not fly for at least 18 hours after diving (24 hours after several days of diving).", ar: "لن أسافر بالطائرة قبل مرور ١٨ ساعة على الأقل بعد الغوص (٢٤ ساعة بعد عدة أيام من الغوص)." },
  { id: "release", required: true, en: "I release Dahab Days Diving Center, its staff and instructors from liability for injury or loss arising from my participation, except in cases of gross negligence, to the extent permitted by law.", ar: "أُعفي مركز داهب دايز للغوص وفريقه ومدربيه من المسؤولية عن أي إصابة أو خسارة ناتجة عن مشاركتي، باستثناء حالات الإهمال الجسيم، وفي الحدود التي يسمح بها القانون." },
  { id: "medical", required: true, en: "I consent to emergency first aid, medical treatment and evacuation if needed, at my own cost.", ar: "أوافق على تقديم الإسعافات الأولية والعلاج الطبي والإخلاء في حالات الطوارئ عند الحاجة وعلى نفقتي." },
  { id: "media", required: false, en: "Photos and videos of me may be used on Dahab Days social media and website (optional).", ar: "يمكن استخدام صوري ومقاطع الفيديو الخاصة بي على مواقع داهب دايز وحساباتها (اختياري)." }
];

export const FAQ = [
  { q: "Who are you?", a: "A family-run dive center in Dahab. Our motto is on the door: come as a guest, leave as a family member." },
  { q: "Do I need to be a strong swimmer?", a: "For an intro dive you only need to be comfortable in water. For the Open Water course you'll swim 200 m (any stroke, no time limit) and float for 10 minutes." },
  { q: "What is the minimum age?", a: "Children can start from 10 years old for most courses and intro dives. Snorkelling trips welcome younger kids with a parent." },
  { q: "Why do I need to sign the medical form?", a: "Diving puts pressure on your ears, lungs and heart. The questionnaire protects you. If you answer yes to anything, a quick doctor's note is usually all you need." },
  { q: "Can I fly after diving?", a: "Wait at least 18 hours after diving before you fly, and 24 hours after several days of diving. Plan your last dive the day before your flight." },
  { q: "How do I pay?", a: "Pay online by card or mobile wallet through Paymob when you book, or reserve now and pay at the center." },
  { q: "What should I bring?", a: "Swimwear, towel, sunscreen (reef-safe if you can), your certification card and logbook if you have them. We provide all dive equipment." }
];

/** Starter blog posts — dive-site and trip guides the owner can edit in Dashboard › Blog */
export const DEFAULT_POSTS: Post[] = [
  { id: "p-bluehole", slug: "blue-hole-dahab-guide", category: "Dive site guide", scene: "bluehole", cover: STOCK.dahabWaves, published: true, date: "2026-11-01",
    title: "The Blue Hole, Dahab: a diver's guide", titleAr: "البلو هول في دهب: دليل الغواص",
    excerpt: "What the Blue Hole is, how the Bells to Blue Hole dive works, and who should dive it.",
    body: "## What it is\nThe Blue Hole is a submarine sinkhole about 12 km north of Dahab, on the road to Ras Abu Galum. The reef around its rim is one of the best snorkelling spots in town.\n\n## The classic dive: Bells to Blue Hole\nMost divers enter at the Bells, a short walk north, drop down a narrow chimney, drift along the outer wall and cross into the Blue Hole over the shallow saddle. It's a beautiful, relaxed dive when it's done within recreational limits.\n\n## Who should dive it\n- Snorkellers: everyone who's comfortable in water.\n- The Bells: Advanced Open Water, or plenty of experience, with a local guide.\n- Never go below your training limits. The Blue Hole is deep and has claimed experienced divers who did.\n\n## Book it\nJoin our **Bells to Blue Hole dive day** or the **Blue Hole & Bells snorkel day**." },
  { id: "p-threepools", slug: "three-pools-dahab", category: "Trip guide", scene: "pools", cover: STOCK.dahabBoatBlue, published: true, date: "2026-11-05",
    title: "Three Pools: Dahab's calmest snorkelling", titleAr: "الثري بولز: أهدأ سنوركلينج في دهب",
    excerpt: "Three natural coral pools south of town, perfect for families and first-timers.",
    body: "## Why go\nSouth of Dahab, three shallow pools with sandy bottoms sit inside a ring of coral. They're sheltered, clear and calm, which makes them ideal for children and nervous swimmers.\n\n## Make a day of it\nCombine the pools with a horse or camel ride along the coast and a visit to the palm oasis of Wadi Gnai.\n\n## What to bring\n- Reef-safe sunscreen and a hat\n- Water shoes for the rocky entry\n- We bring the snorkel gear" },
  { id: "p-tawilat", slug: "gabal-el-tawilat-night", category: "Trip guide", scene: "tawilat", cover: STOCK.mountainSunset, published: true, date: "2026-11-10",
    title: "A night at Gabal El Tawilat", titleAr: "ليلة في جبل الطويلات",
    excerpt: "A 4×4 drive into the mountains, a hanging bridge, Bedouin tea and the stars.",
    body: "## The drive\nThe road into the Tawilat mountains is a winding desert track of about 25 km, done in a 4×4.\n\n## The bridge\nAt the camp, a suspension bridge links two peaks. Walking across it at sunset is the highlight for most people.\n\n## The evening\nBedouin tea, dinner around the fire, music and a sky full of stars. Bring a warm layer: the desert gets cold after dark, especially in winter." }
];

/** Built-in roles. The owner can edit every role except Owner, and add new ones (Dashboard › Team and roles). */
export const DEFAULT_ROLES: RoleDef[] = [
  { id: "owner", name: "Owner", locked: true, perms: [...PAGE_PERMS, ...ACTION_PERMS] },
  { id: "manager", name: "Manager", perms: ["overview", "bookings", "schedule", "roster", "customers", "consents", "finance", "cash", "inventory", "promos", "blog", "services", "media", "refunds", "export", "seeMoney"] },
  { id: "front-desk", name: "Front desk", perms: ["overview", "bookings", "schedule", "roster", "customers", "consents", "cash", "seeMoney"] },
  { id: "instructor", name: "Instructor / guide", perms: ["schedule", "roster", "consents", "inventory"] }
];
export const PERM_LABEL: Record<string, string> = {
  overview: "Overview", bookings: "Bookings", schedule: "Schedule", roster: "Daily roster", customers: "Customers", consents: "Consent forms",
  finance: "Finance", cash: "Cash close", team: "Team, roles and payroll", inventory: "Equipment", promos: "Promo codes", blog: "Blog", services: "Services and prices",
  media: "Media", settings: "Settings", refunds: "Issue refunds", delete: "Delete records", export: "Export reports", seeMoney: "See money amounts"
};
