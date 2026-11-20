/* Dahab Days brand elements — see the "Dahab Days brand identity" design system */
import { useEffect, useRef, useState, type ReactNode } from "react";
import logoH from "../assets/brand/dahab-days-logo-horizontal.svg";
import logoHWhite from "../assets/brand/dahab-days-logo-horizontal-white.svg";
import logoStackWhite from "../assets/brand/dahab-days-logo-stacked-white.svg";
import logoStack from "../assets/brand/dahab-days-logo-stacked.svg";

export const BRAND = { navy: "#15284B", sky: "#2EA3E3", sun: "#F6C71E", red: "#D3202F", white: "#FFFFFF" };

/* The four phases: full D, two gibbous Ds, crescent. `gap` must match the ground behind the mark. */
export function Mark({ className = "", gap = "#fff", light = false, animate = false, title = "Dahab Days" }: { className?: string; gap?: string; light?: boolean; animate?: boolean; title?: string }) {
  const c = light ? [BRAND.white, BRAND.white, BRAND.sky, BRAND.sun] : [BRAND.navy, BRAND.navy, BRAND.sky, BRAND.sun];
  const arc = (x: number) => <path d={`M${x} 0A30 30 0 0 1 ${x} 60`} fill="none" stroke={gap} strokeWidth={6} />;
  return (
    <svg viewBox="-4 -4 188 68" className={className} role="img" aria-label={title}>
      <g className={animate ? "phase-in" : ""}>
        <g><path d="M134 0H150A30 30 0 0 1 150 60H134A16 30 0 0 0 134 0Z" fill={c[3]} /></g>
        <g>{arc(114)}<path d="M90 0H114A30 30 0 0 1 114 60H90A14 30 0 0 0 90 0Z" fill={c[2]} /></g>
        <g>{arc(70)}<path d="M46 0H70A30 30 0 0 1 70 60H46A14 30 0 0 0 46 0Z" fill={c[1]} /></g>
        <g>{arc(26)}<path fillRule="evenodd" d="M0 0H26A30 30 0 0 1 26 60H0Z M13 21H21A9 9 0 0 1 21 39H13Z" fill={c[0]} /></g>
      </g>
    </svg>
  );
}

export function LogoImg({ variant = "horizontal", light = false, className = "" }: { variant?: "horizontal" | "stacked"; light?: boolean; className?: string }) {
  const src = variant === "horizontal" ? (light ? logoHWhite : logoH) : light ? logoStackWhite : logoStack;
  return <img src={src} alt="Dahab Days Diving Center" className={className} />;
}

/* One phase shape, used for bullets, steps and loaders */
export function Phase({ i, size = 22, className = "" }: { i: number; size?: number; className?: string }) {
  const fills = [BRAND.navy, BRAND.navy, BRAND.sky, BRAND.sun];
  const d = [
    "M0 0H26A30 30 0 0 1 26 60H0Z M13 21H21A9 9 0 0 1 21 39H13Z",
    "M0 0H24A30 30 0 0 1 24 60H0A14 30 0 0 0 0 0Z",
    "M0 0H24A30 30 0 0 1 24 60H0A14 30 0 0 0 0 0Z",
    "M0 0H16A30 30 0 0 1 16 60H0A16 30 0 0 0 0 0Z"
  ][i % 4];
  return <svg viewBox="-2 -2 60 64" width={size} height={size * 1.1} className={className} aria-hidden><path d={d} fillRule="evenodd" fill={fills[i % 4]} /></svg>;
}

export function PhaseLoader({ label = "Loading" }: { label?: string }) {
  return <span className="loader inline-flex items-end gap-1" role="status" aria-label={label}>{[0, 1, 2, 3].map((i) => <Phase key={i} i={i} size={18} />)}</span>;
}

/* Steps told as the four phases (booking steps, course path) */
export function PhaseSteps({ steps, active }: { steps: string[]; active: number }) {
  return (
    <ol className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <li key={s} className="flex shrink-0 items-center gap-2">
          <span className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 text-sm font-bold transition ${i === active ? "bg-navy text-white" : i < active ? "bg-sky/15 text-navy" : "bg-navy/5 text-navy/50"}`}>
            <span className={i > active ? "opacity-40" : ""}><Phase i={i} size={16} /></span>{s}
          </span>
          {i < steps.length - 1 && <span className="h-0.5 w-5 rounded bg-navy/15" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

export const RedTab = ({ children, className = "" }: { children: ReactNode; className?: string }) => <span className={`tab ${className}`}>{children}</span>;

export function HandNote({ children, className = "", color = "text-navy" }: { children: ReactNode; className?: string; color?: string }) {
  return (
    <span className={`hand relative inline-block text-[26px] leading-none ${color} ${className}`}>
      {children}
      <svg viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full" aria-hidden><path d="M4 8 Q110 14 296 5" stroke={BRAND.sun} strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
    </span>
  );
}

/* Logbook stamp: marks completed things (signed, paid, certified) */
export function Stamp({ word = "LOGGED", sub = "DAHAB DAYS", className = "", animate = true, color = BRAND.red }: { word?: string; sub?: string; className?: string; animate?: boolean; color?: string }) {
  return (
    <svg viewBox="0 0 180 180" className={`${animate ? "stamp-in" : ""} ${className}`} style={{ transform: "rotate(-8deg)" }} role="img" aria-label={word}>
      <circle cx="90" cy="90" r="82" fill="none" stroke={color} strokeWidth="5" />
      <circle cx="90" cy="90" r="70" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 5" />
      <text x="90" y="100" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="900" fontSize={word.length > 6 ? 24 : 30} fill={color} letterSpacing="1">{word}</text>
      <text x="90" y="124" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="700" fontSize="12" fill={color} letterSpacing="2.4">{sub}</text>
      <path transform="translate(80 42) scale(.38)" d="M0 0H16A30 30 0 0 1 16 60H0A16 30 0 0 0 0 0Z" fill={color} />
    </svg>
  );
}

/* Two-layer wave band between sea and land sections */
export function Wave({ top = "#ffffff", back = BRAND.sky, front = BRAND.navy, flip = false, className = "" }: { top?: string; back?: string; front?: string; flip?: boolean; className?: string }) {
  const path = (y: number, a: number) => { let d = `M0 ${y}`; for (let x = 0; x < 2400; x += 200) d += ` Q${x + 50} ${y - a} ${x + 100} ${y} T${x + 200} ${y}`; return d + " V80 H0Z"; };
  return (
    <div className={`relative h-14 overflow-hidden sm:h-20 ${className}`} style={{ background: top, transform: flip ? "scaleY(-1)" : undefined }} aria-hidden>
      <svg viewBox="0 0 2400 80" preserveAspectRatio="none" className="wave-move absolute bottom-0 left-0 h-full w-[200%]"><path d={path(40, 26)} fill={back} /></svg>
      <svg viewBox="0 0 2400 80" preserveAspectRatio="none" className="wave-move absolute bottom-0 left-0 h-full w-[200%]" style={{ animationDuration: "24s", animationDirection: "reverse" }}><path d={path(54, 18)} fill={front} /></svg>
    </div>
  );
}

/* Scrolling strip of places, red tabs between */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden bg-navy py-4 text-white" aria-label={items.join(", ")}>
      <div className="marquee flex w-max items-center gap-6">
        {row.map((t, i) => <span key={i} className="flex items-center gap-6 whitespace-nowrap font-display text-xl font-extrabold sm:text-2xl"><Phase i={i} size={20} />{t}</span>)}
      </div>
    </div>
  );
}

/* Counts up when it scrolls into view */
export function Counter({ to, suffix = "", className = "" }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null); const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current!; let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(); const step = (t: number) => { const p = Math.min(1, (t - t0) / 1200); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el); return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref} className={className}>{n}{suffix}</span>;
}

/* Depth gauge: scrolling the page = descending the reef */
const MARKS: [number, string][] = [[0, "Surface"], [12, "Discover Scuba limit"], [18, "Open Water limit"], [30, "Advanced limit"], [40, "Recreational limit"]];
export function DepthGauge() {
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    const on = () => { const max = document.documentElement.scrollHeight - innerHeight; setDepth(max > 0 ? Math.round((scrollY / max) * 40) : 0); };
    on(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);
  const label = [...MARKS].reverse().find(([m]) => depth >= m)?.[1] || "Surface";
  const phase = depth < 12 ? 3 : depth < 18 ? 2 : depth < 30 ? 1 : 0;
  return (
    <div className="pointer-events-none fixed bottom-4 start-4 z-30 flex items-center gap-2.5 rounded-full bg-white/95 py-1.5 pl-2 pr-4 text-navy shadow-card backdrop-blur sm:bottom-6 sm:start-6" aria-hidden>
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-navy/5"><Phase i={phase} size={18} /></span>
      <span className="leading-tight"><span className="block font-display text-[15px] font-black tabular-nums">{depth} m</span><span className="block text-[11px] font-semibold text-navy/60">{label}</span></span>
    </div>
  );
}

/* Bubbles that follow the pointer inside an element */
export function useBubbles<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = 0;
    const on = (e: PointerEvent) => {
      const now = performance.now(); if (now - last < 45) return; last = now;
      const r = el.getBoundingClientRect(); const b = document.createElement("span"); const s = 6 + Math.random() * 14;
      b.className = "bubble"; b.style.cssText = `left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px;width:${s}px;height:${s}px;--x:${(Math.random() - 0.5) * 40}px`;
      el.appendChild(b); setTimeout(() => b.remove(), 1500);
    };
    el.addEventListener("pointermove", on);
    return () => el.removeEventListener("pointermove", on);
  }, []);
  return ref;
}

/* Gentle 3D tilt on hover (pointer devices only) */
export function useTilt<T extends HTMLElement>(max = 6) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el || !matchMedia("(hover: hover)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-4px)`; };
    const leave = () => { el.style.transform = ""; };
    el.classList.add("tilt"); el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [max]);
  return ref;
}

/* Reveals every [data-reveal] element as it scrolls in (re-scans when the page changes) */
export function useRevealAll(key: string) {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    const scan = () => document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => io.observe(el));
    scan(); const mo = new MutationObserver(scan); mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [key]);
}

/* First-visit splash: the phases arrive one by one */
export function Splash() {
  const [show, setShow] = useState(() => { try { return !sessionStorage.getItem("dd:splash"); } catch { return false; } });
  useEffect(() => { if (!show) return; try { sessionStorage.setItem("dd:splash", "1"); } catch { /* */ } const t = setTimeout(() => setShow(false), 1500); return () => clearTimeout(t); }, [show]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-white" style={{ animation: "rise .3s reverse 1.2s forwards" }} aria-hidden>
      <div className="text-center"><Mark animate className="mx-auto w-48" /><p className="hand mt-4 text-3xl text-navy reveal" style={{ animationDelay: ".5s" }}>Come as a guest, leave as family</p></div>
    </div>
  );
}
