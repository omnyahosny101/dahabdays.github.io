import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, FileSignature, CreditCard, Waves, ChevronDown } from "lucide-react";
import { AutoVideo, BookButton, Empty, Heading, HeroCanvas, ReelCard, ServiceCard, ServiceDetail, Sheet, Visual, ContactList } from "../components/ui";
import Scene from "../components/Scene";
import { Counter, HandNote, Mark, Marquee, Phase, RedTab, Stamp, Wave, useBubbles } from "../components/brand";
import { Quiz, Reviews, SeaConditions } from "../components/extras";
import { useI18n } from "../lib/i18n";
import { STOCK, STOCK_GALLERY, STOCK_REELS } from "../lib/stock";
import { FAQ } from "../lib/catalog";
import { egp, go, today, useStore } from "../lib/store";
import type { MediaItem, SceneKey, Service } from "../lib/types";

const SAMPLE_REELS: { scene: SceneKey; caption: string }[] = [
  { scene: "bells", caption: "Bells to Blue Hole — graduation dive" },
  { scene: "classroom", caption: "First breaths: Open Water day 1" },
  { scene: "turtle", caption: "Turtle at the Lighthouse reef" },
  { scene: "tawilat", caption: "Tawilat night under the stars" },
  { scene: "canyon", caption: "Light shafts inside the Canyon" },
  { scene: "pools", caption: "Three Pools snorkel morning" }
];

export default function Home() {
  const { services, media } = useStore();
  const { t: tr, money } = useI18n();
  const [open, setOpen] = useState<Service | null>(null);
  const [reel, setReel] = useState<MediaItem | null>(null);
  const [stockReel, setStockReel] = useState<string | null>(null);
  const hero = media.find((m) => m.role === "hero");
  const reels = media.filter((m) => m.role === "reel");
  const clients = media.filter((m) => m.role === "client");
  const gallery = media.filter((m) => m.role === "gallery");
  const active = services.filter((s) => s.active);
  const courses = active.filter((s) => s.category === "course").slice(0, 4);
  const trips = active.filter((s) => s.category === "tour");
  const from = (c: string) => Math.min(...active.filter((s) => s.category === c).map((s) => s.price));

  return (
    <>
      {/* ——— HERO ——— */}
      <HeroBlock active={active} hero={hero} />
      <Marquee items={["Blue Hole", "The Bells", "Canyon", "Lighthouse", "Eel Garden", "Three Pools", "Ras Abu Galum", "Gabal El Tawilat", "Wadi Gnai", "Blue Lagoon"]} />

      {/* ——— PATHS ——— */}
      <section id="paths" className="band bg-white">
        <div className="wrap">
          <Heading kicker="Pick your phase" title="Four ways|to spend your Dahab days" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {([["courses", "Certification courses", "classroom", "course", STOCK.fishCorals], ["dives", "Guided dives", "bells", "fun", STOCK.diverCavern], ["trips", "Dahab trips", "tawilat", "tour", STOCK.camelsDesert], ["rentals", "Equipment rental", "gear", "rental", ""]] as const).map(([r, t, sc, c, img]) => (
              <a key={r} href={"#" + r} data-reveal className="group relative aspect-[4/5] overflow-hidden rounded-[28px] rounded-br-[140px] text-white shadow-card transition hover:-translate-y-1">
                <div className="absolute inset-0 transition duration-700 group-hover:scale-105"><Visual scene={sc as SceneKey} url={img || undefined} label={t} /></div>
                <span className="absolute inset-0 bg-gradient-to-t from-abyss/85 via-abyss/10 to-transparent" />
                <span className="absolute inset-x-5 bottom-5"><span className="mb-2 block w-fit rounded-full bg-white/90 p-1.5"><Phase i={["courses","dives","trips","rentals"].indexOf(r)} size={18} /></span><span className="block font-display text-2xl font-black leading-tight">{tr(t)}</span><span className="mt-1 flex items-center gap-2 text-white/85">{tr("From")} <b className="price">{money(from(c))}</b><ArrowRight size={18} className="ml-auto transition group-hover:translate-x-1" /></span></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ——— NUMBERS ——— */}
      <section className="bg-white pb-16">
        <div className="wrap grid grid-cols-2 gap-4 lg:grid-cols-4">
          {([[12, " km", "to the Blue Hole, north of town"], [18, " m", "your depth as an Open Water diver"], [30, " m", "after the Advanced course"], [10, "+", "years old to start diving"]] as [number, string, string][]).map(([n, u, t], i) => (
            <div key={t} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }} className="rounded-[28px] bg-sand p-5 sm:p-6">
              <Phase i={i} size={20} />
              <p className="mt-3 font-display text-[44px] font-black leading-none text-navy sm:text-[56px]"><Counter to={n} suffix={u} /></p>
              <p className="mt-2 text-ink/70">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ——— COURSES ——— */}
      <section className="band bg-foam">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="Get certified" title="Courses that end|with a card in your wallet">Small groups of up to four students per instructor, shore entries straight onto the reef and certification recognised worldwide.</Heading><a href="#courses" className="btn-ghost mb-10">All courses <ArrowRight size={18} /></a></div>
          <CoursePathStrip />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{courses.map((s, i) => <ServiceCard key={s.id} s={s} i={i} onOpen={setOpen} />)}</div>
          <p className="mt-8 text-center"><HandNote>Max four students per instructor. Always.</HandNote></p>
        </div>
      </section>

      {/* ——— REELS ——— */}
      <Wave top="#EAF6FD" back="#2EA3E3" front="#15284B" />
      <section className="band overflow-hidden bg-navy pt-10 text-white">
        <div className="wrap">
          <Heading light kicker="Reels" title="Straight|from the water">Short clips from our courses, dives and trips — the same moments you'll be in next.</Heading>
        </div>
        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:px-[max(2rem,calc((100vw-1240px)/2+2rem))]">
          {reels.length
            ? reels.map((m, i) => <ReelCard key={m.id} m={m} scene={SAMPLE_REELS[i % 6].scene} caption={m.caption} onOpen={() => setReel(m)} />)
            : [...STOCK_REELS.map((r, i) => <ReelCard key={r.url} scene={SAMPLE_REELS[i].scene} caption={r.caption} url={r.url} poster={r.poster} onOpen={() => setStockReel(r.url)} />), ...SAMPLE_REELS.slice(4).map((r) => <ReelCard key={r.caption} scene={r.scene} caption={r.caption} onOpen={() => go("admin")} />)]}
        </div>
        {!reels.length && <p className="wrap mt-4 text-sm text-white/55">Stock clips from Pexels for now — upload your own reels in Dashboard › Media and they replace these.</p>}
      </section>

      <Wave top="#15284B" back="#2EA3E3" front="#FFFFFF" />
      {/* ——— DIVE SITES MAP ——— */}
      <DiveMap />

      {/* ——— TRIPS ——— */}
      <section className="band bg-sand">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="Above the surface" title="Mountains,|wadis and lagoons">Between dives, Dahab's desert is just as wild. Every trip includes pick-up from your hotel or camp.</Heading><a href="#trips" className="btn-ghost mb-10">All trips <ArrowRight size={18} /></a></div>
        </div>
        <div className="no-scrollbar flex snap-x gap-5 overflow-x-auto px-5 pb-4 sm:px-[max(2rem,calc((100vw-1240px)/2+2rem))]">
          {trips.map((s) => (
            <button key={s.id} onClick={() => setOpen(s)} className="group relative aspect-[3/4] w-[280px] shrink-0 snap-start overflow-hidden rounded-[28px] rounded-tr-[140px] text-left text-white shadow-card transition hover:-translate-y-1 sm:w-[320px]">
              <div className="absolute inset-0 transition duration-700 group-hover:scale-105"><Visual scene={s.scene} url={s.mediaUrl} label={s.name} /></div>
              <span className="absolute inset-0 bg-gradient-to-t from-abyss/90 via-abyss/10 to-transparent" />
              {s.badge && <span className="tab absolute left-4 top-4">{s.badge}</span>}
              <span className="absolute inset-x-5 bottom-5"><span className="text-sm text-white/75">{s.duration}</span><span className="block font-display text-xl font-black leading-tight">{s.name}</span><span className="price mt-2 block font-semibold">{egp(s.price)}</span></span>
            </button>
          ))}
        </div>
      </section>

      {/* ——— HOW IT WORKS ——— */}
      <section className="band bg-white">
        <div className="wrap">
          <Heading kicker="Simple from home" title="Booked, signed and paid|before you land" />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[[CalendarCheck, "Pick a date", "Choose your course, dive or trip and a start time. You'll get a booking reference instantly."], [FileSignature, "Sign the medical form", "Fill in your details and health questions online and sign with your finger. No paperwork at the center."], [CreditCard, "Pay securely", "Pay by card or mobile wallet through Paymob, or reserve and pay when you arrive."], [Waves, "Dive in", "Meet your instructor at the center — your gear is ready and your forms are already on file."]].map(([I, t, d], i) => {
              const Icon = I as typeof CalendarCheck;
              return <li key={i} data-reveal style={{ ["--d" as string]: `${i * 110}ms` }} className="relative rounded-[28px] bg-foam p-6"><span className="absolute right-5 top-5"><Phase i={i} size={26} /></span><span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-navy text-white"><Icon size={22} /></span><span className="mb-1 block font-display text-sm font-black text-sky">Phase {i + 1}</span><h3 className="text-xl font-bold">{t as string}</h3><p className="mt-2 text-ink/70">{d as string}</p></li>;
            })}
          </ol>
        </div>
      </section>

      {/* ——— QUIZ + SEA ——— */}
      <section className="band bg-white" id="quiz">
        <div className="wrap grid items-start gap-8 lg:grid-cols-2">
          <div><Heading kicker="3 taps" title="Which course|fits me?">Answer three quick questions and we'll point you to the right program.</Heading><SeaConditions /></div>
          <Quiz />
        </div>
      </section>

      {/* ——— FAMILY ——— */}
      <FamilyBlock />

      {/* ——— CLIENTS ——— */}
      <section className="band bg-foam">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4"><Heading kicker="Our divers" title="People who started|their diving with us" /><a href="#gallery" className="btn-ghost mb-10">See the gallery <ArrowRight size={18} /></a></div>
          <ClientWall clients={clients} />
        </div>
      </section>

      {/* ——— REVIEWS ——— */}
      <section className="bg-foam pb-16"><div className="wrap"><Reviews /></div></section>

      {/* ——— GALLERY PREVIEW ——— */}
      <section className="band bg-white">
        <div className="wrap">
          <Heading kicker="Gallery" title="Dahab,|above and below" />
          <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-4">
            {(gallery.length ? gallery.slice(0, 6).map((g) => ({ g, sc: "reef" as SceneKey, u: g.url })) : (["bluehole", "reef", "wadi", "night", "lagoon", "sinai"] as SceneKey[]).map((sc, i) => ({ g: undefined, sc, u: STOCK_GALLERY[i][0] }))).map(({ g, sc, u }, i) => (
              <a key={i} href="#gallery" className={`overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""} ${i === 3 ? "row-span-2" : ""} ${i === 5 ? "col-span-2" : ""}`}><Visual scene={sc} url={u} kind={g?.kind} className="transition duration-700 hover:scale-105" label={g?.caption || STOCK_GALLERY[i][1]} /></a>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FAQ + CONTACT ——— */}
      <section className="band bg-sand">
        <div className="wrap grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Heading kicker="Before you come" title="Good|questions" />
            <div className="divide-y divide-ink/10 rounded-3xl bg-white px-6">{FAQ.map((f) => <details key={f.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">{f.q}<ChevronDown className="shrink-0 transition group-open:rotate-180" /></summary><p className="mt-3 text-ink/70">{f.a}</p></details>)}</div>
          </div>
          <div className="relative self-start overflow-hidden rounded-[28px] rounded-br-[120px] bg-navy p-8 text-white">
            <Mark light gap="#15284B" className="mb-5 w-28" />
            <h3 className="text-3xl font-black leading-tight">{tr("Not sure which course fits?")}</h3>
            <p className="mt-3 text-white/80">{tr("Message us on WhatsApp with your experience and dates — we'll suggest a plan.")}</p>
            <div className="mt-6"><ContactList dark /></div>
            <div className="mt-8 flex flex-wrap gap-3"><BookButton id="" label="Start a booking" className="btn-coral" /><a href="#quiz" className="btn-light">{tr("Find my course")}</a></div>
          </div>
        </div>
      </section>

      <ServiceDetail s={open} onClose={() => setOpen(null)} />
      <Sheet open={!!stockReel} onClose={() => setStockReel(null)}>{stockReel && <div className="bg-black"><video src={stockReel} controls autoPlay playsInline className="mx-auto max-h-[85vh]" /></div>}</Sheet>
      <Sheet open={!!reel} onClose={() => setReel(null)}>{reel && <div className="bg-black"><video src={reel.url} controls autoPlay playsInline className="mx-auto max-h-[85vh]" /><p className="p-4 text-white">{reel.caption}</p></div>}</Sheet>
    </>
  );
}

function QuickBook({ services }: { services: Service[] }) {
  const { select } = useStore();
  const { t, sv, money } = useI18n();
  const [id, setId] = useState(services.find((s) => s.id === "owd")?.id || services[0]?.id || "");
  const [date, setDate] = useState(today());
  return (
    <form className="reveal mt-8 grid max-w-3xl gap-2 rounded-3xl bg-white p-2 text-ink shadow-card sm:grid-cols-[1.6fr_1fr_auto]" style={{ animationDelay: ".24s" }}
      onSubmit={(e) => { e.preventDefault(); try { sessionStorage.setItem("dd:date", date); } catch { /* */ } select(id); go("book"); }}>
      <label className="sr-only" htmlFor="qb-s">Program</label>
      <select id="qb-s" className="input border-0 focus:ring-0" value={id} onChange={(e) => setId(e.target.value)}>
        {(["course", "fun", "tour", "rental"] as const).map((c) => <optgroup key={c} label={t({ course: "Courses", fun: "Guided dives", tour: "Dahab trips", rental: "Rentals" }[c])}>{services.filter((s) => s.category === c).map((s) => <option key={s.id} value={s.id}>{sv(s).name} — {money(s.price)}</option>)}</optgroup>)}
      </select>
      <label className="sr-only" htmlFor="qb-d">Date</label>
      <input id="qb-d" type="date" min={today()} className="input border-0 focus:ring-0" value={date} onChange={(e) => setDate(e.target.value)} />
      <button className="btn-coral min-h-[50px] px-7">{t("Check & book")}</button>
    </form>
  );
}

function ClientWall({ clients }: { clients: MediaItem[] }) {
  const samples: { scene: SceneKey; caption: string; url: string }[] = [
    { scene: "classroom", caption: "Open Water graduates", url: STOCK.diverReef }, { scene: "bluehole", caption: "Blue Hole snorkel group", url: STOCK.dahabWaves },
    { scene: "diver", caption: "First intro dive", url: STOCK.anthias }, { scene: "tawilat", caption: "Tawilat night crew", url: STOCK.mountainSunset }
  ];
  if (clients.length) return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {clients.map((c, i) => <figure key={c.id} data-reveal className="relative"><div className="dframe aspect-square overflow-hidden shadow-card"><Visual scene="diver" url={c.url} kind={c.kind} label={c.caption} /></div><figcaption className="hand mt-3 text-[24px] text-navy">{c.caption}</figcaption>{i % 3 === 0 && <Stamp word="CERTIFIED" className="absolute -right-2 -top-4 w-20" />}</figure>)}
    </div>
  );
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {samples.map((c, i) => <figure key={c.caption} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }} className="relative"><div className="dframe aspect-square overflow-hidden shadow-card"><Visual scene={c.scene} url={c.url} label={c.caption} /></div><figcaption className="hand mt-3 text-[24px] text-navy">{c.caption}</figcaption>{i === 0 && <Stamp word="CERTIFIED" className="absolute -right-1 -top-4 w-20" />}</figure>)}
      </div>
      <div className="mt-6"><Empty>Sample layout — add your clients' photos and reels (with their permission) from Dashboard › Media and choose “Clients”.</Empty></div>
    </>
  );
}

/* Schematic coastline north → south (not to scale) */
const SITES = [
  { n: "Ras Abu Galum & Blue Lagoon", y: 70, side: "Boat or camel only · snorkel & dive", id: "lagoon" },
  { n: "The Bells", y: 150, side: "Chimney drop to the wall · Advanced", id: "bh-dive" },
  { n: "Blue Hole", y: 205, side: "The famous sinkhole · snorkel & dive", id: "bh-snorkel" },
  { n: "Canyon", y: 285, side: "Swim-through crack · Advanced", id: "canyon-dive" },
  { n: "Eel Garden", y: 350, side: "Sandy slope full of garden eels", id: "shore" },
  { n: "Lighthouse", y: 405, side: "Town reef · courses & night dives", id: "owd" },
  { n: "Islands", y: 470, side: "Coral maze in the south", id: "shore" },
  { n: "Three Pools", y: 540, side: "Calm coral pools · snorkel", id: "pools" }
];
function DiveMap() {
  const { services } = useStore();
  const [hover, setHover] = useState(5);
  const site = SITES[hover];
  const svc = useMemo(() => services.find((s) => s.id === site.id), [services, site]);
  return (
    <section className="band bg-white">
      <div className="wrap grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Heading kicker="The coastline" title="From Abu Galum to Three Pools">Most of Dahab's diving starts from the shore: walk in from the beach and you're on the reef in minutes. Tap a site.</Heading>
          <ul className="grid gap-2">
            {SITES.map((s, i) => (
              <li key={s.n}><button onClick={() => setHover(i)} onMouseEnter={() => setHover(i)} className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition ${i === hover ? "bg-sea text-white" : "hover:bg-foam"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${i === hover ? "bg-coral" : "bg-foam text-sea"}`}>{i + 1}</span>
                <span><span className="block font-semibold">{s.n}</span><span className={`text-sm ${i === hover ? "text-white/75" : "text-ink/60"}`}>{s.side}</span></span>
              </button></li>
            ))}
          </ul>
          {svc && <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-ink/70">Go there with <b>{svc.name}</b></span><BookButton id={svc.id} label="Book" /></div>}
        </div>
        <div className="relative overflow-hidden rounded-[32px] bg-[#1a9fc4] shadow-card">
          <svg viewBox="0 0 400 620" className="block h-auto w-full" role="img" aria-label="Schematic map of Dahab dive sites">
            <defs><linearGradient id="landg" x1="0" x2="1"><stop offset="0" stopColor="#c79a6a" /><stop offset="1" stopColor="#e2c08d" /></linearGradient></defs>
            <path d="M0 0 H215 q-30 60 -10 110 q30 40 0 95 q-40 50 -10 90 q20 40 -20 70 q-40 30 -10 80 q20 40 -15 80 q-30 40 -10 95 H0z" fill="url(#landg)" />
            <path d="M215 0 q-30 60 -10 110 q30 40 0 95 q-40 50 -10 90 q20 40 -20 70 q-40 30 -10 80 q20 40 -15 80 q-30 40 -10 95" stroke="#8fe6d9" strokeWidth="16" fill="none" opacity=".8" />
            <g fill="#a07344" opacity=".7"><polygon points="20,80 70,20 120,90" /><polygon points="40,260 90,200 150,270" /><polygon points="10,480 60,420 110,500" /></g>
            <text x="30" y="380" fill="#6b4a2a" fontSize="15" fontWeight="700">DAHAB</text>
            <circle cx="232" cy="205" r="20" fill="#063f7a" stroke="#8fe6d9" strokeWidth="5" />
            {SITES.map((s, i) => {
              const x = 250 + (i % 2) * 10; const on = i === hover;
              return <g key={s.n} transform={`translate(${x} ${s.y})`} style={{ cursor: "pointer" }} onClick={() => setHover(i)}>
                <circle r={on ? 15 : 11} fill={on ? "#ff6b57" : "#fff"} stroke="#04222b" strokeWidth="2" />
                <text textAnchor="middle" dy="4.5" fontSize="12" fontWeight="700" fill={on ? "#fff" : "#06485a"}>{i + 1}</text>
                {on && <text x={-22} dy="5" textAnchor="end" fontSize="15" fontWeight="700" fill="#04222b">{s.n}</text>}
              </g>;
            })}
            <g transform="translate(350 40)" fill="#fff"><path d="M0 -14 l7 18 h-14z" /><text y="20" textAnchor="middle" fontSize="12" fontWeight="700">N</text></g>
          </svg>
          <p className="absolute bottom-3 left-4 text-xs text-white/80">Schematic, not to scale</p>
        </div>
      </div>
    </section>
  );
}

function HeroBlock({ active, hero }: { active: Service[]; hero?: MediaItem }) {
  const bubbles = useBubbles<HTMLElement>();
  const { settings } = useStore();
  const { t, money } = useI18n();
  const heroUrl = hero?.url || settings.heroVideo;
  return (
    <section ref={bubbles} className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 -z-10">
        <HeroCanvas />
        {heroUrl && <div className="absolute inset-0"><HeroMedia url={heroUrl} kind={hero?.kind} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-navy/40" />
      </div>
      <div className="wrap pb-10 pt-32 sm:pb-16">
        <div className="reveal mb-6 flex flex-wrap items-center gap-3"><Mark light animate gap="#0f3550" className="w-28 sm:w-36" /><RedTab>{t("Diving Center · Dahab")}</RedTab></div>
        <h1 className="reveal max-w-4xl text-[42px] leading-[1.02] sm:text-[74px]" style={{ animationDelay: ".08s" }}><span className="font-black">{t("Learn to dive")}</span> <span className="font-black text-sun">{t("where the desert meets the Red Sea")}</span></h1>
        <p className="reveal mt-5 max-w-xl text-[18px] text-white/85" style={{ animationDelay: ".16s" }}>{t("Internationally recognised courses from your first breath to Divemaster, guided dives at the Blue Hole and Canyon, and the best of Dahab on land.")}</p>
        <p className="reveal mt-4" style={{ animationDelay: ".22s" }}><HandNote color="text-sun">{t("psst… your first dive starts at")} {money(Math.min(...active.filter((s) => s.category === "course").map((s) => s.price)))}</HandNote></p>
        <QuickBook services={active} />
        <a href="#paths" className="mt-8 hidden items-center gap-2 text-sm text-white/70 hover:text-white sm:inline-flex"><ChevronDown size={18} /> Move your mouse — the water moves with you</a>
      </div>
    </section>
  );
}

function HeroMedia({ url, kind }: { url: string; kind?: "image" | "video" }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null; // the animated canvas stays visible underneath
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || kind === "video"
    ? <AutoVideo src={url} poster={STOCK.heroPoster} className="opacity-90" onError={() => setOk(false)} />
    : <img src={url} alt="" className="kenburns h-full w-full object-cover" onError={() => setOk(false)} />;
}

function CoursePathStrip() {
  const steps = [["Discover Scuba", "12 m with an instructor"], ["Open Water", "18 m with a buddy"], ["Advanced", "30 m — Canyon and Bells"], ["Rescue", "look after others"]];
  return (
    <ol className="relative mb-10 grid grid-cols-2 gap-4 rounded-[28px] bg-white p-5 shadow-card sm:grid-cols-4 sm:p-6" data-reveal>
      <span className="absolute left-12 right-12 top-[46px] hidden border-t-2 border-dotted border-navy/25 sm:block" aria-hidden />
      {steps.map(([t, d], i) => <li key={t} className="relative"><span className="relative inline-grid h-12 w-12 place-items-center rounded-full bg-white"><Phase i={i} size={30} /></span><p className="mt-2 font-display font-black">{t}</p><p className="text-sm text-ink/60">{d}</p></li>)}
    </ol>
  );
}

function FamilyBlock() {
  const { media } = useStore();
  const crew = media.filter((m) => m.tag === "Team");
  const roles: { scene: SceneKey; role: string; note: string; photo: string }[] = [
    { scene: "diver", role: "Your instructor", note: "patient, funny, obsessed with buoyancy", photo: STOCK.diverReef },
    { scene: "classroom", role: "Your dive guide", note: "knows where the turtle sleeps", photo: STOCK.fishCorals },
    { scene: "tawilat", role: "Your desert guide", note: "makes the best Bedouin tea", photo: STOCK.camelsDesert }
  ];
  return (
    <section className="band relative overflow-hidden bg-sand">
      <div className="wrap grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div data-reveal>
          <RedTab className="mb-4">Our promise</RedTab>
          <h2 className="text-[34px] leading-[1.05] sm:text-[52px]"><span className="font-black">Come as a guest,</span> <span className="font-black text-red">leave as a family member</span></h2>
          <p className="mt-5 max-w-lg text-[17px] text-ink/75">It's written on our door, and we mean it. Small groups, the same faces every day, tea after the dive and a WhatsApp group that keeps going long after you fly home.</p>
          <div className="mt-6"><HandNote>See you at the center at 8:30!</HandNote></div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {(crew.length ? crew.slice(0, 3).map((m, i) => ({ m, ...roles[i % 3] })) : roles.map((r) => ({ m: undefined as MediaItem | undefined, ...r }))).map(({ m, scene, role, note, photo }, i) => (
            <figure key={role + i} data-reveal style={{ ["--d" as string]: `${i * 120}ms`, marginTop: i === 1 ? 40 : 0 }}>
              <div className="dframe aspect-[3/4] overflow-hidden shadow-card"><Visual scene={scene} url={m?.url || photo} kind={m?.kind} label={m?.caption || role} /></div>
              <figcaption className="mt-3"><span className="block font-display text-sm font-black sm:text-base">{m?.caption || role}</span><span className="hand block text-[19px] leading-tight text-ink/70 sm:text-[22px]">{note}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
      {!crew.length && <p className="wrap mt-8 text-sm text-ink/55">Add your team photos in Dashboard › Media with the tag “Team” and they replace these illustrations.</p>}
    </section>
  );
}
