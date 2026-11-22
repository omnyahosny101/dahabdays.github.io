import type { Post, RoleDef, Service, Settings } from "./types";
import { ACTION_PERMS, PAGE_PERMS } from "./types";
import { SERVICE_STOCK, STOCK } from "./stock";

/**
 * Default catalog, from the printed Dahab Days price list.
 *  priceEur = international visitors (euro, as printed) · price = Egyptians & residents (EGP, about 15% less)
 *  variants = price options (with / without equipment, with Coach Attar, package length)
 * The owner edits everything here from Dashboard › Services; once edited, the stored version replaces this list.
 */
const s = (x: Partial<Service> & Pick<Service, "id" | "category" | "name" | "price">, i: number): Service => ({
  short: "", description: "", includes: [], duration: "", unit: "per person", scene: "reef",
  requiresConsent: true, slots: ["09:00"], capacity: 8, active: true, sort: i, ...x
});

export const DEFAULT_SERVICES: Service[] = [
  // ——— Discover Scuba & certification courses (courses include the full equipment) ———
  { id: "dsd", category: "course", name: "Discover Scuba Diving — 1 dive", duration: "Half day · 1 dive at the Lighthouse", short: "Your first breath underwater — one dive at the Lighthouse with transport.", description: "A short briefing on land, skills practice in shallow water, then a guided dive on the Lighthouse reef to a maximum of 12 m. No experience needed — just basic comfort in water. Full equipment and transport included.", includes: ["1 dive at the Lighthouse", "Transport", "Full equipment", "Instructor briefing"], scene: "diver", minAge: 10, level: "Beginner", badge: "First timers", slots: ["09:00", "13:00"], capacity: 4, variants: [{"id": "std", "label": "With our instructor", "eur": 45, "egp": 2100}, {"id": "attar", "label": "With Coach Attar ★", "eur": 60, "egp": 2900}], priceEur: 45, price: 2100 },
  { id: "dsd-gold", category: "course", name: "Discover Scuba Diving — Golden", duration: "1 day · 2 dives + eLearning", short: "Two dives, eLearning and a certificate — the full first-timer experience.", description: "Do the theory online before you arrive, then two guided dives with your instructor. You leave with a Discover Scuba certificate that counts towards your Open Water course.", includes: ["2 dives", "eLearning", "Certificate", "Full equipment", "Transport"], scene: "reef", minAge: 10, level: "Beginner", badge: "Golden", slots: ["09:00"], capacity: 4, variants: [{"id": "std", "label": "With our instructor", "eur": 90, "egp": 4300}, {"id": "attar", "label": "With Coach Attar ★", "eur": 100, "egp": 4800}], priceEur: 90, price: 4300 },
  { id: "refresh", category: "course", name: "Scuba Review", duration: "Half day · 1 dive", short: "Haven't dived in a while? Brush up your skills first.", description: "Review of skills and equipment set-up in shallow water, followed by a relaxed reef dive.", includes: ["Instructor", "Full equipment", "1 dive", "Transport"], scene: "turtle", level: "Certified", capacity: 4, variants: [{"id": "std", "label": "With our instructor", "eur": 55, "egp": 2600}, {"id": "attar", "label": "With Coach Attar ★", "eur": 60, "egp": 2900}], priceEur: 55, price: 2600 },
  { id: "owd", category: "course", name: "Open Water Diver", duration: "3–4 days · 4 open-water dives", short: "The internationally recognised licence to dive anywhere in the world to 18 m.", description: "Theory (eLearning or classroom), confined-water skills, and four open-water training dives on Dahab's calm shore sites. You finish certified to dive with a buddy to 18 m.", includes: ["Digital learning materials", "International certification card", "Full equipment", "4 open-water dives", "Logbook"], scene: "classroom", minAge: 10, level: "Beginner", badge: "Most booked", capacity: 4, variants: [{"id": "std", "label": "With our instructor", "eur": 420, "egp": 20000}, {"id": "attar", "label": "With Coach Attar ★", "eur": 460, "egp": 22000}], priceEur: 420, price: 20000 },
  { id: "aowd", category: "course", name: "Advanced Open Water", duration: "2 days · 5 adventure dives", short: "Deep, navigation and three adventures — including the Canyon.", description: "Five adventure dives: Deep and Underwater Navigation plus three electives such as the Canyon, Bells to Blue Hole, night or buoyancy. Certifies you to 30 m.", includes: ["5 adventure dives", "Certification card", "Full equipment", "Transport to dive sites"], scene: "canyon", minAge: 12, level: "Certified", capacity: 4, variants: [{"id": "std", "label": "With our instructor", "eur": 350, "egp": 16500}, {"id": "attar", "label": "With Coach Attar ★", "eur": 380, "egp": 18000}], priceEur: 350, price: 16500 },
  { id: "combo", category: "course", name: "Open Water + Advanced package", duration: "5–6 days · 9 dives", short: "Zero to 30 m in under a week. Our best-value bundle.", description: "Both courses back to back with the same instructor. Finish with an Advanced dive at Bells to Blue Hole — the classic Dahab graduation dive.", includes: ["Both certification cards", "9 dives", "Full equipment", "Transport"], scene: "bluehole", minAge: 12, level: "Beginner", badge: "Best value", capacity: 4, variants: [{"id": "std", "label": "With our instructor", "eur": 630, "egp": 30000}, {"id": "attar", "label": "With Coach Attar ★", "eur": 690, "egp": 33000}], priceEur: 630, price: 30000 },
  { id: "rescue", category: "course", name: "Rescue Diver + First Aid", duration: "3–4 days", short: "Learn to prevent and manage problems — the course divers call the most rewarding.", description: "Self-rescue, recognising diver stress, emergency management and rescue scenarios, with Emergency First Response (CPR & first aid) included.", includes: ["Rescue + EFR certification", "Scenarios & dives", "Full equipment", "Pocket mask"], scene: "reef", minAge: 12, level: "Advanced", capacity: 4, variants: [{"id": "std", "label": "With our instructor", "eur": 380, "egp": 18000}, {"id": "attar", "label": "With Coach Attar ★", "eur": 410, "egp": 19500}], priceEur: 380, price: 18000 },
  { id: "nitrox", category: "course", name: "Enriched Air (Nitrox)", duration: "1 day · 2 dives", short: "Longer no-stop times and shorter surface intervals.", description: "Theory, analysing your own tank and two Nitrox dives. The most popular specialty in Dahab.", includes: ["Certification card", "2 Nitrox fills", "Full equipment"], scene: "gear", minAge: 12, level: "Certified", capacity: 6, priceEur: 160, price: 7600 },
  { id: "dm", category: "course", name: "Divemaster internship", duration: "4–6 weeks", short: "Your first professional level. Live in Dahab and train with Coach Attar's team.", description: "Mentored internship covering dive leadership, assisting courses, mapping a dive site and stamina tests. Price excludes membership fees.", includes: ["Unlimited training dives", "Mentoring", "Equipment during training"], scene: "bells", minAge: 18, level: "Pro", badge: "Pro", slots: ["Flexible"], capacity: 2, priceEur: 950, price: 45000 },

  // ——— Guided dives & packages (taxi from the center to the dive site included · nature reserve fees not included) ———
  { id: "shore", category: "fun", name: "Guided dive — Lighthouse", unit: "per dive", duration: "1 dive · ~50 min", short: "Dahab's house reef, straight from the beach in town.", description: "An easy, beautiful shore dive on the Lighthouse reef with one of our guides — perfect for your first dive in Dahab or a relaxed afternoon.", includes: ["Guide", "Tank & weights", "Equipment (if chosen)"], scene: "reef", level: "Certified", slots: ["08:30", "11:00", "14:00"], variants: [{"id": "eqp", "label": "With equipment", "eur": 45, "egp": 2100}, {"id": "own", "label": "Own equipment", "eur": 35, "egp": 1700}], priceEur: 45, price: 2100 },
  { id: "canyon-dive", category: "fun", name: "Guided dive — long distance site", unit: "per dive", duration: "1 dive", short: "Canyon, Blue Hole, Islands or Eel Garden — the guide picks the best site for the day.", description: "One guided dive at a site outside town. Taxi from the center to the dive site is included.", includes: ["Guide", "Taxi to the site", "Tank & weights", "Equipment (if chosen)"], scene: "canyon", level: "Certified", slots: ["08:30", "13:00"], variants: [{"id": "eqp", "label": "With equipment", "eur": 60, "egp": 2900}, {"id": "own", "label": "Own equipment", "eur": 55, "egp": 2600}], priceEur: 60, price: 2900 },
  { id: "bh-dive", category: "fun", name: "2 guided dives — long distance", duration: "Half / full day · 2 dives", short: "Two dives at the famous sites — Bells to Blue Hole is the classic.", description: "Two guided dives at long-distance sites such as Bells to Blue Hole and the Canyon. Advanced certification (or deep experience) recommended for the Bells.", includes: ["2 guided dives", "Taxi to the sites", "Tanks & weights", "Equipment (if chosen)"], scene: "bells", level: "Advanced", badge: "Signature", variants: [{"id": "eqp", "label": "With equipment", "eur": 120, "egp": 5700}, {"id": "own", "label": "Own equipment", "eur": 100, "egp": 4800}], priceEur: 120, price: 5700 },
  { id: "pack10", category: "fun", name: "Dive packages — 1 to 10 days", unit: "per package", duration: "2 dives a day", short: "Two dives a day for 1 to 10 days — the more days, the better the price.", description: "Guided dives at the sites of your choice, including Blue Hole and the Canyon, two a day. Choose with equipment, your own equipment, or diving with Coach Attar.", includes: ["2 dives per day", "Guide", "Taxi to the sites", "Tanks & weights"], scene: "turtle", level: "Certified", badge: "Best price per dive", slots: ["08:30"], variants: [{"id": "1d-eqp", "label": "1 day · 2 dives · with equipment", "eur": 100, "egp": 4800, "group": "1 day · 2 dives"}, {"id": "1d-own", "label": "1 day · 2 dives · own equipment", "eur": 90, "egp": 4300, "group": "1 day · 2 dives"}, {"id": "1d-attar", "label": "1 day · 2 dives · With Coach Attar ★", "eur": 120, "egp": 5700, "group": "1 day · 2 dives"}, {"id": "2d-eqp", "label": "2 days · 4 dives · with equipment", "eur": 185, "egp": 8800, "group": "2 days · 4 dives"}, {"id": "2d-own", "label": "2 days · 4 dives · own equipment", "eur": 170, "egp": 8100, "group": "2 days · 4 dives"}, {"id": "2d-attar", "label": "2 days · 4 dives · With Coach Attar ★", "eur": 200, "egp": 9500, "group": "2 days · 4 dives"}, {"id": "3d-eqp", "label": "3 days · 6 dives · with equipment", "eur": 250, "egp": 12000, "group": "3 days · 6 dives"}, {"id": "3d-own", "label": "3 days · 6 dives · own equipment", "eur": 230, "egp": 11000, "group": "3 days · 6 dives"}, {"id": "3d-attar", "label": "3 days · 6 dives · With Coach Attar ★", "eur": 275, "egp": 13000, "group": "3 days · 6 dives"}, {"id": "4d-eqp", "label": "4 days · 8 dives · with equipment", "eur": 290, "egp": 14000, "group": "4 days · 8 dives"}, {"id": "4d-own", "label": "4 days · 8 dives · own equipment", "eur": 270, "egp": 13000, "group": "4 days · 8 dives"}, {"id": "4d-attar", "label": "4 days · 8 dives · With Coach Attar ★", "eur": 325, "egp": 15500, "group": "4 days · 8 dives"}, {"id": "5d-eqp", "label": "5 days · 10 dives · with equipment", "eur": 325, "egp": 15500, "group": "5 days · 10 dives"}, {"id": "5d-own", "label": "5 days · 10 dives · own equipment", "eur": 300, "egp": 14500, "group": "5 days · 10 dives"}, {"id": "5d-attar", "label": "5 days · 10 dives · With Coach Attar ★", "eur": 350, "egp": 16500, "group": "5 days · 10 dives"}, {"id": "6d-eqp", "label": "6 days · 12 dives · with equipment", "eur": 350, "egp": 16500, "group": "6 days · 12 dives"}, {"id": "6d-own", "label": "6 days · 12 dives · own equipment", "eur": 330, "egp": 15500, "group": "6 days · 12 dives"}, {"id": "6d-attar", "label": "6 days · 12 dives · With Coach Attar ★", "eur": 400, "egp": 19000, "group": "6 days · 12 dives"}, {"id": "8d-eqp", "label": "8 days · 16 dives · with equipment", "eur": 450, "egp": 21500, "group": "8 days · 16 dives"}, {"id": "8d-own", "label": "8 days · 16 dives · own equipment", "eur": 430, "egp": 20500, "group": "8 days · 16 dives"}, {"id": "8d-attar", "label": "8 days · 16 dives · With Coach Attar ★", "eur": 475, "egp": 22500, "group": "8 days · 16 dives"}, {"id": "10d-eqp", "label": "10 days · 20 dives · with equipment", "eur": 550, "egp": 26000, "group": "10 days · 20 dives"}, {"id": "10d-own", "label": "10 days · 20 dives · own equipment", "eur": 530, "egp": 25000, "group": "10 days · 20 dives"}, {"id": "10d-attar", "label": "10 days · 20 dives · With Coach Attar ★", "eur": 575, "egp": 27500, "group": "10 days · 20 dives"}], priceEur: 100, price: 4800 },

  // ——— Dahab trips (estimated — not on the printed price list) ———
  { id: "bh-snorkel", category: "tour", name: "Blue Hole & Bells snorkel day", price: 1200, priceEur: 25, duration: "6 hours",
    short: "Snorkel the edge of the world's most famous sinkhole.",
    description: "Pick-up from your hotel, snorkel the coral rim of the Blue Hole and the reef at Bells, lunch at a beach café, and free time in the sun.",
    includes: ["Hotel pick-up", "Snorkel set", "Guide", "Lunch", "Park entrance"], scene: "bluehole", minAge: 6, badge: "Classic", slots: ["09:30"], capacity: 14 },
  { id: "pools", category: "tour", name: "Three Pools & Wadi Gnai", price: 950, priceEur: 20, duration: "5 hours",
    short: "Three natural coral pools with sandy bottoms, then a palm oasis in the wadi.",
    description: "South of town, three shallow lagoons ringed by coral make the calmest snorkelling in Dahab. Add a horse or camel ride along the coast, then visit the small oasis of Wadi Gnai.",
    includes: ["Transport", "Snorkel set", "Guide", "Bedouin tea"], scene: "pools", minAge: 5, slots: ["09:00", "14:00"], capacity: 14 },
  { id: "lagoon", category: "tour", name: "Blue Lagoon & Ras Abu Galum", price: 1900, priceEur: 40, duration: "Full day",
    short: "Boat from Blue Hole into a protected area with no road access.",
    description: "Take a small boat north from Blue Hole to the Ras Abu Galum protectorate, snorkel untouched reef and relax at the turquoise Blue Lagoon in a Bedouin camp.",
    includes: ["Transport to Blue Hole", "Boat both ways", "Snorkel set", "Lunch", "Protectorate fees"], scene: "lagoon", minAge: 6, slots: ["09:00"], capacity: 12 },
  { id: "tawilat", category: "tour", name: "Gabal El Tawilat night", price: 1400, priceEur: 30, duration: "Evening · 5 hours",
    short: "4×4 into the mountains, the suspension bridge, Bedouin tea and a sky full of stars.",
    description: "A winding desert drive into the Tawilat mountains, a walk across the hanging bridge between peaks, then Bedouin tea, dinner and music around the fire under the stars.",
    includes: ["4×4 transport", "Guide", "Bedouin dinner & tea", "Camp entrance"], scene: "tawilat", requiresConsent: false, badge: "After dark", slots: ["17:00"], capacity: 16 },
  { id: "ghazala", category: "tour", name: "Wadi El Ghazala sunset safari", price: 1200, priceEur: 25, duration: "4 hours",
    short: "Golden canyon walls, quiet sand and sunset tea with a Bedouin guide.",
    description: "Drive out into the desert valleys behind Dahab, walk between the rock walls with a local guide and watch the sunset over the mountains with tea on the fire.",
    includes: ["4×4 transport", "Bedouin guide", "Tea & snacks"], scene: "ghazala", requiresConsent: false, slots: ["14:30"], capacity: 16 },
  { id: "sinai", category: "tour", name: "Mount Sinai sunrise & St Catherine", price: 1700, priceEur: 35, duration: "Overnight · 10 hours",
    short: "Night hike up the mountain to watch the sun rise over Sinai.",
    description: "Leave Dahab late at night, hike with a Bedouin guide under the stars and reach the summit for sunrise. Visit St Catherine's Monastery on the way back when it is open.",
    includes: ["Transport", "Bedouin guide", "Entrance fees"], scene: "sinai", requiresConsent: false, slots: ["23:00"], capacity: 14 },
  { id: "colored", category: "tour", name: "Colored Canyon trek", price: 1900, priceEur: 40, duration: "Full day",
    short: "Squeeze between canyon walls striped in red, gold and violet.",
    description: "A jeep ride into the desert followed by an easy-to-moderate trek through the Colored Canyon, with lunch at a Bedouin camp.",
    includes: ["4×4 transport", "Guide", "Lunch", "Entrance"], scene: "wadi", requiresConsent: false, slots: ["08:00"], capacity: 14 },
  { id: "weshwash", category: "tour", name: "Wadi El Weshwash pools", price: 1700, priceEur: 35, duration: "Full day",
    short: "Hike to fresh-water pools hidden between granite walls.",
    description: "A desert drive and a rocky hike to natural pools carved by flash floods — swim in fresh water in the middle of the mountains.",
    includes: ["4×4 transport", "Guide", "Lunch"], scene: "wadi", requiresConsent: false, slots: ["07:30"], capacity: 12 },

  // ——— Equipment rent: per day, capped at the weekly price ———
  { id: "r-bcd", category: "rental", name: "BCD", unit: "per day", duration: "Day or week", short: "Jacket-style, sizes XS–XXL.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 50, priceWeek: 2400 },
  { id: "r-suit", category: "rental", name: "Wetsuit", unit: "per day", duration: "Day or week", short: "3 mm or 5 mm — choose 5 mm in winter.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 50, priceWeek: 2400 },
  { id: "r-reg", category: "rental", name: "Regulator", unit: "per day", duration: "Day or week", short: "1st & 2nd stage, octopus, SPG.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 50, priceWeek: 2400 },
  { id: "r-torch", category: "rental", name: "Torch", unit: "per day", duration: "Day or week", short: "For night dives and the Canyon.", description: "", includes: [], scene: "night", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 50, priceWeek: 2400 },
  { id: "r-mask", category: "rental", name: "Mask & snorkel", unit: "per day", duration: "Day or week", short: "Also for snorkellers.", description: "", includes: [], scene: "pools", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 50, priceWeek: 2400 },
  { id: "r-fins", category: "rental", name: "Fins & boots", unit: "per day", duration: "Day or week", short: "Open-heel fins with boots.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 5, price: 250, priceWeekEur: 25, priceWeek: 1200 },
  { id: "r-hoodie", category: "rental", name: "Hoodie", unit: "per day", duration: "Day or week", short: "Neoprene hood for cooler months.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 5, price: 250, priceWeekEur: 25, priceWeek: 1200 },
  { id: "r-weights", category: "rental", name: "Weights & belt", unit: "per day", duration: "Day or week", short: "Belt with your weights.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 40, priceWeek: 1900 },
  { id: "r-buoy", category: "rental", name: "Freediving buoy", unit: "per day", duration: "Day or week", short: "Buoy and line for freediving.", description: "", includes: [], scene: "pools", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 40, priceWeek: 1900 },
  { id: "r-snorkel", category: "rental", name: "Snorkeling gear", unit: "per day", duration: "Day or week", short: "Mask, snorkel and fins.", description: "", includes: [], scene: "pools", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 15, price: 700, priceWeekEur: 60, priceWeek: 2900 },
  { id: "r-full", category: "rental", name: "Full scuba set", unit: "per day", duration: "Day or week", short: "BCD, regulator, wetsuit, mask, fins, weights. (Estimate — not on the printed list.)", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 40, price: 1900, priceWeekEur: 180, priceWeek: 8600 },
  { id: "r-comp", category: "rental", name: "Dive computer", unit: "per day", duration: "Day or week", short: "Air & Nitrox compatible. (Estimate)", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 10, price: 500, priceWeekEur: 50, priceWeek: 2400 },
  { id: "r-cam", category: "rental", name: "Action camera + housing", unit: "per day", duration: "Day or week", short: "Film your own reel underwater. (Estimate)", description: "", includes: [], scene: "turtle", requiresConsent: false, slots: ["08:00"], capacity: 20, priceEur: 20, price: 950, priceWeekEur: 100, priceWeek: 4800 },
  { id: "r-tank", category: "rental", name: "Extra tank — Air 15 L / Nitrox", unit: "per tank", duration: "Per tank", short: "Extra special gases: Air 15 L or Nitrox.", description: "", includes: [], scene: "gear", requiresConsent: false, slots: ["08:00"], capacity: 40, variants: [{"id": "air15", "label": "Air 15 L", "eur": 15, "egp": 700}, {"id": "nitrox", "label": "Nitrox (NTRX)", "eur": 20, "egp": 950}], priceEur: 15, price: 700 },

  // ——— Add-ons (offered in the trip cart) ———
  { id: "t-sharm", category: "addon", name: "Sharm El Sheikh airport transfer", price: 2100, priceEur: 45, unit: "per car, one way", duration: "About 1.5 hours", short: "Private car between Sharm airport and your hotel in Dahab.", description: "", includes: ["Up to 4 people", "Meet and greet"], scene: "sinai", requiresConsent: false, slots: ["Any time"], capacity: 10 },
  { id: "t-hotel", category: "addon", name: "Hotel pick-up and drop-off", price: 150, priceEur: 3, unit: "per person", duration: "In Dahab", short: "We collect you from your hotel or camp in Dahab.", description: "", includes: [], scene: "lagoon", requiresConsent: false, slots: ["Any time"], capacity: 40 },
  { id: "photos", category: "addon", name: "Photo and video package", price: 1400, priceEur: 30, unit: "per booking", duration: "Delivered within 48 h", short: "All the photos and clips our team takes of you, in full quality.", description: "", includes: ["Edited reel", "All photos in full resolution"], scene: "turtle", requiresConsent: false, slots: ["Any time"], capacity: 99 },
  { id: "lunch", category: "addon", name: "Beach lunch", price: 400, priceEur: 8, unit: "per person", duration: "Dive days", short: "Lunch at a beach café between dives.", description: "", includes: [], scene: "pools", requiresConsent: false, slots: ["Any time"], capacity: 40 }
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
  ownerName: "Mohamed Attar",
  ownerPhone: "+20 100 051 5039",
  ownerEmail: "",
  depositPct: 25,
  rates: { USD: 48, EUR: 56 },
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
