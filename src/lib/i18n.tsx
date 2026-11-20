/* Language (English / Egyptian Arabic, RTL) and display currency (EGP / USD / EUR) */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Service } from "./types";

export type Lang = "en" | "ar";
export type Cur = "EGP" | "USD" | "EUR";

/** English text → Arabic. Any string not listed stays in English. */
const AR: Record<string, string> = {
  // nav & footer
  "Courses": "الكورسات", "Guided dives": "غطس مع مرشد", "Dahab trips": "رحلات دهب", "Rentals": "تأجير المعدات", "Gallery": "الصور", "Contact": "تواصل معنا",
  "Blog": "المدونة", "Book now": "احجز الآن", "My account": "حسابي", "Manage booking": "إدارة الحجز", "Owner dashboard": "لوحة التحكم",
  "Explore": "استكشف", "Plan your trip": "خطط لرحلتك", "Book a program": "احجز برنامج", "Reserve your spot, sign your medical form online and arrive ready to dive.": "احجز مكانك، ووقّع الاستمارة الطبية أونلاين، وتعال جاهز للغطس.",
  "Come as a guest, leave as a family member.": "تعال ضيف، وامشي واحد من العيلة.",
  // hero & home
  "Learn to dive": "اتعلم الغطس", "where the desert meets the Red Sea": "مكان ما الصحرا بتقابل البحر الأحمر",
  "Internationally recognised courses from your first breath to Divemaster, guided dives at the Blue Hole and Canyon, and the best of Dahab on land.": "كورسات معتمدة دولياً من أول نفس تحت الماية لحد الدايف ماستر، وغطس مع مرشد في البلو هول والكانيون، وأحلى رحلات دهب على البر.",
  "Check & book": "شوف واحجز", "psst… your first dive starts at": "على فكرة… أول غطسة تبدأ من", "Move your mouse — the water moves with you": "حرّك الماوس — الماية بتتحرك معاك", "3 taps": "٣ ضغطات", "fits me?": "يناسبني؟", "Answer three quick questions and we'll point you to the right program.": "جاوب على ٣ أسئلة سريعة وهنقولك البرنامج المناسب.", "Diving Center · Dahab": "مركز غوص · دهب",
  "Pick your phase": "اختار مرحلتك", "Four ways": "أربع طرق", "to spend your Dahab days": "تقضي بيها أيامك في دهب",
  "Certification courses": "كورسات الشهادات", "Equipment rental": "تأجير المعدات", "From": "من",
  "to the Blue Hole, north of town": "للبلو هول شمال دهب", "your depth as an Open Water diver": "عمقك كغواص أوبن ووتر", "after the Advanced course": "بعد كورس الأدفانسد", "years old to start diving": "سنين أقل سن للغطس",
  "Get certified": "خد شهادتك", "Courses that end": "كورسات بتخلص", "with a card in your wallet": "بكارت في محفظتك",
  "Small groups of up to four students per instructor, shore entries straight onto the reef and certification recognised worldwide.": "مجموعات صغيرة لحد أربع طلاب لكل مدرب، نزول من الشط على الشعاب مباشرة، وشهادة معترف بيها في كل العالم.",
  "All courses": "كل الكورسات", "Max four students per instructor. Always.": "أقصى حاجة أربع طلاب لكل مدرب. دايماً.",
  "Reels": "ريلز", "Straight": "على طول", "from the water": "من تحت الماية",
  "Short clips from our courses, dives and trips — the same moments you'll be in next.": "مقاطع قصيرة من كورساتنا وغطساتنا ورحلاتنا — نفس اللحظات اللي هتعيشها.",
  "The coastline": "الساحل", "From Abu Galum": "من أبو جالوم", "to Three Pools": "للثري بولز",
  "Above the surface": "فوق الماية", "Mountains,": "جبال،", "wadis and lagoons": "وديان وبحيرات", "All trips": "كل الرحلات",
  "Simple from home": "بسهولة من بيتك", "Booked, signed and paid": "محجوز وموقّع ومدفوع", "before you land": "قبل ما توصل",
  "Pick a date": "اختار ميعاد", "Sign the medical form": "وقّع الاستمارة الطبية", "Pay securely": "ادفع بأمان", "Dive in": "انزل الماية",
  "Our promise": "وعدنا", "Come as a guest,": "تعال ضيف،", "leave as a family member": "وامشي واحد من العيلة",
  "Our divers": "غطاسينا", "People who started": "ناس بدأت", "their diving with us": "رحلة الغطس معانا", "See the gallery": "شوف الصور",
  "Dahab,": "دهب،", "above and below": "فوق الماية وتحتها", "Before you come": "قبل ما تيجي", "Good": "أسئلة", "questions": "مهمة",
  "Not sure which course fits?": "مش متأكد أنهي كورس يناسبك؟", "Message us on WhatsApp with your experience and dates — we'll suggest a plan.": "ابعتلنا واتساب بخبرتك ومواعيدك — وهنقترح عليك خطة.",
  "Start a booking": "ابدأ الحجز", "Find my course": "لاقي الكورس المناسب",
  "Sea today in Dahab": "البحر النهارده في دهب", "Water": "الماية", "Wind": "الهوا", "Waves": "الموج", "Air": "الجو",
  "What our divers say": "غطاسينا بيقولوا إيه", "Read all reviews on Google": "اقرا كل التقييمات على جوجل",
  // catalog & cards
  "Book": "احجز", "Book this": "احجز ده", "per person": "للفرد", "per day": "في اليوم", "per dive": "للغطسة", "Starts": "يبدأ", "Medical form required": "مطلوب استمارة طبية",
  "Add to trip": "ضيف للرحلة", "Age": "السن", "seats left": "أماكن فاضلة", "Full": "كامل",
  // booking
  "Your trip": "رحلتك", "Your details": "بياناتك", "Medical form": "الاستمارة الطبية", "Review & pay": "المراجعة والدفع",
  "Program": "البرنامج", "Start date": "تاريخ البداية", "Start time": "ميعاد البداية", "People": "عدد الأفراد", "Quantity": "الكمية", "Days": "عدد الأيام",
  "Add another activity": "ضيف نشاط تاني", "Extras": "إضافات", "Promo code": "كود الخصم", "Apply": "تطبيق",
  "Full name": "الاسم بالكامل", "Email": "البريد الإلكتروني", "Phone (WhatsApp)": "الموبايل (واتساب)", "Country": "البلد", "Notes (optional)": "ملاحظات (اختياري)",
  "Gear sizes": "مقاسات المعدات", "Wetsuit": "بدلة الغطس", "BCD": "سترة الطفو", "Fins (shoe size)": "الزعانف (مقاس الجزمة)", "Weight (kg)": "الوزن (كجم)",
  "Payment": "الدفع", "Pay in full online": "ادفع كامل أونلاين", "Pay a deposit": "ادفع عربون", "Pay at the center": "ادفع في المركز",
  "Continue": "كمّل", "Back": "رجوع", "Confirm booking": "تأكيد الحجز", "Subtotal": "المجموع", "Discount": "الخصم", "Total": "الإجمالي", "Due now": "المطلوب دلوقتي", "Due on arrival": "الباقي عند الوصول",
  "Questions? WhatsApp us": "عندك سؤال؟ كلمنا واتساب", "No hidden extras — gear included.": "مفيش مصاريف مخفية — المعدات مشمولة.",
  "Prices are charged in Egyptian pounds.": "الدفع بيتم بالجنيه المصري.",
  "You're booked,": "حجزك اتأكد،", "welcome to the family": "أهلاً بيك في العيلة", "Add to Google Calendar": "ضيف لتقويم جوجل", "Download calendar file": "حمّل ملف التقويم",
  "Send us your booking on WhatsApp": "ابعتلنا حجزك على واتساب", "Back to home": "الرجوع للرئيسية",
  // manage / account
  "Find your booking": "دوّر على حجزك", "Booking reference": "رقم الحجز", "Find booking": "دوّر", "Change date": "غيّر الميعاد", "Cancel booking": "إلغاء الحجز", "Save change": "حفظ التغيير",
  "Your logbook": "اللوج بوك بتاعك", "Add a dive": "ضيف غطسة", "Your trips": "رحلاتك", "Your photos and videos": "صورك وفيديوهاتك", "Unlock all": "افتح الكل", "Sign in": "تسجيل الدخول", "Sign out": "تسجيل الخروج",
  "Dive site": "مكان الغطس", "Max depth (m)": "أقصى عمق (م)", "Bottom time (min)": "مدة الغطسة (دقيقة)", "Buddy": "البادي", "Verified by Dahab Days": "متأكد من داهب دايز",
  // quiz
  "Which course fits me?": "أنهي كورس يناسبني؟", "Have you dived before?": "غطست قبل كده؟", "How much time do you have?": "معاك وقت قد إيه؟", "What do you want most?": "عايز إيه أكتر؟",
  "Never": "أبداً", "Once, on holiday": "مرة في أجازة", "I'm certified": "معايا شهادة", "Half a day": "نص يوم", "2 days": "يومين", "3–4 days": "٣-٤ أيام", "A week or more": "أسبوع أو أكتر",
  "Just try it": "أجرب بس", "A licence to dive anywhere": "شهادة أغطس بيها في أي مكان", "Explore deeper sites": "أستكشف أماكن أعمق", "Our pick for you": "اختيارنا ليك", "Start again": "من الأول",
  // blog
  "Guides and stories": "أدلة وحكايات", "Read guide": "اقرا الدليل", "All guides": "كل الأدلة"
};

const SERVICE_AR: Record<string, [string, string]> = {
  dsd: ["تجربة الغطس — أول غطسة", "أول نفس تحت الماية، مع مدرب جنبك."], owd: ["أوبن ووتر دايفر", "الرخصة الدولية للغطس لحد ١٨ متر في أي مكان في العالم."],
  aowd: ["أدفانسد أوبن ووتر", "غطس عميق وملاحة وتلات مغامرات — منهم الكانيون."], combo: ["باقة أوبن ووتر + أدفانسد", "من الصفر لـ ٣٠ متر في أقل من أسبوع."],
  rescue: ["ريسكيو دايفر + إسعافات أولية", "اتعلم تمنع المشاكل وتتعامل معاها."], nitrox: ["نيتروكس", "وقت أطول تحت الماية."], refresh: ["كورس تنشيط", "بقالك فترة مغطستش؟ راجع مهاراتك الأول."],
  dm: ["تدريب دايف ماستر", "أول مستوى احترافي. عيش في دهب واتدرب معانا."], shore: ["غطسة من الشط مع مرشد", "اللايت هاوس والإيل جاردن والآيلاندز."],
  "bh-dive": ["يوم غطس البلز للبلو هول", "انزل من مدخنة البلز وكمّل للبلو هول."], "canyon-dive": ["غطسة الكانيون", "اعبر شق في الشعاب منوّر بأشعة الشمس."], pack10: ["باقة ١٠ غطسات", "أحسن سعر للغطسة للغواصين المعتمدين."],
  "bh-snorkel": ["يوم سنوركلينج البلو هول والبلز", "سنوركلينج على حافة أشهر حفرة في البحر."], pools: ["الثري بولز ووادي قني", "تلات حمامات طبيعية من المرجان وواحة نخيل."],
  lagoon: ["البلو لاجون ورأس أبو جالوم", "مركب من البلو هول لمحمية من غير طرق."], tawilat: ["ليلة جبل الطويلات", "فوردباي في الجبال، الكوبري المعلق، شاي بدوي ونجوم."],
  ghazala: ["سفاري الغروب في وادي الغزالة", "جدران صخرية دهبي وشاي الغروب مع مرشد بدوي."], sinai: ["شروق جبل موسى وسانت كاترين", "طلوع بالليل لمشاهدة الشروق من فوق الجبل."],
  colored: ["الوادي الملون", "مشي بين جدران ملونة أحمر ودهبي وبنفسجي."], weshwash: ["وادي الوشواش", "مشي لحد حمامات ماية عذبة بين الجبال."],
  "r-full": ["طقم غطس كامل", "سترة، منظم، بدلة، ماسك، زعانف، كمبيوتر."], "t-sharm": ["توصيل مطار شرم الشيخ", "عربية خاصة من المطار لفندقك في دهب."],
  "t-hotel": ["توصيل من وإلى الفندق", "بنعدي عليك في فندقك أو الكامب."], photos: ["باقة الصور والفيديو", "كل الصور والفيديوهات اللي بنصورها ليك بجودة كاملة."], lunch: ["غدا على البحر", "غدا في كافيه على البحر بين الغطسات."]
};

interface I18n { lang: Lang; setLang(l: Lang): void; cur: Cur; setCur(c: Cur): void; t(s: string): string; money(egp: number): string; sv(s: Service): { name: string; short: string } }
const Ctx = createContext<I18n>(null as unknown as I18n);
export const useI18n = () => useContext(Ctx);

const read = <T,>(k: string, d: T): T => { try { return (localStorage.getItem(k) as unknown as T) || d; } catch { return d; } };

export function I18nProvider({ children, fallbackRates }: { children: ReactNode; fallbackRates: { USD: number; EUR: number } }) {
  const [lang, setLangS] = useState<Lang>(() => read<Lang>("dd:lang", "en"));
  const [cur, setCurS] = useState<Cur>(() => read<Cur>("dd:cur", "EGP"));
  const [live, setLive] = useState<{ USD: number; EUR: number } | null>(null);
  useEffect(() => {
    document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("dd:lang", lang); } catch { /* */ }
  }, [lang]);
  useEffect(() => {
    // live rates (free, no key). Blocked or offline → owner's fallback rates from Settings
    fetch("https://open.er-api.com/v6/latest/EGP").then((r) => r.json()).then((j) => { if (j?.rates?.USD && j?.rates?.EUR) setLive({ USD: 1 / j.rates.USD, EUR: 1 / j.rates.EUR }); }).catch(() => {});
  }, []);
  const value = useMemo<I18n>(() => {
    const rates = live || fallbackRates;
    const t = (s: string) => (lang === "ar" ? AR[s] ?? s : s);
    const money = (egp: number) => {
      if (cur === "EGP") return (lang === "ar" ? "ج.م " : "EGP ") + Math.round(egp).toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
      const v = egp / (rates[cur] || 1);
      return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v);
    };
    const sv = (s: Service) => (lang === "ar" && SERVICE_AR[s.id] ? { name: SERVICE_AR[s.id][0], short: SERVICE_AR[s.id][1] } : { name: s.name, short: s.short });
    return {
      lang, cur, t, money, sv,
      setLang: (l) => setLangS(l),
      setCur: (c) => { setCurS(c); try { localStorage.setItem("dd:cur", c); } catch { /* */ } }
    };
  }, [lang, cur, live, fallbackRates]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function LangCurSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang, cur, setCur } = useI18n();
  const cls = `h-9 rounded-full border px-2 text-sm font-semibold outline-none ${dark ? "border-white/30 bg-white/10 text-white" : "border-navy/15 bg-white text-navy"}`;
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className={`${cls} min-w-[44px] font-arabic`} aria-label="Language">{lang === "en" ? "عربي" : "EN"}</button>
      <select value={cur} onChange={(e) => setCur(e.target.value as Cur)} className={cls} aria-label="Currency">
        {(["EGP", "USD", "EUR"] as Cur[]).map((c) => <option key={c} value={c} className="text-navy">{c}</option>)}
      </select>
    </div>
  );
}
