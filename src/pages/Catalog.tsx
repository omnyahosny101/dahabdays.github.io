import { useMemo, useState } from "react";
import { Check, ShieldCheck, Wrench, Award, Map } from "lucide-react";
import { BookButton, ContactList, Empty, Heading, ServiceCard, ServiceDetail, Sheet, Visual } from "../components/ui";
import Scene from "../components/Scene";
import { HandNote, Mark, Phase, RedTab, Stamp, Wave } from "../components/brand";
import { STOCK, STOCK_GALLERY } from "../lib/stock";
import { useI18n } from "../lib/i18n";
import { egp, useStore } from "../lib/store";
import type { Category, MediaItem, SceneKey, Service } from "../lib/types";

const PAGES: Record<Exclude<Category, "addon">, { title: string; lead: string; scene: SceneKey; kicker: string; img?: string }> = {
  course: { kicker: "Certification courses", title: "From first breath|to dive professional", lead: "Learn in calm, sunny water with small groups and patient instructors. Every course ends with an internationally recognised certification card.", scene: "classroom", img: STOCK.fishCorals },
  fun: { kicker: "Guided dives", title: "Dive Dahab's|legendary reefs", lead: "Already certified? Join our guides at the Lighthouse, Eel Garden, the Canyon and the Bells to Blue Hole traverse.", scene: "bells", img: STOCK.diverReef },
  tour: { kicker: "Dahab trips", title: "The desert,|the mountains and the lagoons", lead: "Snorkel the Blue Hole and Three Pools, take a boat to Ras Abu Galum, and spend a night under the stars at Gabal El Tawilat.", scene: "tawilat", img: STOCK.dahabCoastMountains },
  rental: { kicker: "Equipment rental", title: "Serviced gear,|ready when you are", lead: "Rent a full set or single pieces by the day. Everything is rinsed, checked and dried after each use.", scene: "gear" }
};

export default function Catalog({ category }: { category: Exclude<Category, "addon"> }) {
  const { t } = useI18n();
  const { services } = useStore();
  const page = PAGES[category];
  const list = services.filter((s) => s.active && s.category === category);
  const levels = useMemo(() => ["All", ...Array.from(new Set(list.map((s) => s.level).filter(Boolean) as string[]))], [list]);
  const [lvl, setLvl] = useState("All");
  const [open, setOpen] = useState<Service | null>(null);
  const shown = list.filter((s) => lvl === "All" || s.level === lvl);

  return (
    <>
      <section className="relative isolate flex min-h-[62svh] items-end overflow-hidden bg-navy pt-[68px] text-white">
        <div className="absolute inset-0 -z-10"><Visual scene={page.scene} url={page.img} animate label={page.kicker} /><div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" /></div>
        <div className="wrap pb-12"><RedTab className="reveal">{t(page.kicker)}</RedTab><h1 className="reveal mt-4 max-w-3xl text-[40px] leading-[1.04] sm:text-[62px]" style={{ animationDelay: ".08s" }}><span className="font-black">{t(page.title.split("|")[0])}</span> <span className="font-medium text-sky">{t(page.title.split("|")[1])}</span></h1><p className="reveal mt-4 max-w-2xl text-[18px] text-white/80" style={{ animationDelay: ".16s" }}>{page.lead}</p></div>
      </section>

      {category === "rental" ? <Rentals list={list} /> : (
        <section className="band bg-foam">
          <div className="wrap">
            {levels.length > 2 && <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">{levels.map((l) => <button key={l} onClick={() => setLvl(l)} className={`btn border ${l === lvl ? "border-sea bg-sea text-white" : "border-ink/15 bg-white"}`}>{l}</button>)}</div>}
            {shown.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{shown.map((s, i) => <ServiceCard key={s.id} s={s} i={i} onOpen={setOpen} />)}</div> : <Empty>No programs here yet.</Empty>}
          </div>
        </section>
      )}

      {category === "course" && <CoursePath />}
      {category !== "rental" && <Promise />}
      <ServiceDetail s={open} onClose={() => setOpen(null)} />
    </>
  );
}

function CoursePath() {
  const steps = [["Discover Scuba", "12 m with an instructor"], ["Open Water", "18 m, dive with a buddy"], ["Advanced", "30 m, Canyon & Bells"], ["Rescue + First Aid", "Look after others"], ["Divemaster", "Go professional"]];
  return (
    <section className="band bg-white">
      <div className="wrap">
        <Heading kicker="Your diving path" title="Each course|opens the next phase" />
        <ol className="relative grid gap-4 sm:grid-cols-5">
          <span className="absolute left-6 right-6 top-7 hidden border-t-2 border-dotted border-navy/25 sm:block" aria-hidden />
          {steps.map(([t, d], i) => <li key={t} className="relative" data-reveal style={{ ["--d" as string]: `${i * 100}ms` }}><span className="relative inline-grid h-14 w-14 place-items-center rounded-full bg-white"><Phase i={Math.min(i, 3)} size={34} /></span><p className="mt-3 font-display font-black">{t}</p><p className="text-sm text-ink/60">{d}</p></li>)}
        </ol>
      </div>
    </section>
  );
}

function Promise() {
  return (
    <section className="band bg-sand">
      <div className="wrap grid gap-6 sm:grid-cols-3">
        {[[ShieldCheck, "Safety first", "Briefings before every dive, oxygen and first aid on site, and medical forms checked before anyone gets wet."], [Award, "Small groups", "Courses run with up to four students per instructor so you get real attention."], [Map, "Local knowledge", "Our team picks sites by the day's wind and current, so you dive where it's best."]].map(([I, t, d]) => { const Icon = I as typeof Check; return <div key={t as string} data-reveal className="rounded-[28px] rounded-br-[90px] bg-white p-6"><Icon className="text-red" /><h3 className="mt-4 text-xl font-bold">{t as string}</h3><p className="mt-2 text-ink/70">{d as string}</p></div>; })}
      </div>
    </section>
  );
}

function Rentals({ list }: { list: Service[] }) {
  const full = list.find((s) => s.id === "r-full");
  const rest = list.filter((s) => s !== full);
  return (
    <section className="band bg-foam">
      <div className="wrap grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {full && <div className="card self-start"><div className="aspect-[4/3]"><Visual scene={full.scene} url={full.mediaUrl} label={full.name} /></div><div className="p-6"><span className="chip bg-coral text-white">{full.badge}</span><h2 className="mt-3 text-2xl font-extrabold">{full.name}</h2><p className="mt-2 text-ink/70">{full.description}</p><ul className="mt-4 grid grid-cols-2 gap-2">{full.includes.map((i) => <li key={i} className="flex gap-2 text-sm"><Check size={16} className="shrink-0 text-lagoon" />{i}</li>)}</ul><div className="mt-6 flex items-center justify-between"><p><span className="price text-3xl font-extrabold text-sea">{egp(full.price)}</span> <span className="text-ink/55">{full.unit}</span></p><BookButton id={full.id} label="Reserve" className="btn-coral" /></div></div></div>}
        <div className="card">
          <div className="flex items-center gap-2 border-b p-6"><Wrench className="text-sea" /><h2 className="text-xl font-bold">Single items</h2></div>
          <ul className="divide-y">
            {rest.filter((s) => s.category === "rental").map((s) => <li key={s.id} className="flex flex-wrap items-center gap-4 p-5"><span className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl"><Visual scene={s.scene} url={s.mediaUrl} label={s.name} /></span><span className="min-w-[10rem] flex-1"><span className="block font-semibold">{s.name}</span><span className="text-sm text-ink/60">{s.short}</span></span><span className="text-right"><span className="price block font-bold text-sea">{egp(s.price)}</span><span className="text-xs text-ink/55">{s.unit}</span></span><BookButton id={s.id} label="Reserve" className="btn-ghost" /></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Gallery ---------- */
const SAMPLE_SCENES: SceneKey[] = ["bluehole", "reef", "classroom", "tawilat", "turtle", "canyon", "pools", "diver", "lagoon", "night", "sinai", "bells"];
const SAMPLE: { sc: SceneKey; tag: string; caption: string; url?: string }[] = STOCK_GALLERY.map(([url, caption, tag], i) => ({ sc: SAMPLE_SCENES[i % 12], tag, caption, url }));
const OLD_SAMPLE: { sc: SceneKey; tag: string; caption: string }[] = [
  { sc: "bluehole", tag: "Trips", caption: "Blue Hole from above" }, { sc: "reef", tag: "Underwater", caption: "Lighthouse reef" },
  { sc: "classroom", tag: "Courses", caption: "Open Water skills" }, { sc: "tawilat", tag: "Trips", caption: "Gabal El Tawilat" },
  { sc: "turtle", tag: "Underwater", caption: "Green turtle" }, { sc: "canyon", tag: "Underwater", caption: "Inside the Canyon" },
  { sc: "pools", tag: "Trips", caption: "Three Pools" }, { sc: "diver", tag: "Courses", caption: "Intro dive" },
  { sc: "lagoon", tag: "Trips", caption: "Blue Lagoon" }, { sc: "night", tag: "Underwater", caption: "Night dive" },
  { sc: "sinai", tag: "Trips", caption: "Sinai sunrise" }, { sc: "bells", tag: "Underwater", caption: "The Bells" }
];

export function Gallery() {
  const { media } = useStore();
  const items = media.filter((m) => m.role !== "hero" && m.role !== "guest");
  const real = items.length > 0;
  const tags = ["All", ...Array.from(new Set((real ? items.map((m) => m.tag) : SAMPLE.map((s) => s.tag)).filter(Boolean)))];
  const [tag, setTag] = useState("All");
  const [view, setView] = useState<MediaItem | null>(null);
  const list = real ? items.filter((m) => tag === "All" || m.tag === tag) : SAMPLE.filter((s) => tag === "All" || s.tag === tag);
  return (
    <>
      <section className="bg-navy pb-12 pt-32 text-white"><div className="wrap"><RedTab>Gallery and reels</RedTab><h1 className="mt-4 text-[40px] leading-tight sm:text-[62px]"><span className="font-black">Moments</span> <span className="font-medium text-sky">from Dahab</span></h1><p className="mt-3 max-w-xl text-white/75">Photos and clips from our courses, dives, trips and the people who joined them.</p></div></section>
      <Wave top="#15284B" back="#2EA3E3" front="#FFFFFF" />
      <section className="band bg-white">
        <div className="wrap">
          <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto">{tags.map((t) => <button key={t} onClick={() => setTag(t)} className={`btn border ${t === tag ? "border-sea bg-sea text-white" : "border-ink/15"}`}>{t}</button>)}</div>
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
            {real ? (list as MediaItem[]).map((m, i) => (
              <button key={m.id} onClick={() => setView(m)} className={`block w-full overflow-hidden rounded-2xl ${m.role === "reel" ? "aspect-[9/16]" : i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}`}><Visual scene="reef" url={m.url} kind={m.kind} label={m.caption} className="transition duration-700 hover:scale-105" /></button>
            )) : (list as typeof SAMPLE).map((s, i) => (
              <figure key={s.caption} data-reveal className={`relative w-full overflow-hidden ${i % 2 ? "rounded-[24px] rounded-tr-[120px]" : "rounded-[24px] rounded-bl-[120px]"} ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}`}><Visual scene={s.sc} url={s.url} label={s.caption} /><figcaption className="hand absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 p-3 text-[22px] text-white">{s.caption}</figcaption></figure>
            ))}
          </div>
          {!real && <div className="mt-6"><Empty>Stock photos from Pexels for now — upload your own photos and reels in Dashboard › Media to replace them.</Empty></div>}
        </div>
      </section>
      <Sheet wide open={!!view} onClose={() => setView(null)}>{view && <div className="bg-black">{view.kind === "video" ? <video src={view.url} controls autoPlay playsInline className="mx-auto max-h-[85vh]" /> : <img src={view.url} alt={view.caption} className="mx-auto max-h-[85vh]" />}<p className="p-4 text-white">{view.caption}</p></div>}</Sheet>
    </>
  );
}

export function Contact() {
  const { settings } = useStore();
  return (
    <section className="bg-foam pb-20 pt-32">
      <div className="wrap grid gap-8 lg:grid-cols-2">
        <div><RedTab>Contact</RedTab><h1 className="mt-4 text-[40px] leading-tight sm:text-[52px]"><span className="font-black">Talk to</span> <span className="font-medium text-sky">the family</span></h1><p className="mt-3 text-ink/70">Tell us your dates and experience and we'll suggest the right course or dive plan.</p><div className="mt-8 rounded-3xl bg-white p-6"><ContactList /></div><a href={"https://wa.me/" + settings.whatsapp} target="_blank" rel="noreferrer" className="btn-coral mt-6">Message on WhatsApp</a></div>
        <div className="relative"><div className="dframe aspect-[4/3] overflow-hidden shadow-card"><Visual scene="lagoon" url={STOCK.dahabBoatBlue} label="Dahab coast" /></div><Stamp word="HELLO" sub="FROM DAHAB" className="absolute -bottom-6 left-6 w-28" /><Mark className="absolute -top-6 right-10 w-28 drop-shadow" /></div>
      </div>
    </section>
  );
}
