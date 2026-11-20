/* Guest-facing extras: live sea conditions, Google reviews, course finder quiz */
import { useEffect, useState } from "react";
import { Droplets, ExternalLink, Navigation, Star, Thermometer, Waves as WavesIcon, Wind } from "lucide-react";
import { BookButton } from "./ui";
import { Phase, RedTab } from "./brand";
import { useI18n } from "../lib/i18n";
import { useStore } from "../lib/store";

/* ---------- Live sea and wind (Open-Meteo, free, no key) ---------- */
const LAT = 28.49, LON = 34.53;
type Sea = { water?: number; wave?: number; wind?: number; dir?: number; air?: number; at?: string };
const compass = (d?: number) => (d == null ? "" : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(d / 45) % 8]);

export function SeaConditions() {
  const { t } = useI18n();
  const [sea, setSea] = useState<Sea | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&current=wave_height,sea_surface_temperature&timezone=Africa%2FCairo`).then((r) => r.json()),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&timezone=Africa%2FCairo`).then((r) => r.json())
    ]).then(([m, w]) => live && setSea({ water: m?.current?.sea_surface_temperature, wave: m?.current?.wave_height, wind: w?.current?.wind_speed_10m, dir: w?.current?.wind_direction_10m, air: w?.current?.temperature_2m, at: w?.current?.time }))
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, []);
  const tiles: [typeof Thermometer, string, string][] = sea ? [
    [Droplets, t("Water"), sea.water != null ? `${Math.round(sea.water)}°C` : "—"],
    [Wind, t("Wind"), sea.wind != null ? `${Math.round(sea.wind)} kn ${compass(sea.dir)}` : "—"],
    [WavesIcon, t("Waves"), sea.wave != null ? `${sea.wave.toFixed(1)} m` : "—"],
    [Thermometer, t("Air"), sea.air != null ? `${Math.round(sea.air)}°C` : "—"]
  ] : [];
  return (
    <div className="rounded-[28px] bg-navy p-5 text-white sm:p-6" data-reveal>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-lg font-black"><Navigation size={18} className="text-sun" />{t("Sea today in Dahab")}</p>
        {sea?.at && <span className="text-xs text-white/60">Open-Meteo · {sea.at.slice(11, 16)}</span>}
      </div>
      {sea ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map(([I, l, v], i) => <div key={l} className="rounded-2xl bg-white/10 p-3"><span className="flex items-center gap-1.5 text-sm text-white/70"><I size={15} />{l}</span><span className="mt-1 block font-display text-2xl font-black tabular-nums">{v}</span><span className="sr-only">{i}</span></div>)}
        </div>
      ) : <p className="text-white/70">{failed ? "Live sea conditions appear here on the live website." : "Checking the sea…"}</p>}
    </div>
  );
}

/* ---------- Google reviews (live via the google-reviews function; never invented) ---------- */
export function Reviews() {
  const { backend, settings } = useStore();
  const { t } = useI18n();
  const [data, setData] = useState<Awaited<ReturnType<NonNullable<NonNullable<typeof backend>["reviews"]>>>>(null);
  useEffect(() => { backend?.reviews?.().then(setData).catch(() => {}); }, [backend]);
  const url = data?.url || settings.googleReviewsUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Dahab Days Diving Center Dahab");
  if (!data?.reviews?.length) return (
    <a href={url} target="_blank" rel="noreferrer" className="group flex flex-wrap items-center justify-between gap-4 rounded-[28px] border-2 border-navy/10 bg-white p-6 transition hover:border-sky" data-reveal>
      <span className="flex items-center gap-3"><span className="flex text-sun">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={22} fill="currentColor" />)}</span><span className="font-display text-lg font-black">{t("What our divers say")}</span></span>
      <span className="flex items-center gap-2 font-semibold text-royal">{t("Read all reviews on Google")} <ExternalLink size={16} /></span>
    </a>
  );
  return (
    <div data-reveal>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <p className="flex items-center gap-3"><span className="font-display text-5xl font-black">{data.rating.toFixed(1)}</span><span><span className="flex text-sun">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={18} fill={i < Math.round(data.rating) ? "currentColor" : "none"} />)}</span><span className="text-sm text-ink/60">{data.count} Google reviews</span></span></p>
        <a href={url} target="_blank" rel="noreferrer" className="btn-ghost">{t("Read all reviews on Google")} <ExternalLink size={16} /></a>
      </div>
      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {data.reviews.map((r, i) => (
          <figure key={i} className="w-[300px] shrink-0 snap-start rounded-[28px] rounded-br-[90px] bg-white p-6 shadow-card">
            <span className="flex text-sun">{[0, 1, 2, 3, 4].map((k) => <Star key={k} size={16} fill={k < r.rating ? "currentColor" : "none"} />)}</span>
            <blockquote className="mt-3 line-clamp-6 text-ink/80">{r.text}</blockquote>
            <figcaption className="mt-4 font-display font-black">{r.author} <span className="text-sm font-medium text-ink/50">· {r.when}</span></figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------- Which course fits me? ---------- */
const Q = [
  { q: "Have you dived before?", a: ["Never", "Once, on holiday", "I'm certified"] },
  { q: "How much time do you have?", a: ["Half a day", "2 days", "3–4 days", "A week or more"] },
  { q: "What do you want most?", a: ["Just try it", "A licence to dive anywhere", "Explore deeper sites"] }
];
function recommend(a: number[]): string {
  const [exp, time, goal] = a;
  if (exp === 2) return goal === 2 ? (time >= 1 ? "aowd" : "bh-dive") : time >= 3 ? "pack10" : "shore";
  if (time === 0 || goal === 0) return "dsd";
  if (time === 3 && goal === 2) return "combo";
  return "owd";
}

export function Quiz({ compact = false }: { compact?: boolean }) {
  const { t, sv, money } = useI18n();
  const { services } = useStore();
  const [answers, setAnswers] = useState<number[]>([]);
  const step = answers.length;
  const pick = step >= Q.length ? services.find((s) => s.id === recommend(answers)) : null;
  return (
    <div className={`rounded-[28px] bg-white shadow-card ${compact ? "p-5" : "p-6 sm:p-8"}`}>
      <div className="mb-5 flex items-center justify-between gap-3"><RedTab>{t("Which course fits me?")}</RedTab><span className="flex gap-1">{Q.map((_, i) => <span key={i} className={i <= step - 1 ? "" : "opacity-25"}><Phase i={i} size={16} /></span>)}</span></div>
      {!pick ? (
        <div key={step} className="reveal">
          <p className="font-display text-2xl font-black leading-tight">{t(Q[step].q)}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {Q[step].a.map((x, i) => <button key={x} onClick={() => setAnswers([...answers, i])} className="flex min-h-[52px] items-center gap-3 rounded-2xl border-2 border-navy/10 px-4 text-start font-semibold transition hover:border-sky hover:bg-foam"><Phase i={i} size={16} />{t(x)}</button>)}
          </div>
        </div>
      ) : (
        <div className="reveal">
          <p className="hand text-[26px] text-ink/70">{t("Our pick for you")}</p>
          <p className="mt-1 font-display text-3xl font-black leading-tight">{sv(pick).name}</p>
          <p className="mt-2 text-ink/70">{sv(pick).short}</p>
          <p className="mt-3 font-display text-2xl font-black text-navy">{money(pick.price)}</p>
          <div className="mt-5 flex flex-wrap gap-3"><BookButton id={pick.id} label="Book this" className="btn-coral" /><button className="btn-ghost" onClick={() => setAnswers([])}>{t("Start again")}</button></div>
        </div>
      )}
    </div>
  );
}
