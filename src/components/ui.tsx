import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X, Phone, MessageCircle, Mail, MapPin, Instagram, Clock, Users, Play, Check } from "lucide-react";
import Scene from "./Scene";
import { LogoImg, Mark, Phase, RedTab, useTilt } from "./brand";
import { LangCurSwitch, useI18n } from "../lib/i18n";
import { track } from "../lib/analytics";
import { ShoppingBag, UserRound } from "lucide-react";
import type { MediaItem, SceneKey, Service } from "../lib/types";
import { egp, go, useStore, type Route } from "../lib/store";
import { STOCK } from "../lib/stock";

/* ---------- Animated underwater hero (plays when no hero video is uploaded) ---------- */
export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, t = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const fit = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const ro = new ResizeObserver(fit); ro.observe(c); fit();
    const bubbles = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 4, v: 0.0006 + Math.random() * 0.0016 }));
    const fish = Array.from({ length: 34 }, (_, i) => ({ o: i * 0.37, d: Math.random() * 0.12, s: 0.5 + Math.random() * 0.6 }));
    const frame = () => {
      t += 1;
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#2EA3E3"); g.addColorStop(0.42, "#1b4f86"); g.addColorStop(1, "#0E1A33");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // light rays
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const x = (i / 7) * w + Math.sin(t / 140 + i) * 40; const sw = 40 + (i % 3) * 30;
        const rg = ctx.createLinearGradient(0, 0, 0, h * 0.9); rg.addColorStop(0, "rgba(255,255,255,.16)"); rg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + sw, 0); ctx.lineTo(x + sw * 2.4 - 80, h); ctx.lineTo(x - 60, h); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      // surface caustics
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2;
      for (let row = 0; row < 3; row++) { ctx.beginPath(); for (let x = 0; x <= w; x += 12) ctx.lineTo(x, 18 + row * 14 + Math.sin(x / 40 + t / 30 + row) * 5); ctx.stroke(); }
      // fish school following a lazy figure-eight
      const cx = w * 0.62 + Math.sin(t / 260) * w * 0.12, cy = h * 0.42 + Math.sin(t / 180) * h * 0.08;
      ctx.fillStyle = "rgba(246,199,30,.95)";
      for (const f of fish) {
        const a = t / 90 + f.o; const fx = cx + Math.cos(a) * (60 + f.d * 900) * 0.9, fy = cy + Math.sin(a * 1.3) * (30 + f.d * 300);
        const dir = -Math.sin(a) >= 0 ? 1 : -1;
        ctx.save(); ctx.translate(fx, fy); ctx.scale(dir * f.s, f.s);
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -8, 14, 0); ctx.quadraticCurveTo(0, 8, -14, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-21, -6); ctx.lineTo(-21, 6); ctx.fill(); ctx.restore();
      }
      // diver silhouette drifting
      const dx = ((t * 0.35) % (w + 400)) - 200, dy = h * 0.66 + Math.sin(t / 70) * 8;
      ctx.save(); ctx.translate(dx, dy); ctx.rotate(-0.08); ctx.fillStyle = "rgba(14,26,51,.85)";
      const rr = (x: number, y: number, ww: number, hh: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, ww, hh, r); ctx.fill(); };
      rr(-90, -2, 70, 16, 8); rr(-26, -12, 74, 28, 14); rr(-18, -26, 54, 14, 7);
      ctx.beginPath(); ctx.arc(60, -4, 14, 0, 7); ctx.fill();
      const kick = Math.sin(t / 12) * 8;
      ctx.beginPath(); ctx.moveTo(-90, 4); ctx.lineTo(-128, -12 + kick); ctx.lineTo(-122, 12 + kick * 0.3); ctx.fill();
      ctx.restore();
      // bubbles
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2;
      for (const b of bubbles) { b.y -= b.v; if (b.y < -0.05) { b.y = 1.05; b.x = Math.random(); } ctx.beginPath(); ctx.arc(b.x * w + Math.sin(t / 40 + b.r) * 6, b.y * h, b.r, 0, 7); ctx.stroke(); }
      // reef silhouette
      ctx.fillStyle = "#0E1A33"; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h - 50 - Math.abs(Math.sin(x / 70)) * 40 - (Math.sin(x / 23) > 0.7 ? 30 : 0));
      ctx.lineTo(w, h); ctx.fill();
      if (!still) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

/* ---------- Background video: always muted + inline, never shows a play button.
   If the phone refuses autoplay (e.g. iPhone Low Power Mode) we show the poster photo instead. ---------- */
export function AutoVideo({ src, poster, className = "", label, onError }: { src: string; poster?: string; className?: string; label?: string; onError?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    v.muted = true; v.defaultMuted = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    const tryPlay = () => v.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    tryPlay();
    const retry = () => { if (v.paused) tryPlay(); };
    window.addEventListener("touchstart", retry, { once: true, passive: true });
    return () => window.removeEventListener("touchstart", retry);
  }, [src]);
  return <>
    <video ref={ref} src={src} poster={poster} className={`autovideo h-full w-full object-cover ${blocked && poster ? "invisible absolute" : ""} ${className}`} autoPlay muted loop playsInline preload="metadata" disablePictureInPicture controls={false} aria-label={label} onError={onError} />
    {blocked && poster && <img src={poster} alt={label || ""} className={`h-full w-full object-cover ${className}`} />}
  </>;
}

/* Every picture slot gets a real photo: owner media first, then a matching stock photo, then (only if offline) the illustration */
const SCENE_PHOTO: Partial<Record<SceneKey, string>> = {
  reef: STOCK.redSeaCorals, bluehole: STOCK.dahabWaves, bells: STOCK.diverCavern, canyon: STOCK.diverCavern, diver: STOCK.diverReef,
  classroom: STOCK.fishCorals, turtle: STOCK.anthias, night: STOCK.dahabTwilight, pools: STOCK.dahabBoatBlue, lagoon: STOCK.dahabCoastMountains,
  tawilat: STOCK.mountainSunset, ghazala: STOCK.sinaiMountains, wadi: STOCK.camelsDesert, sinai: STOCK.dahabCliffMeditate, gear: STOCK.diverReef
};

/* ---------- A picture slot ---------- */
export function Visual({ scene, url, kind, className = "", animate = false, label, poster }: { scene: SceneKey; url?: string; kind?: "image" | "video"; className?: string; animate?: boolean; label?: string; poster?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const [stockFailed, setStockFailed] = useState(false);
  const isVideo = kind === "video" || (!!url && /\.(mp4|webm|mov)(\?|$)/i.test(url));
  if (!url || failed) {
    const photo = SCENE_PHOTO[scene];
    if (photo && !stockFailed) return <img src={photo} alt={label || ""} loading="lazy" onError={() => setStockFailed(true)} className={`h-full w-full object-cover ${animate ? "kenburns" : ""} ${className}`} />;
    return <Scene k={scene} animate={animate} label={label} className={className} />;
  }
  if (isVideo) return <AutoVideo src={url} poster={poster} className={className} label={label} onError={() => setFailed(true)} />;
  return <img src={url} alt={label || ""} loading="lazy" onError={() => setFailed(true)} className={`h-full w-full object-cover ${animate ? "kenburns" : ""} ${className}`} />;
}

/* ---------- Navigation ---------- */
const LINKS: [Route, string][] = [["courses", "Courses"], ["dives", "Guided dives"], ["trips", "Dahab trips"], ["rentals", "Rentals"], ["gallery", "Gallery"], ["blog", "Blog"], ["contact", "Contact"]];

export function Nav({ route, overlay }: { route: Route; overlay: boolean }) {
  const { t } = useI18n();
  const { cart } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const on = () => setScrolled(scrollY > 40); on(); addEventListener("scroll", on, { passive: true }); return () => removeEventListener("scroll", on); }, []);
  useEffect(() => setOpen(false), [route]);
  const solid = !overlay || scrolled || open;
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition ${solid ? "bg-white/95 text-ink shadow-sm backdrop-blur" : "text-white"}`}>
      <div className="wrap flex h-[68px] items-center gap-4">
        <a href="#home" className="group flex items-center" aria-label="Dahab Days home">
          <LogoImg light={!solid} className="h-10 w-auto transition group-hover:scale-[1.03] sm:h-11" />
        </a>
        <nav className="ms-auto hidden items-center gap-0.5 xl:flex">
          {LINKS.map(([r, l]) => <a key={r} href={"#" + r} className="relative whitespace-nowrap rounded-full px-2.5 py-2 text-[15px] font-semibold transition hover:opacity-75">{t(l)}{route === r && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"><Phase i={3} size={10} /></span>}</a>)}
        </nav>
        <div className="ms-auto hidden sm:block xl:ms-2"><LangCurSwitch dark={!solid} /></div>
        <a href="#account" className="btn hidden px-2.5 sm:inline-flex" aria-label={t("My account")}><UserRound size={20} /></a>
        <a href="#book" className="btn-coral relative ms-auto sm:ms-0">{t("Book now")}{cart.length > 0 && <span className="absolute -end-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-sun px-1 text-xs font-black text-navy"><ShoppingBag size={12} className="me-0.5" />{cart.length}</span>}</a>
        <button className="btn -me-2 px-3 xl:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <nav className="wrap grid gap-1 pb-5 xl:hidden">
          <div className="py-2 sm:hidden"><LangCurSwitch /></div>
          {LINKS.map(([r, l]) => <a key={r} href={"#" + r} className="rounded-xl px-3 py-3 text-lg font-semibold hover:bg-foam">{t(l)}</a>)}
          <a href="#account" className="rounded-xl px-3 py-3 text-lg font-semibold hover:bg-foam">{t("My account")}</a>
          <a href="#manage" className="rounded-xl px-3 py-3 text-lg font-semibold hover:bg-foam">{t("Manage booking")}</a>
          <a href="#admin" className="rounded-xl px-3 py-3 text-sm text-ink/60">{t("Owner dashboard")}</a>
        </nav>
      )}
    </header>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return <LogoImg light={light} className="h-10 w-auto" />;
}

/* ---------- Footer ---------- */
export function Footer() {
  const { settings } = useStore();
  const { t } = useI18n();
  return (
    <footer className="bg-navy text-white">
      <div className="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5"><LogoImg variant="stacked" light className="h-28 w-auto" /><p className="hand text-[26px] leading-tight text-sun">{t("Come as a guest, leave as a family member.")}</p></div>
        <div><h3 className="mb-3 font-bold">{t("Explore")}</h3><ul className="space-y-2 text-white/75">{LINKS.map(([r, l]) => <li key={r}><a href={"#" + r} className="hover:text-white">{t(l)}</a></li>)}<li><a href="#manage" className="hover:text-white">{t("Manage booking")}</a></li><li><a href="#account" className="hover:text-white">{t("My account")}</a></li></ul></div>
        <div><h3 className="mb-3 font-bold">{t("Contact")}</h3><ContactList dark /></div>
        <div><h3 className="mb-3 font-bold">{t("Plan your trip")}</h3><p className="mb-4 text-white/70">{t("Reserve your spot, sign your medical form online and arrive ready to dive.")}</p><a href="#book" className="btn-coral">{t("Book a program")}</a></div>
      </div>
      <div className="border-t border-white/10"><div className="wrap flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-white/55"><span>© {new Date().getFullYear()} {settings.centerName}</span><span>Stock photos and videos: Pexels contributors</span><a href="#admin" className="hover:text-white">{t("Owner dashboard")}</a></div></div>
    </footer>
  );
}

export function ContactList({ dark = false }: { dark?: boolean }) {
  const { settings: s } = useStore();
  const cls = dark ? "text-white/80" : "text-ink/80";
  return (
    <ul className={`space-y-3 ${cls}`}>
      <li className="flex gap-3"><Phone size={18} className="mt-0.5 shrink-0" /><a href={"tel:" + s.phone.replace(/\s/g, "")}>{s.phone}</a></li>
      <li className="flex gap-3"><MessageCircle size={18} className="mt-0.5 shrink-0" /><a href={"https://wa.me/" + s.whatsapp} target="_blank" rel="noreferrer">WhatsApp {s.phone}</a></li>
      <li className="flex gap-3"><Mail size={18} className="mt-0.5 shrink-0" /><a href={"mailto:" + s.email}>{s.email}</a></li>
      <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0" /><span>{s.address}</span></li>
      {s.instagram && <li className="flex gap-3"><Instagram size={18} className="mt-0.5 shrink-0" /><a href={s.instagram} target="_blank" rel="noreferrer">Instagram</a></li>}
    </ul>
  );
}

/* ---------- Section heading: red-tab kicker + Black/Medium pair like DAHAB DAYS ("Bold part|light part") ---------- */
export function Heading({ kicker, title, children, light = false }: { kicker?: string; title: string; children?: ReactNode; light?: boolean }) {
  const { t } = useI18n();
  const [a, b] = title.split("|").map((x) => t(x.trim()));
  kicker = kicker && t(kicker);
  if (typeof children === "string") children = t(children);
  return (
    <div className="mb-10 max-w-2xl" data-reveal>
      {kicker && <RedTab className="mb-4">{kicker}</RedTab>}
      <h2 className="text-[32px] leading-[1.05] sm:text-[46px]"><span className="font-black">{a}</span>{b && <span className={`font-black ${light ? "text-sun" : "text-red"}`}> {b}</span>}</h2>
      {children && <p className={`mt-4 text-[17px] ${light ? "text-white/75" : "text-ink/70"}`}>{children}</p>}
    </div>
  );
}

/* ---------- Service card + detail sheet ---------- */
export function ServiceCard({ s, onOpen, i = 0 }: { s: Service; onOpen: (s: Service) => void; i?: number }) {
  const tilt = useTilt<HTMLElement>();
  const { t, money, sv, from } = useI18n();
  const L = sv(s);
  return (
    <article ref={tilt} className="card group flex flex-col" data-reveal style={{ ["--d" as string]: `${(i % 4) * 90}ms` }}>
      <button onClick={() => onOpen(s)} className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-[22px] rounded-br-[120px] text-left" aria-label={"Details: " + s.name}>
        <div className="h-full w-full transition duration-700 group-hover:scale-105"><Visual scene={s.scene} url={s.mediaUrl} label={s.name} /></div>
        {s.badge && <span className="tab absolute left-3 top-3 shadow">{s.badge}</span>}
        {s.level && <span className="chip absolute bottom-3 left-3 bg-white/95 text-navy">{s.level}</span>}
      </button>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="flex items-start gap-2 text-xl font-extrabold leading-tight"><span className="wiggle mt-1 shrink-0"><Phase i={i} size={16} /></span>{L.name}</h3>
        <p className="text-ink/70">{L.short}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/60"><span className="flex items-center gap-1.5"><Clock size={15} />{s.duration}</span>{s.minAge && <span className="flex items-center gap-1.5"><Users size={15} />Age {s.minAge}+</span>}</div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p>{!!s.variants?.length && <span className="block text-xs font-semibold uppercase tracking-wide text-ink/50">{t("from")}</span>}<span className="price font-display text-2xl font-black text-navy">{money(from(s))}</span><span className="block text-sm text-ink/55">{t(s.unit)}</span></p>
          <BookButton id={s.id} />
        </div>
      </div>
    </article>
  );
}

export function BookButton({ id, label = "Book", className = "btn-sea" }: { id: string; label?: string; className?: string }) {
  const { select } = useStore();
  const { t } = useI18n();
  return <button className={className} onClick={() => { select(id); go("book"); }}>{t(label)}</button>;
}

export function Sheet({ open, onClose, children, wide = false }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal>
      <div className={`relative max-h-[92vh] w-full overflow-auto rounded-t-3xl bg-white sm:rounded-3xl ${wide ? "max-w-4xl" : "max-w-2xl"}`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="btn absolute right-3 top-3 z-10 bg-white/90 px-3 text-ink shadow" aria-label="Close"><X size={20} /></button>
        {children}
      </div>
    </div>
  );
}

export function PriceNote({ s }: { s: Service }) {
  const { t, market } = useI18n();
  return <p className="text-sm text-ink/60">{t(market === "eg" ? "Egyptian & resident prices — please bring your ID or residency to the center." : "International prices in euro. You pay in Egyptian pounds at today's rate.")}{" "}{s.category === "fun" ? t("Taxi from the center to the dive site is included. Nature reserve fees are not included.") : s.category === "course" ? t("Courses include the full equipment.") : s.category === "rental" && s.priceWeekEur ? t("Weekly price applied automatically.") : ""}</p>;
}

export function ServiceDetail({ s, onClose }: { s: Service | null; onClose: () => void }) {
  const { t, money, sv, from, unit, market, eurRate } = useI18n();
  useEffect(() => { if (s) track("ViewContent", { id: s.id, name: s.name, value: from(s) }); }, [s]);
  const groups = s?.variants?.length ? [...new Set(s.variants.map((v) => v.group || ""))] : [];
  return (
    <Sheet open={!!s} onClose={onClose}>
      {s && <>
        <div className="aspect-[16/9]"><Visual scene={s.scene} url={s.mediaUrl} animate label={s.name} /></div>
        <div className="space-y-5 p-6 sm:p-8">
          <div><p className="font-semibold text-coral">{s.duration}</p><h3 className="mt-1 text-3xl font-black leading-tight">{sv(s).name}</h3></div>
          <p className="text-[17px] text-ink/75">{sv(s).name !== s.name ? sv(s).short : s.description || s.short}</p>
          {s.includes.length > 0 && <ul className="grid gap-2 sm:grid-cols-2">{s.includes.map((x, k) => <li key={x} className="flex gap-2.5"><span className="mt-1 shrink-0"><Phase i={k} size={14} /></span>{x}</li>)}</ul>}
          <div className="flex flex-wrap gap-2 text-sm">{s.slots.map((x) => <span key={x} className="chip bg-foam text-sea">{t("Starts")} {x}</span>)}{s.requiresConsent && <span className="chip bg-sand text-ink">{t("Medical form required")}</span>}</div>
          {groups.length > 0 && <div className="overflow-hidden rounded-2xl border border-navy/10">{groups.map((g) => <div key={g}>{g && <p className="bg-foam px-4 py-2 text-sm font-bold text-navy">{t(g)}</p>}<ul className="divide-y">{s.variants!.filter((v) => (v.group || "") === g).map((v) => <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5"><span className={v.id.includes("attar") ? "font-semibold text-royal" : ""}>{(() => { const x = t(g ? v.label.replace(g + " · ", "") : v.label); return x.charAt(0).toUpperCase() + x.slice(1); })()}</span><b className="price shrink-0">{money(unit(s, v.id))}</b></li>)}</ul></div>)}</div>}
          {s.category === "rental" && s.priceWeekEur != null && <p className="rounded-2xl bg-foam px-4 py-3"><b className="price">{money(unit(s))}</b> {t("per day")} · <b className="price">{money(market === "eg" ? s.priceWeek || 0 : Math.round(s.priceWeekEur * eurRate))}</b> {t("per week")}</p>}
          <PriceNote s={s} />
          <div className="flex items-center justify-between gap-4 border-t pt-5"><p>{!!s.variants?.length && <span className="text-sm text-ink/55">{t("from")} </span>}<span className="price font-display text-3xl font-black text-navy">{money(from(s))}</span> <span className="text-ink/55">{t(s.unit)}</span></p><BookButton id={s.id} label="Book this" className="btn-coral" /></div>
        </div>
      </>}
    </Sheet>
  );
}

/* ---------- Reel card (9:16) ---------- */
export function ReelCard({ m, scene, caption, onOpen, url, poster }: { m?: MediaItem; scene: SceneKey; caption: string; onOpen?: () => void; url?: string; poster?: string }) {
  return (
    <button onClick={onOpen} className="group relative aspect-[9/16] w-[220px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-abyss text-left text-white shadow-card sm:w-[250px]">
      <Visual scene={scene} url={m?.url || url} kind={m?.kind || (url ? "video" : undefined)} poster={poster} animate label={caption} />
      <span className="absolute inset-0 bg-gradient-to-t from-abyss/90 via-transparent to-transparent" />
      <span className="absolute inset-x-4 bottom-4 text-[15px] font-semibold leading-snug">{caption}</span>
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border-2 border-dashed border-navy/15 p-8 text-center text-ink/60"><Mark className="mx-auto mb-3 w-16 opacity-60" />{children}</div>;
}
