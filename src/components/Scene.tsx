import { useId, type ReactNode } from "react";
import type { SceneKey } from "../lib/types";

/**
 * Illustrated Dahab scenes. Every picture slot on the site shows one of these
 * until the owner uploads a real photo or video for it in Dashboard › Media.
 */
function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const Fish = ({ x, y, s = 1, c = "#ffd166", flip = false }: { x: number; y: number; s?: number; c?: string; flip?: boolean }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d="M0 0 q14 -10 30 0 q-16 10 -30 0z" fill={c} />
    <path d="M1 0 l-10 -7 v14z" fill={c} opacity=".85" />
    <circle cx="23" cy="-1.5" r="1.6" fill="#04222b" />
  </g>
);

const School = ({ seed, n, x, y, w, h, c }: { seed: number; n: number; x: number; y: number; w: number; h: number; c: string }) => {
  const r = rng(seed);
  return <g>{Array.from({ length: n }, (_, i) => <Fish key={i} x={x + r() * w} y={y + r() * h} s={0.35 + r() * 0.35} c={c} />)}</g>;
};

const Bubbles = ({ seed, x, y, n = 10 }: { seed: number; x: number; y: number; n?: number }) => {
  const r = rng(seed);
  return <g fill="none" stroke="#fff" strokeOpacity=".7">{Array.from({ length: n }, (_, i) => <circle key={i} cx={x + (r() - 0.5) * 26} cy={y - i * 22 - r() * 10} r={2 + r() * 5} />)}</g>;
};

const Rays = ({ id }: { id: string }) => (
  <g opacity=".5">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
    {[[120, 60], [260, 40], [420, 70], [560, 50], [700, 60]].map(([x, w], i) => (
      <polygon key={i} points={`${x},0 ${x + w},0 ${x + w * 2.6 - 60},600 ${x - 40},600`} fill={`url(#${id})`} />
    ))}
  </g>
);

const Diver = ({ x, y, s = 1, rot = -8, torch = false }: { x: number; y: number; s?: number; rot?: number; torch?: boolean }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {torch && <polygon points="62,8 260,-40 260,70" fill="#fff6c9" opacity=".22" />}
    <path d="M-92 4 l-34 -14 l6 14 l-6 14z M-92 12 l-30 4 l10 12 l-4 8z" fill="#063440" />
    <rect x="-96" y="-2" width="70" height="18" rx="9" fill="#0a2e38" />
    <rect x="-30" y="-12" width="78" height="30" rx="15" fill="#0b3a46" />
    <rect x="-22" y="-26" width="58" height="16" rx="8" fill="#c9d6d8" />
    <circle cx="62" cy="-4" r="15" fill="#0b3a46" />
    <rect x="62" y="-12" width="16" height="11" rx="4" fill="#7fe3dc" stroke="#063440" strokeWidth="3" />
    <path d="M30 10 q20 14 36 8" stroke="#0b3a46" strokeWidth="9" strokeLinecap="round" fill="none" />
    {torch && <rect x="58" y="12" width="12" height="7" rx="3" fill="#ffd166" />}
  </g>
);

const Coral = ({ x, y, c, s = 1, kind = 0 }: { x: number; y: number; c: string; s?: number; kind?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={c} strokeLinecap="round" fill="none">
    {kind === 0 && <path d="M0 0 v-60 m0 20 l-22 -26 m22 6 l20 -30 m-42 0 l-8 -22 m28 -8 l-6 -24 m26 4 l8 -20" strokeWidth="9" />}
    {kind === 1 && <path d="M0 0 c-50 -20 -60 -90 -30 -120 c20 -20 70 -20 80 20 c10 40 -10 80 -50 100z" fill={c} stroke="none" opacity=".9" />}
    {kind === 2 && <g stroke="none" fill={c}><ellipse cx="0" cy="-22" rx="46" ry="28" /><path d="M-40 -22 q10 -10 20 0 t20 0 t20 0 t20 0" stroke="#000" strokeOpacity=".18" strokeWidth="3" fill="none" /></g>}
    {kind === 3 && <path d="M0 0 q-6 -40 -40 -70 M0 0 q4 -50 10 -90 M0 0 q16 -36 46 -60" strokeWidth="6" />}
  </g>
);

const Floor = ({ c1, c2, d = "M0 520 q120 -40 240 -10 t260 -20 t300 10 V600 H0z" }: { c1: string; c2?: string; d?: string }) => (
  <>
    <path d={d} fill={c1} />
    {c2 && <path d="M0 560 q160 -30 330 0 t470 -10 V600 H0z" fill={c2} />}
  </>
);

const Mountains = ({ layers }: { layers: { c: string; pts: string }[] }) => <g>{layers.map((l, i) => <polygon key={i} points={l.pts} fill={l.c} />)}</g>;

const Stars = ({ seed, n = 70, h = 330 }: { seed: number; n?: number; h?: number }) => {
  const r = rng(seed);
  return <g fill="#fff">{Array.from({ length: n }, (_, i) => <circle key={i} cx={r() * 800} cy={r() * h} r={r() * 1.6 + 0.3} opacity={0.4 + r() * 0.6} />)}</g>;
};

const Sky = ({ id, top, bottom }: { id: string; top: string; bottom: string }) => (
  <>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient></defs>
    <rect width="800" height="600" fill={`url(#${id})`} />
  </>
);

function draw(k: SceneKey, id: string): ReactNode {
  switch (k) {
    case "reef": return <>
      <Sky id={id + "s"} top="#0f8fa0" bottom="#054258" /><Rays id={id + "r"} />
      <School seed={3} n={26} x={330} y={150} w={300} h={110} c="#ffd166" />
      <Floor c1="#0d6f6c" c2="#e7d3a6" />
      <Coral x={110} y={545} c="#ff6b57" s={1.3} kind={0} /><Coral x={260} y={560} c="#f9a26c" kind={1} s={0.9} />
      <Coral x={520} y={555} c="#ff8fa3" kind={2} s={1.1} /><Coral x={680} y={560} c="#ffd166" kind={3} s={1.4} />
      <Coral x={400} y={570} c="#ffb703" kind={0} s={0.8} />
      <Fish x={560} y={420} s={1.6} c="#ff6b57" /><Fish x={200} y={380} s={1.2} c="#7fe3dc" flip />
      <Bubbles seed={5} x={640} y={480} />
    </>;
    case "diver": return <>
      <Sky id={id + "s"} top="#22b8c2" bottom="#065068" /><Rays id={id + "r"} />
      <Floor c1="#e7d3a6" d="M0 540 q200 -30 400 0 t400 -10 V600 H0z" />
      <Coral x={90} y={555} c="#ff6b57" kind={0} /><Coral x={700} y={560} c="#ffd166" kind={1} s={0.7} />
      <Diver x={420} y={330} s={1.35} rot={-6} />
      <Bubbles seed={9} x={530} y={290} n={12} />
      <School seed={8} n={12} x={120} y={170} w={200} h={90} c="#fff3b0" />
    </>;
    case "classroom": return <>
      <Sky id={id + "s"} top="#7fdcd6" bottom="#1a8ea3" />
      <path d="M0 120 q100 -14 200 0 t200 0 t200 0 t200 0" stroke="#fff" strokeOpacity=".6" strokeWidth="5" fill="none" />
      <Rays id={id + "r"} />
      <Floor c1="#f1dfb7" d="M0 470 q200 -30 400 -10 t400 0 V600 H0z" />
      <Diver x={290} y={420} s={1} rot={-70} /><Diver x={520} y={410} s={1} rot={-110} />
      <Bubbles seed={12} x={330} y={330} /><Bubbles seed={13} x={480} y={320} />
      <Coral x={720} y={500} c="#ff6b57" kind={3} s={1.2} />
    </>;
    case "canyon": return <>
      <Sky id={id + "s"} top="#0b6c80" bottom="#022833" />
      <polygon points="330,0 470,0 440,600 380,600" fill="#9ff3ea" opacity=".35" />
      <polygon points="365,0 430,0 420,600 395,600" fill="#fff" opacity=".25" />
      <path d="M0 0 H360 q-40 120 10 240 q-60 120 -10 360 H0z" fill="#063a45" />
      <path d="M800 0 H450 q50 140 -10 260 q60 120 0 340 H800z" fill="#052f39" />
      <Coral x={330} y={300} c="#ff6b57" kind={3} s={0.8} /><Coral x={470} y={420} c="#ffd166" kind={0} s={0.6} />
      <Diver x={408} y={210} s={0.55} rot={80} /><Bubbles seed={2} x={400} y={150} n={7} />
    </>;
    case "bells": return <>
      <Sky id={id + "s"} top="#1993b0" bottom="#03202b" />
      <path d="M0 0 H300 q30 200 -20 600 H0z" fill="#0b4b52" />
      <path d="M300 0 q-30 300 -20 600" stroke="#ff6b57" strokeWidth="14" strokeDasharray="2 22" strokeLinecap="round" fill="none" />
      <Coral x={260} y={220} c="#ffd166" kind={3} s={0.8} /><Coral x={250} y={420} c="#ff8fa3" kind={0} s={0.7} />
      <Diver x={470} y={260} s={0.9} rot={30} /><Diver x={600} y={410} s={0.7} rot={20} />
      <Bubbles seed={21} x={520} y={200} /><School seed={4} n={16} x={560} y={80} w={200} h={90} c="#bdf6f0" />
    </>;
    case "bluehole": return <>
      <rect width="800" height="600" fill="#d9b77e" />
      <path d="M0 0 H800 V180 q-200 40 -400 20 T0 220z" fill="#b98c56" />
      <polygon points="0,0 160,0 60,120 0,140" fill="#a07344" /><polygon points="620,0 800,0 800,130 700,90" fill="#a07344" />
      <defs><radialGradient id={id + "h"} cx=".5" cy=".55" r=".55"><stop offset="0" stopColor="#021a36" /><stop offset=".55" stopColor="#063f7a" /><stop offset=".8" stopColor="#0b7fb3" /><stop offset="1" stopColor="#3fd0c9" /></radialGradient></defs>
      <path d="M0 260 q200 -60 400 -40 t400 20 V600 H0z" fill="#3fd0c9" />
      <path d="M0 330 q300 -40 800 -10 V600 H0z" fill="#1a9fc4" />
      <ellipse cx="420" cy="420" rx="210" ry="150" fill="#8fe6d9" />
      <ellipse cx="420" cy="425" rx="180" ry="128" fill={`url(#${id}h)`} />
      <path d="M560 330 q60 20 110 -10" stroke="#8fe6d9" strokeWidth="26" strokeLinecap="round" fill="none" />
      <g fill="#fff">{[[150, 250], [690, 270], [610, 300]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" />)}</g>
    </>;
    case "lagoon": return <>
      <Sky id={id + "s"} top="#bfe9f2" bottom="#f8e6c4" />
      <Mountains layers={[{ c: "#c79a6a", pts: "0,260 120,170 230,230 360,150 480,240 600,160 800,250 800,330 0,330" }, { c: "#a9784b", pts: "0,300 150,230 300,290 450,220 640,300 800,260 800,340 0,340" }]} />
      <path d="M0 330 H800 V600 H0z" fill="#1ec2c0" />
      <path d="M0 330 q300 30 520 10 q160 -10 280 20 V420 q-200 -30 -420 10 T0 400z" fill="#a8f0e6" />
      <path d="M130 360 q160 -30 330 0 q-120 40 -330 0z" fill="#f2deb4" />
      <g fill="#7a5532"><rect x="200" y="328" width="40" height="22" /><polygon points="195,330 220,312 245,330" /><rect x="270" y="332" width="34" height="18" /><polygon points="266,334 287,318 308,334" /></g>
      <path d="M560 470 q30 -8 70 0 l-10 14 h-50z" fill="#fff" /><rect x="590" y="430" width="3" height="40" fill="#fff" />
    </>;
    case "pools": return <>
      <rect width="800" height="600" fill="#2bc3c6" />
      <path d="M0 0 H800 V140 q-200 30 -400 0 T0 150z" fill="#d9b77e" />
      {[[180, 330, 120, 80], [400, 380, 140, 90], [630, 320, 110, 76]].map(([cx, cy, rx, ry], i) => (
        <g key={i}><ellipse cx={cx} cy={cy} rx={rx + 26} ry={ry + 22} fill="#0e8a86" /><ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#bff7ee" /><ellipse cx={cx - 14} cy={cy - 8} rx={rx * 0.55} ry={ry * 0.45} fill="#e9fbf6" /></g>
      ))}
      <g fill="#ffb703">{[[200, 330], [420, 370], [610, 330]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" />)}</g>
      <path d="M0 520 q200 -20 400 0 t400 -10" stroke="#fff" strokeOpacity=".35" strokeWidth="6" fill="none" />
    </>;
    case "tawilat": return <>
      <Sky id={id + "s"} top="#0a0f2c" bottom="#3a2752" /><Stars seed={7} n={110} h={360} />
      <circle cx="640" cy="110" r="34" fill="#f8f1d6" /><circle cx="652" cy="102" r="30" fill="#151a3a" />
      <Mountains layers={[{ c: "#2a1f3d", pts: "0,420 90,260 170,330 260,200 330,300 330,600 0,600" }, { c: "#2a1f3d", pts: "470,600 470,280 540,190 620,300 700,230 800,330 800,600" }, { c: "#1a1428", pts: "0,600 0,470 200,420 400,480 600,430 800,470 800,600" }]} />
      <path d="M318 300 Q400 360 482 282" stroke="#c9a46b" strokeWidth="3" fill="none" />
      <path d="M318 290 Q400 344 482 272" stroke="#c9a46b" strokeWidth="2" fill="none" />
      <g stroke="#c9a46b" strokeWidth="2">{Array.from({ length: 12 }, (_, i) => { const t = (i + 1) / 13; const x = 318 + 164 * t; const y = 300 + 4 * 60 * t * (1 - t) - 18 * t; return <line key={i} x1={x} y1={y - 10} x2={x} y2={y} />; })}</g>
      <defs><radialGradient id={id + "f"}><stop offset="0" stopColor="#ffb347" stopOpacity=".9" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient></defs>
      <circle cx="210" cy="520" r="90" fill={`url(#${id}f)`} /><path d="M196 528 q14 -40 14 -40 q6 24 18 40z" fill="#ffd166" />
    </>;
    case "ghazala": return <>
      <Sky id={id + "s"} top="#f7a072" bottom="#ffe0a3" />
      <circle cx="420" cy="300" r="70" fill="#fff1c9" />
      <path d="M0 0 H240 q-40 200 20 330 q-80 140 -30 270 H0z" fill="#b5653a" /><path d="M800 0 H580 q50 180 -10 320 q70 140 20 280 H800z" fill="#a4552f" />
      <path d="M0 470 q200 -60 420 -30 t380 -10 V600 H0z" fill="#e6b06e" /><path d="M0 530 q260 -30 520 0 t280 -10 V600 H0z" fill="#d49655" />
      <g fill="#5a2f1c" transform="translate(470 420) scale(1.1)"><path d="M0 0 q20 -8 44 -2 l8 -16 l3 0 l-4 18 q4 6 0 12 l-2 22 h-3 l1 -20 h-30 l-4 20 h-3 l1 -22 q-12 -4 -11 -12z" /><path d="M48 -18 q-2 -14 4 -22 M52 -18 q4 -14 10 -18" stroke="#5a2f1c" strokeWidth="2" fill="none" /></g>
    </>;
    case "wadi": return <>
      <Sky id={id + "s"} top="#ffcf8a" bottom="#f59a5b" />
      <path d="M0 0 H330 q-30 140 30 280 q-70 160 -10 320 H0z" fill="#b24a3a" />
      <path d="M0 0 H280 q-20 160 30 300 q-60 150 -10 300 H0z" fill="#d97b4f" opacity=".8" />
      <path d="M0 0 H220 q-10 160 20 310 q-40 140 0 290 H0z" fill="#8c3b4f" opacity=".7" />
      <path d="M800 0 H470 q40 150 -20 290 q60 150 10 310 H800z" fill="#a63f3a" />
      <path d="M800 0 H530 q30 160 -10 300 q40 150 10 300 H800z" fill="#e0955a" opacity=".8" />
      <path d="M340 600 q30 -120 60 -220 q30 100 60 220z" fill="#f3d09a" />
      <g fill="#3b1d1a"><circle cx="400" cy="430" r="7" /><rect x="395" y="437" width="10" height="26" rx="4" /></g>
    </>;
    case "sinai": return <>
      <Sky id={id + "s"} top="#2b2d64" bottom="#ff9a76" />
      <circle cx="430" cy="380" r="80" fill="#ffd27a" />
      <Mountains layers={[{ c: "#7a3e55", pts: "0,400 140,300 260,360 420,240 560,350 700,280 800,340 800,600 0,600" }, { c: "#4f2945", pts: "0,470 160,390 340,450 520,380 680,460 800,420 800,600 0,600" }, { c: "#2d1834", pts: "0,600 0,530 240,480 460,540 640,500 800,540 800,600" }]} />
      <path d="M380 470 l20 -40 l12 10 l18 -46" stroke="#ffd27a" strokeWidth="3" strokeDasharray="2 8" fill="none" />
    </>;
    case "night": return <>
      <rect width="800" height="600" fill="#021820" />
      <Diver x={240} y={300} s={1.1} rot={4} torch />
      <Coral x={600} y={560} c="#ff6b57" kind={1} s={1} /><Coral x={720} y={560} c="#ffd166" kind={3} s={1.1} />
      <Fish x={600} y={300} s={1.2} c="#bdf6f0" /><Bubbles seed={31} x={300} y={260} />
    </>;
    case "turtle": return <>
      <Sky id={id + "s"} top="#1fb5ac" bottom="#064a5c" /><Rays id={id + "r"} />
      <g transform="translate(400 300) rotate(-10)">
        <path d="M-60 -10 q-70 -50 -100 -20 q40 10 70 40z" fill="#6c8a4a" /><path d="M50 -10 q60 -60 100 -40 q-30 20 -70 60z" fill="#6c8a4a" />
        <path d="M-50 30 q-50 30 -60 70 q40 -10 70 -50z" fill="#6c8a4a" /><path d="M40 30 q40 30 40 70 q-30 -10 -55 -55z" fill="#6c8a4a" />
        <ellipse cx="0" cy="10" rx="80" ry="58" fill="#7b5a34" /><ellipse cx="0" cy="8" rx="64" ry="44" fill="#a37a46" />
        <path d="M-40 8 h80 M0 -32 v80 M-28 -22 l56 60 M28 -22 l-56 60" stroke="#7b5a34" strokeWidth="3" />
        <ellipse cx="102" cy="-2" rx="26" ry="18" fill="#6c8a4a" /><circle cx="112" cy="-8" r="3" fill="#1a1a1a" />
      </g>
      <Floor c1="#e7d3a6" d="M0 560 q200 -20 400 0 t400 -6 V600 H0z" /><Coral x={110} y={570} c="#ff8fa3" kind={0} s={0.8} />
      <Bubbles seed={41} x={530} y={240} n={6} />
    </>;
    case "gear": return <>
      <rect width="800" height="600" fill="#f3e9d6" />
      <circle cx="610" cy="140" r="200" fill="#1fb5ac" opacity=".18" />
      <g transform="translate(150 140)"><rect width="90" height="300" rx="45" fill="#ffd166" /><rect x="22" y="-28" width="46" height="36" rx="8" fill="#5b6b70" /><rect y="60" width="90" height="20" fill="#06485a" /></g>
      <g transform="translate(300 150)"><path d="M0 40 q0 -40 50 -40 h80 q50 0 50 40 v190 q0 40 -50 40 h-80 q-50 0 -50 -40z" fill="#06485a" /><rect x="20" y="60" width="140" height="18" rx="9" fill="#1fb5ac" /><rect x="20" y="150" width="140" height="18" rx="9" fill="#1fb5ac" /></g>
      <g transform="translate(520 360)"><rect width="150" height="70" rx="30" fill="#04222b" /><rect x="14" y="12" width="56" height="46" rx="16" fill="#7fe3dc" /><rect x="80" y="12" width="56" height="46" rx="16" fill="#7fe3dc" /></g>
      <g transform="translate(540 150) rotate(20)" fill="#ff6b57"><path d="M0 0 h50 l20 160 q-45 20 -90 0z" /><path d="M70 10 h50 l20 160 q-45 20 -90 0z" opacity=".85" /></g>
      <circle cx="250" cy="500" r="40" fill="#04222b" /><circle cx="250" cy="500" r="28" fill="#e7f6f4" /><path d="M250 500 l14 -14" stroke="#ff6b57" strokeWidth="4" />
    </>;
  }
}

export default function Scene({ k, className = "", animate = false, label }: { k: SceneKey; className?: string; animate?: boolean; label?: string }) {
  const id = "s" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${className}`} role="img" aria-label={label || k}>
      <g className={animate ? "kenburns" : ""} style={{ transformOrigin: "50% 50%" }}>{draw(k, id)}</g>
    </svg>
  );
}
