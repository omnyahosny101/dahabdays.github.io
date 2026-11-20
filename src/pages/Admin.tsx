import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BarChart3, CalendarDays, Check, Download, FileSignature, Image as ImageIcon, LogOut, Plus, Search, Settings as Cog, Tag, Trash2, Upload, Wallet } from "lucide-react";
import { SignaturePad } from "../components/ConsentForm";
import { Empty, Logo, Sheet, Visual } from "../components/ui";
import { ACKNOWLEDGEMENTS, CATEGORY_LABEL, MEDICAL_QUESTIONS } from "../lib/catalog";
import { consentPdf, pdfName } from "../lib/pdf";
import { balanceDue, bookingRef, egpA as egp, hideMoney, normPhone, paidAmount, today, uid, useStore } from "../lib/store";
import { ShowcaseCard } from "./Showcase";
import { CashTab, CustomersTab, InventoryTab, PromosTab, RosterTab, ScheduleTab, TeamTab, BlogTab, exportFinanceXlsx, exportFinancePdf, waLink } from "./AdminOps";
import { Mail, Phone, Users, ClipboardList, Package, Percent, Newspaper, Banknote, UserCog, CalendarRange, MessageCircle, Undo2, FileSpreadsheet, FileDown } from "lucide-react";
import type { Booking, Category, Consent, Expense, MediaItem, MediaRole, SceneKey, Service } from "../lib/types";

/* Categorical palette — fixed order, validated for colour-blind separation */
const CAT_COLOR: Record<Category, string> = { course: "#2a78d6", tour: "#eb6834", fun: "#1baf7a", rental: "#eda100", addon: "#e87ba4" };
const CAT_ORDER: Category[] = ["course", "tour", "fun", "rental", "addon"];
const EXP_CATS = ["Staff & instructors", "Boat & transport", "Equipment & maintenance", "Tank fills & gas", "Park & entry fees", "Rent & utilities", "Marketing & ads", "Food & drinks", "Certification fees", "Other"];
const SCENES: SceneKey[] = ["reef", "bluehole", "bells", "canyon", "diver", "classroom", "turtle", "night", "pools", "lagoon", "tawilat", "ghazala", "wadi", "sinai", "gear"];

const monthKey = (d: string) => d.slice(0, 7);
const monthLabel = (k: string) => new Date(k + "-01T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
const isRevenue = (b: Booking) => paidAmount(b) > 0;
const short = (n: number) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + "M" : Math.abs(n) >= 1e3 ? Math.round(n / 1e3) + "k" : String(Math.round(n)));

type Tab = "overview" | "bookings" | "schedule" | "roster" | "customers" | "consents" | "finance" | "cash" | "team" | "inventory" | "promos" | "blog" | "services" | "media" | "settings";
const TABS: [Tab, string, typeof BarChart3][] = [["overview", "Overview", BarChart3], ["bookings", "Bookings", CalendarDays], ["schedule", "Schedule", CalendarRange], ["roster", "Daily roster", ClipboardList], ["customers", "Customers", Users], ["consents", "Consent forms", FileSignature], ["finance", "Finance", Wallet], ["cash", "Cash close", Banknote], ["team", "Team and roles", UserCog], ["inventory", "Equipment", Package], ["promos", "Promo codes", Percent], ["blog", "Blog", Newspaper], ["services", "Services and prices", Tag], ["media", "Media", ImageIcon], ["settings", "Settings", Cog]];

export default function Admin() {
  const { isAdmin, setUser, user, settings, backend, can, staff, roles, ready } = useStore();
  const allowed = TABS.map((x) => x[0]).filter((t) => can(t));
  const [tab, setTabS] = useState<Tab>("overview");
  const cur = allowed.includes(tab) ? tab : allowed[0];
  const setTab = (t: Tab) => setTabS(allowed.includes(t) ? t : allowed[0]);
  hideMoney(isAdmin && !can("seeMoney"));
  useEffect(() => () => hideMoney(false), []);
  // Access changes apply straight away: switched-off or removed people are signed out, role changes take effect live
  useEffect(() => {
    if (!user || !ready || user.role === "owner") return;
    const s = staff.find((x) => x.id === user.id);
    if (!s || !s.active) setUser(null);
    else if (s.role !== user.role || s.name !== user.name) setUser({ ...user, role: s.role, name: s.name });
  }, [user, staff, ready]);
  useEffect(() => { if (user && backend?.mode === "supabase" && backend.identity) backend.identity().then((id) => { if (!id) setUser(null); }); }, [backend]);
  const signOut = () => { setUser(null); if (backend?.mode === "supabase") backend.signOut?.(); };
  if (!isAdmin) return <Login />;
  const roleName = roles.find((r) => r.id === user?.role)?.name || user?.role;
  return (
    <div className="min-h-screen bg-[#f4f7f7] pt-[68px]">
      <div className="wrap grid gap-4 py-4 sm:gap-6 sm:py-6 lg:grid-cols-[230px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-2 flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-sm shadow-card lg:hidden"><span className="min-w-0 truncate"><b>{user?.name}</b> · {roleName}</span><button onClick={signOut} className="flex shrink-0 items-center gap-1 font-semibold text-ink/60"><LogOut size={16} />Sign out</button></div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-card lg:flex-col">
            {TABS.filter(([t]) => allowed.includes(t)).map(([t, l, I]) => <button key={t} onClick={() => setTab(t)} className={`flex min-h-[44px] shrink-0 items-center gap-3 rounded-xl px-3 text-start font-medium ${cur === t ? "bg-navy text-white" : "hover:bg-foam"}`}><I size={18} />{l}</button>)}
            <button onClick={signOut} className="hidden min-h-[44px] shrink-0 items-center gap-3 rounded-xl px-3 text-ink/60 hover:bg-foam lg:flex"><LogOut size={18} />Sign out</button>
          </nav>
          <p className="mt-3 hidden px-2 text-xs text-ink/50 lg:block">Signed in as <b>{user?.name}</b> ({roleName}){user?.via ? ` with ${user.via}` : ""} · Data: {backend?.mode === "supabase" ? "Supabase (live)" : backend?.mode === "artifact" ? "Preview database" : "This browser (demo)"} · {settings.centerName}</p>
        </aside>
        <main className="min-w-0">
          {!cur && <Card title="No pages yet"><p className="text-ink/70">Your role doesn't include any dashboard pages yet. Ask the owner to update it in Team and roles.</p></Card>}
          {cur === "overview" && <Overview go={setTab} />}
          {cur === "bookings" && <Bookings />}
          {cur === "schedule" && <ScheduleTab />}
          {cur === "roster" && <RosterTab />}
          {cur === "customers" && <CustomersTab />}
          {cur === "consents" && <Consents />}
          {cur === "cash" && <CashTab />}
          {cur === "team" && <TeamTab />}
          {cur === "inventory" && <InventoryTab />}
          {cur === "promos" && <PromosTab />}
          {cur === "blog" && <BlogTab />}
          {cur === "finance" && <Finance />}
          {cur === "services" && <Services />}
          {cur === "media" && <Media />}
          {cur === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

/* ---------- Sign in: phone + SMS code, or Google (Gmail) ---------- */
function Login() {
  const { settings, setUser, backend, reload, staff, roles } = useStore();
  const live = backend?.mode === "supabase";
  const [how, setHow] = useState<"phone" | "google" | "pin">("phone");
  const [phone, setPhone] = useState(""); const [code, setCode] = useState(""); const [step, setStep] = useState<"enter" | "code">("enter");
  const [demoCode, setDemoCode] = useState(""); const [gmail, setGmail] = useState(""); const [who, setWho] = useState("owner"); const [pin, setPin] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const owner = { id: "owner", name: "Owner", role: "owner" };

  /** Who is this phone/email? The owner, an active team member, or nobody */
  const grant = async (id: { phone?: string; email?: string }, via: string) => {
    if (live && backend?.access) { // the database decides, so a stale list can't let anyone in
      const a = await backend.access();
      if (!a) { await backend.signOut?.(); return setErr(`${id.phone || id.email} doesn't have dashboard access. Ask the owner to add you in Team and roles.`); }
      await reload(); return setUser({ id: a.staffId, name: a.name || "Owner", role: a.role, via });
    }
    const ph = normPhone(id.phone), em = (id.email || "").trim().toLowerCase();
    if ((ph && ph === normPhone(settings.ownerPhone)) || (em && em === (settings.ownerEmail || "").toLowerCase())) return setUser({ ...owner, via });
    const s = staff.find((x) => (ph && normPhone(x.phone) === ph) || (em && (x.email || "").toLowerCase() === em));
    if (!s) return setErr(`${id.phone || id.email} doesn't have dashboard access. Ask the owner to add you in Team and roles.`);
    if (!s.active) return setErr("This account is switched off. Ask the owner to switch it back on.");
    if (!roles.some((r) => r.id === s.role)) return setErr("Your role was removed. Ask the owner to give you a new one.");
    setUser({ id: s.id, name: s.name, role: s.role, via });
  };

  const sendCode = async () => {
    setErr(""); if (normPhone(phone).length < 10) return setErr("Enter your mobile number with the country code, e.g. +20 100 051 5039.");
    setBusy(true);
    try {
      if (live && backend?.phoneCode) await backend.phoneCode("+" + normPhone(phone));
      else setDemoCode(String(Math.floor(100000 + Math.random() * 900000)));
      setStep("code"); setCode("");
    } catch (e: any) { setErr(e?.message || "Couldn't send the code."); }
    setBusy(false);
  };
  const verify = async () => {
    setErr(""); if (code.length < 6) return setErr("Enter the 6-digit code.");
    setBusy(true);
    try {
      if (live && backend?.verifyPhone) await backend.verifyPhone("+" + normPhone(phone), code);
      else if (code !== demoCode) { setBusy(false); return setErr("That code isn't right. Check the SMS and try again."); }
      await grant({ phone }, "phone");
    } catch (e: any) { setErr(e?.message || "That code isn't right."); }
    setBusy(false);
  };
  const google = async () => {
    setErr("");
    if (live && backend?.google) { try { await backend.google(); } catch (e: any) { setErr(e?.message || "Google sign-in failed."); } return; }
    if (!/^\S+@(gmail|googlemail)\.com$/i.test(gmail.trim()) && !/^\S+@\S+\.\S+$/.test(gmail.trim())) return setErr("Enter your Gmail address.");
    grant({ email: gmail }, "Google");
  };
  // Back from Google (live): Supabase has a session, so match the account
  useEffect(() => { if (live && backend?.identity) backend.identity().then((id) => { if (id) grant(id, id.phone ? "phone" : "Google"); }); }, [live]);
  const pinIn = () => {
    if (who === "owner") return pin === settings.adminPin ? setUser({ ...owner, via: "PIN" }) : setErr("Wrong PIN.");
    const s = staff.find((x) => x.id === who); if (s && s.active && s.pin === pin) return setUser({ id: s.id, name: s.name, role: s.role, via: "PIN" }); setErr("Wrong PIN.");
  };

  const tabBtn = (k: typeof how, l: string, I: typeof Phone) => <button type="button" onClick={() => { setHow(k); setErr(""); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold ${how === k ? "bg-white text-navy shadow" : "text-ink/60"}`}><I size={16} />{l}</button>;
  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4 pb-10 pt-[88px]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-card sm:p-8">
        <Logo /><h1 className="mt-6 text-2xl font-black">Staff dashboard</h1>
        <p className="mt-1 text-ink/60">Sign in with your phone number or Gmail. You stay signed in on this device until you sign out.</p>
        <div className="mt-5 flex gap-1 rounded-2xl bg-foam p-1">{tabBtn("phone", "Phone", Phone)}{tabBtn("google", "Gmail", Mail)}</div>

        {how === "phone" && (step === "enter" ? <form className="mt-5" onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
          <label className="block"><span className="label">Mobile number</span><input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+20 100 051 5039" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus /></label>
          <button className="btn-sea mt-4 w-full" disabled={busy}>{busy ? "Sending…" : "Send me a code"}</button>
        </form> : <form className="mt-5" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <p className="text-sm text-ink/70">We sent a 6-digit code by SMS to <b dir="ltr">{phone}</b>. <button type="button" className="font-semibold text-royal" onClick={() => { setStep("enter"); setErr(""); }}>Change</button></p>
          {!live && <p className="mt-3 rounded-2xl border-2 border-dashed border-sky/50 bg-foam p-3 text-sm">Preview only, no real SMS is sent here. Your code is <b className="tracking-[.2em]">{demoCode}</b></p>}
          <label className="mt-3 block"><span className="label">Code</span><input className="input text-center text-2xl font-black tracking-[.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus /></label>
          <button className="btn-sea mt-4 w-full" disabled={busy}>{busy ? "Checking…" : "Verify and sign in"}</button>
          <button type="button" className="mt-2 w-full text-sm font-semibold text-ink/60" onClick={sendCode}>Send a new code</button>
        </form>)}

        {how === "google" && <div className="mt-5">
          {!live && <label className="block"><span className="label">Gmail address</span><input className="input" type="email" autoComplete="email" placeholder="name@gmail.com" value={gmail} onChange={(e) => setGmail(e.target.value)} /></label>}
          <button className="btn mt-4 w-full border border-ink/15 bg-white font-bold text-ink hover:bg-foam" onClick={google}><GoogleG /> Continue with Google</button>
          {!live && <p className="mt-2 text-xs text-ink/50">Preview: Google isn't connected here, so type the Gmail the owner added. On the live site this opens Google's own sign-in.</p>}
        </div>}

        {how === "pin" && <form className="mt-5" onSubmit={(e) => { e.preventDefault(); pinIn(); }}>
          <label className="block"><span className="label">Who's signing in?</span><select className="input" value={who} onChange={(e) => setWho(e.target.value)}><option value="owner">Owner</option>{staff.filter((s) => s.active && s.pin).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="mt-3 block"><span className="label">PIN</span><input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></label>
          <button className="btn-sea mt-4 w-full">Sign in</button>
        </form>}

        {err && <p className="mt-3 text-red">{err}</p>}
        {!live && <div className="mt-5 rounded-2xl bg-sand p-3 text-sm text-ink/75">
          <b>Try it:</b> the owner's number is <button className="font-semibold text-royal" dir="ltr" onClick={() => { setHow("phone"); setStep("enter"); setPhone(settings.ownerPhone || ""); }}>{settings.ownerPhone}</button>. After loading the showcase you can also sign in as <button className="font-semibold text-royal" onClick={() => { setHow("google"); setGmail("mohamed.attar.test@gmail.com"); }}>Mohamed Attar (front desk)</button>.
          {how !== "pin" && <button className="mt-2 block text-xs font-semibold text-ink/50 underline" onClick={() => { setHow("pin"); setErr(""); }}>Use a PIN instead (preview only)</button>}
          {how === "pin" && <p className="mt-1 text-xs text-ink/50">Owner PIN: {settings.adminPin === "dahab" ? "dahab" : "set in Settings"}</p>}
        </div>}
      </div>
    </div>
  );
}
const GoogleG = () => <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" /><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" /></svg>;

/* ---------- shared bits ---------- */
const Card = ({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-3xl bg-white p-5 shadow-card sm:p-6">{(title || action) && <div className="mb-4 flex flex-wrap items-center justify-between gap-3">{title && <h2 className="text-lg font-bold">{title}</h2>}{action}</div>}{children}</section>
);
const Kpi = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) => (
  <div className="rounded-3xl bg-white p-5 shadow-card"><p className="text-sm text-ink/60">{label}</p><p className="price mt-1 text-[clamp(22px,3vw,30px)] font-extrabold">{value}</p>{sub && <p className={`text-sm ${tone === "bad" ? "text-coral" : tone === "good" ? "text-[#0b7a52]" : "text-ink/55"}`}>{sub}</p>}</div>
);
const PageTitle = ({ t, s }: { t: string; s?: string }) => <div className="mb-5"><h1 className="text-[28px] font-extrabold leading-tight">{t}</h1>{s && <p className="text-ink/60">{s}</p>}</div>;
const ChartTip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="rounded-xl border bg-white p-3 text-sm shadow-card"><p className="mb-1 font-semibold">{label}</p>{payload.filter((p: any) => p.value).map((p: any) => <p key={p.dataKey} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />{p.name}</span><span className="price font-semibold">{egp(p.value)}</span></p>)}</div>
) : null;

/* ---------- finance model ---------- */
function useFinance(monthsBack: number) {
  const { bookings, expenses, services } = useStore();
  return useMemo(() => {
    const now = new Date(); const months: string[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
    const rows = months.map((m) => {
      const bs = bookings.filter((b) => monthKey(b.date) === m && isRevenue(b));
      const ex = expenses.filter((e) => monthKey(e.date) === m);
      const byCat = Object.fromEntries(CAT_ORDER.map((c) => [c, bs.filter((b) => b.category === c).reduce((a, b) => a + paidAmount(b), 0)])) as Record<Category, number>;
      const bySvc: Record<string, number> = {};
      bs.forEach((b) => { bySvc[b.serviceName] = (bySvc[b.serviceName] || 0) + paidAmount(b); });
      const top = Object.entries(bySvc).sort((a, b) => b[1] - a[1])[0];
      const revenue = bs.reduce((a, b) => a + paidAmount(b), 0);
      const fees = bs.reduce((a, b) => a + (b.payment.fee || 0), 0);
      const expense = ex.reduce((a, e) => a + e.amount, 0);
      return { m, label: monthLabel(m), revenue, fees, expense, costs: expense + fees, net: revenue - fees - expense, count: bs.length, ...byCat, top: top?.[0] || "—", topValue: top?.[1] || 0 };
    });
    const inRange = (d: string) => months.includes(monthKey(d));
    const perService = services.map((s) => {
      const bs = bookings.filter((b) => b.serviceId === s.id && isRevenue(b) && inRange(b.date));
      const rev = bs.reduce((a, b) => a + paidAmount(b), 0), fee = bs.reduce((a, b) => a + (b.payment.fee || 0), 0);
      const cost = expenses.filter((e) => e.serviceId === s.id && inRange(e.date)).reduce((a, e) => a + e.amount, 0);
      return { s, count: bs.length, people: bs.reduce((a, b) => a + b.people, 0), rev, net: rev - fee - cost, cost: cost + fee };
    }).filter((x) => x.rev || x.cost).sort((a, b) => b.rev - a.rev);
    const byExpCat = EXP_CATS.map((c) => ({ c, v: expenses.filter((e) => e.category === c && inRange(e.date)).reduce((a, e) => a + e.amount, 0) })).filter((x) => x.v).sort((a, b) => b.v - a.v);
    const tot = rows.reduce((a, r) => ({ revenue: a.revenue + r.revenue, costs: a.costs + r.costs, net: a.net + r.net, count: a.count + r.count }), { revenue: 0, costs: 0, net: 0, count: 0 });
    return { rows, perService, byExpCat, tot };
  }, [bookings, expenses, services, monthsBack]);
}

function CategoryBars({ rows }: { rows: any[] }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#e6ebeb" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: "#52514e" }} />
          <YAxis tickFormatter={short} tickLine={false} axisLine={false} width={44} tick={{ fontSize: 13, fill: "#52514e" }} />
          <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(6,72,90,.06)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 13 }} />
          {CAT_ORDER.map((c, i) => <Bar key={c} dataKey={c} name={CATEGORY_LABEL[c]} stackId="a" fill={CAT_COLOR[c]} stroke="#fff" strokeWidth={2} radius={i === CAT_ORDER.length - 1 ? [4, 4, 0, 0] : 0} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- Overview ---------- */
function Overview({ go }: { go: (t: Tab) => void }) {
  const { bookings, consents } = useStore();
  const f = useFinance(6);
  const cur = f.rows[f.rows.length - 1], prev = f.rows[f.rows.length - 2];
  const delta = (a: number, b: number) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / Math.abs(b)) * 100)}% vs last month` : "First month of data");
  const upcoming = bookings.filter((b) => b.date >= today() && b.status !== "cancelled").sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)).slice(0, 6);
  const flagged = consents.filter((c) => c.needsClearance);
  const unsigned = consents.filter((c) => !c.countersignedAt);
  return (
    <div className="space-y-6">
      <ShowcaseCard openTab={go} />
      <PageTitle t={cur.top !== "—" ? `${cur.top} leads ${cur.label}` : "Welcome back"} s={cur.top !== "—" ? `${egp(cur.topValue)} of ${egp(cur.revenue)} revenue this month` : "Load sample data in Finance to explore the dashboard, or wait for your first bookings."} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Revenue this month" value={egp(cur.revenue)} sub={delta(cur.revenue, prev.revenue)} tone={cur.revenue >= prev.revenue ? "good" : "bad"} />
        <Kpi label="Net income this month" value={egp(cur.net)} sub={`after ${egp(cur.costs)} costs`} tone={cur.net >= 0 ? "good" : "bad"} />
        <Kpi label="Paid bookings" value={String(cur.count)} sub={cur.count ? `avg ${egp(cur.revenue / cur.count)}` : "—"} />
        <Kpi label="Forms to check" value={String(flagged.length + unsigned.length)} sub={`${flagged.length} need a doctor's note`} tone={flagged.length ? "bad" : undefined} />
      </div>
      <Card title="Revenue by category, last 6 months" action={<button className="btn-ghost text-sm" onClick={() => go("finance")}>Full analysis</button>}>{f.tot.revenue ? <CategoryBars rows={f.rows} /> : <Empty>No paid bookings yet. Revenue appears here as soon as guests pay.</Empty>}</Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Coming up" action={<button className="btn-ghost text-sm" onClick={() => go("bookings")}>All bookings</button>}>
          {upcoming.length ? <ul className="divide-y">{upcoming.map((b) => <li key={b.id} className="flex items-center justify-between gap-3 py-3"><span><span className="block font-semibold">{b.customer.name} · {b.people}p</span><span className="text-sm text-ink/60">{b.serviceName}</span></span><span className="text-right text-sm"><span className="block font-semibold">{b.date}</span><span className="text-ink/60">{b.time}</span></span></li>)}</ul> : <Empty>No upcoming bookings.</Empty>}
        </Card>
        <Card title="Medical flags" action={<button className="btn-ghost text-sm" onClick={() => go("consents")}>All forms</button>}>
          {flagged.length ? <ul className="divide-y">{flagged.slice(0, 6).map((c) => <li key={c.id} className="flex items-center gap-3 py-3"><AlertTriangle size={18} className="shrink-0 text-coral" /><span className="flex-1"><span className="block font-semibold">{c.fullName}</span><span className="text-sm text-ink/60">{MEDICAL_QUESTIONS.filter((q) => c.answers[q.id] === "yes").map((q) => q.id).join(", ")}</span></span><span className="text-sm text-ink/60">{c.arrival}</span></li>)}</ul> : <Empty>No one has declared a medical condition.</Empty>}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Bookings ---------- */
const payChip = (b: Booking) => b.payment.status === "paid" ? ["Paid", "bg-[#1baf7a]/15 text-[#0b6b49]"] : b.payment.status === "deposit" ? ["Deposit", "bg-sky/15 text-navy"] : b.payment.status === "refunded" ? ["Refunded", "bg-ink/10"] : ["Unpaid", "bg-sand text-ink"];
const isAbandoned = (b: Booking) => b.payment.method === "paymob" && (b.payment.amountPaid || 0) === 0 && b.payment.status === "unpaid" && b.status === "pending" && Date.now() - new Date(b.createdAt).getTime() > 3600_000;

function Bookings() {
  const { bookings, services, consents, put, remove, settings, staff, backend, can } = useStore();
  const [q, setQ] = useState(""); const [st, setSt] = useState("all"); const [adding, setAdding] = useState(false);
  const [refund, setRefund] = useState<Booking | null>(null); const [rAmt, setRAmt] = useState(0); const [rWhy, setRWhy] = useState(""); const [rErr, setRErr] = useState("");
  const list = bookings.filter((b) => (st === "all" || b.status === st || (st === "unpaid" && balanceDue(b) > 0) || (st === "abandoned" && isAbandoned(b))) && (q === "" || `${b.ref} ${b.customer.name} ${b.customer.email} ${b.serviceName}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => (a.date < b.date ? 1 : -1));
  const takeBalance = (b: Booking) => { const due = balanceDue(b); return put("bookings", { ...b, payment: { ...b.payment, status: "paid", paidAt: new Date().toISOString(), amountPaid: (b.payment.amountPaid ?? 0) + due, history: [...(b.payment.history || []), { at: new Date().toISOString(), amount: due, method: "cash" }] } }); };
  const doRefund = async () => {
    if (!refund) return; setRErr("");
    const max = paidAmount(refund); if (rAmt <= 0 || rAmt > max) return setRErr(`Enter an amount up to ${egp(max)}.`);
    try {
      if (refund.payment.method === "paymob" && refund.payment.txnId && backend?.refund) await backend.refund(refund.id, rAmt);
      const refunded = (refund.payment.refunded || 0) + rAmt;
      await put("bookings", { ...refund, status: "cancelled", cancelledBy: refund.cancelledBy || "staff", payment: { ...refund.payment, refunded, refundReason: rWhy, status: refunded >= (refund.payment.amountPaid ?? refund.total) ? "refunded" : refund.payment.status, history: [...(refund.payment.history || []), { at: new Date().toISOString(), amount: -rAmt, method: refund.payment.method === "paymob" ? "paymob" : "cash", note: "refund: " + rWhy }] } });
      setRefund(null);
    } catch (e: any) { setRErr("Refund failed: " + (e?.message || e)); }
  };
  const abandoned = bookings.filter(isAbandoned).length;
  const acts = (b: Booking, due: number) => <><a className="btn px-2.5 text-[#0b7a52] hover:bg-[#1baf7a]/10" title="WhatsApp guest" aria-label="WhatsApp guest" target="_blank" rel="noreferrer" href={waLink(b.customer.phone, isAbandoned(b) ? `Hi ${b.customer.name.split(" ")[0]}! You started booking ${b.serviceName} on ${b.date} with Dahab Days but the payment didn't go through. Want us to hold your spot? Reply here and we'll help.` : `Hi ${b.customer.name.split(" ")[0]}! Your Dahab Days booking ${b.ref} is confirmed: ${b.serviceName} on ${b.date} at ${b.time}. Meet us at the center 15 minutes early. ${due > 0 ? `Balance on arrival: ${egp(due)}. ` : ""}See you soon!`)} onClick={() => isAbandoned(b) && put("bookings", { ...b, followedUp: new Date().toISOString() })}><MessageCircle size={16} /></a>
                {due > 0 && b.status !== "cancelled" && <button className="btn px-2.5 text-sm text-navy hover:bg-foam" onClick={() => takeBalance(b)} title="Record cash/terminal payment"><Check size={16} /> {b.payment.status === "deposit" ? "Balance" : "Paid"}</button>}
                {paidAmount(b) > 0 && can("refunds") && <button className="btn px-2.5 text-sm text-ink/60 hover:bg-red/5 hover:text-red" onClick={() => { setRefund(b); setRAmt(paidAmount(b)); setRWhy(""); setRErr(""); }} title="Refund"><Undo2 size={16} /></button>}
                {can("delete") && <button className="btn px-2.5 text-ink/40 hover:bg-red/10 hover:text-red" aria-label="Delete booking" onClick={() => remove("bookings", b.id)}><Trash2 size={16} /></button>}</>;
  return (
    <div className="space-y-5">
      <PageTitle t="Bookings" s={`${bookings.length} total · ${bookings.filter((b) => balanceDue(b) > 0 && b.status !== "cancelled").length} with money due · ${abandoned} abandoned checkouts`} />
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-[220px] flex-1"><Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-ink/40" /><input className="input ps-11" placeholder="Search name, ref, program" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select className="input w-auto" value={st} onChange={(e) => setSt(e.target.value)}>{[["all", "All"], ["pending", "Pending"], ["confirmed", "Confirmed"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["unpaid", "Money due"], ["abandoned", `Abandoned (${abandoned})`]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button className="btn-sea" onClick={() => setAdding(true)}><Plus size={18} /> Walk-in booking</button>
      </div>
      <div className="hidden overflow-hidden rounded-3xl bg-white shadow-card md:block">
        {list.length ? <div className="overflow-x-auto"><table className="w-full text-start text-[15px]">
          <thead className="bg-foam text-sm text-ink/60"><tr><th className="p-3 text-start">Date</th><th className="p-3 text-start">Guest</th><th className="p-3 text-start">Program</th><th className="p-3 text-end">Total</th><th className="p-3 text-start">Payment</th><th className="p-3 text-start">Staff</th><th className="p-3 text-start">Status</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y">{list.map((b) => {
            const c = consents.find((x) => x.id === b.consentId || x.bookingId === b.id); const [pl, pc] = payChip(b); const due = balanceDue(b);
            return <tr key={b.id} className="align-top">
              <td className="whitespace-nowrap p-3"><b>{b.date}</b><br /><span className="text-sm text-ink/55">{b.time} · {b.ref}</span></td>
              <td className="p-3">{b.customer.name}<br /><span className="text-sm text-ink/55">{b.customer.phone}</span>{c && <span className={`chip mt-1 ${c.needsClearance ? "bg-red/10 text-red" : "bg-foam text-navy"}`}>{c.needsClearance ? "Doctor note" : "Form signed"}</span>}{!c && services.find((s) => s.id === b.serviceId)?.requiresConsent && <span className="chip mt-1 bg-ink/5 text-ink/60">Form missing</span>}</td>
              <td className="p-3">{b.serviceName}<br /><span className="text-sm text-ink/55">{b.people} {b.category === "rental" ? `× ${b.days || 1}d` : "people"}{b.promo ? ` · ${b.promo}` : ""}{b.gear?.wetsuit ? ` · suit ${b.gear.wetsuit}` : ""}</span></td>
              <td className="price p-3 text-end font-semibold">{egp(b.total)}{due > 0 && b.status !== "cancelled" && <span className="block text-xs font-normal text-red">{egp(due)} due</span>}</td>
              <td className="p-3"><span className={`chip ${pc}`}>{pl} · {b.payment.method === "paymob" ? "Paymob" : "Cash"}</span>{isAbandoned(b) && <span className="chip mt-1 bg-sun/30 text-navy">Abandoned{b.followedUp ? " · followed up" : ""}</span>}</td>
              <td className="p-3"><select aria-label="Assign staff" className="max-w-[140px] rounded-lg border border-ink/15 bg-white px-2 py-2" value={b.staffId || ""} onChange={(e) => put("bookings", { ...b, staffId: e.target.value || undefined })}><option value="">Unassigned</option>{staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
              <td className="p-3"><select aria-label="Status" className="rounded-lg border border-ink/15 bg-white px-2 py-2" value={b.status} onChange={(e) => put("bookings", { ...b, status: e.target.value as Booking["status"] })}>{["pending", "confirmed", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select></td>
              <td className="whitespace-nowrap p-3 text-end">{acts(b, due)}</td>
            </tr>;
          })}</tbody>
        </table></div> : <div className="p-6"><Empty>No bookings match.</Empty></div>}
      </div>
      <div className="space-y-3 md:hidden">
        {list.length ? list.map((b) => {
          const c = consents.find((x) => x.id === b.consentId || x.bookingId === b.id); const [pl, pc] = payChip(b); const due = balanceDue(b);
          return <article key={b.id} className="rounded-3xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold">{b.customer.name}</p><p className="text-sm text-ink/60">{b.date} · {b.time} · {b.ref}</p></div><div className="shrink-0 text-end"><p className="price font-black">{egp(b.total)}</p>{due > 0 && b.status !== "cancelled" && <p className="text-xs text-red">{egp(due)} due</p>}</div></div>
            <p className="mt-2 text-[15px]">{b.serviceName} <span className="text-sm text-ink/55">· {b.people} {b.category === "rental" ? `× ${b.days || 1}d` : "ppl"}{b.promo ? ` · ${b.promo}` : ""}</span></p>
            <div className="mt-2 flex flex-wrap gap-1.5"><span className={`chip ${pc}`}>{pl} · {b.payment.method === "paymob" ? "Paymob" : "Cash"}</span>{c ? <span className={`chip ${c.needsClearance ? "bg-red/10 text-red" : "bg-foam text-navy"}`}>{c.needsClearance ? "Doctor note" : "Form signed"}</span> : services.find((s) => s.id === b.serviceId)?.requiresConsent ? <span className="chip bg-ink/5 text-ink/60">Form missing</span> : null}{isAbandoned(b) && <span className="chip bg-sun/30 text-navy">Abandoned{b.followedUp ? " · followed up" : ""}</span>}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 [&_select]:w-full [&_select]:max-w-none"><select aria-label="Assign staff" className="max-w-[140px] rounded-lg border border-ink/15 bg-white px-2 py-2" value={b.staffId || ""} onChange={(e) => put("bookings", { ...b, staffId: e.target.value || undefined })}><option value="">Unassigned</option>{staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select aria-label="Status" className="rounded-lg border border-ink/15 bg-white px-2 py-2" value={b.status} onChange={(e) => put("bookings", { ...b, status: e.target.value as Booking["status"] })}>{["pending", "confirmed", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="mt-2 flex flex-wrap justify-end gap-1 border-t pt-2">{acts(b, due)}</div>
          </article>;
        }) : <div className="rounded-3xl bg-white p-6 shadow-card"><Empty>No bookings match.</Empty></div>}
      </div>
      <WalkIn open={adding} onClose={() => setAdding(false)} services={services} onSave={async (b) => { await put("bookings", b); setAdding(false); }} />
      <Sheet open={!!refund} onClose={() => setRefund(null)}>{refund && <div className="space-y-4 p-6 sm:p-8">
        <h3 className="text-2xl font-black">Refund {refund.ref}</h3>
        <p className="text-ink/70">{refund.customer.name} · {refund.serviceName} · received {egp(paidAmount(refund))} by {refund.payment.method === "paymob" ? "Paymob" : "cash"}.</p>
        <label className="block"><span className="label">Amount to refund (EGP)</span><input type="number" className="input" value={rAmt} onChange={(e) => setRAmt(+e.target.value)} /></label>
        <label className="block"><span className="label">Reason</span><input className="input" value={rWhy} onChange={(e) => setRWhy(e.target.value)} placeholder="Weather cancellation, medical, guest request…" /></label>
        <p className="text-sm text-ink/60">{refund.payment.method === "paymob" ? (backend?.refund ? "This sends the refund to the guest's card through Paymob." : "Preview: the refund is recorded here. On the live site it goes back to the card through Paymob.") : "Cash refund: record it here after handing the money back."}</p>
        {rErr && <p className="text-red">{rErr}</p>}
        <button className="btn-coral w-full" onClick={doRefund}><Undo2 size={18} /> Refund {egp(rAmt)}</button>
      </div>}</Sheet>
    </div>
  );
}

function WalkIn({ open, onClose, services, onSave }: { open: boolean; onClose: () => void; services: Service[]; onSave: (b: Booking) => void }) {
  const [sid, setSid] = useState(services[0]?.id); const [date, setDate] = useState(today()); const [people, setPeople] = useState(1);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [paid, setPaid] = useState(true);
  const s = services.find((x) => x.id === sid);
  return (
    <Sheet open={open} onClose={onClose}><form className="space-y-4 p-6 sm:p-8" onSubmit={(e) => { e.preventDefault(); if (!s || !name) return; onSave({ id: uid(), ref: bookingRef(), serviceId: s.id, serviceName: s.name, category: s.category, date, time: s.slots[0], people, total: s.price * people, customer: { name, email: "", phone, country: "" }, status: "confirmed", payment: { method: "cash", status: paid ? "paid" : "unpaid", paidAt: paid ? new Date().toISOString() : undefined, amountPaid: paid ? s.price * people : 0, history: paid ? [{ at: new Date().toISOString(), amount: s.price * people, method: "cash" }] : [] }, createdAt: new Date().toISOString() }); }}>
      <h3 className="text-2xl font-extrabold">Walk-in booking</h3>
      <select className="input" value={sid} onChange={(e) => setSid(e.target.value)}>{services.map((x) => <option key={x.id} value={x.id}>{x.name} — {egp(x.price)}</option>)}</select>
      <div className="grid grid-cols-2 gap-3"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /><input type="number" min={1} className="input" value={people} onChange={(e) => setPeople(Math.max(1, +e.target.value))} aria-label="People" /></div>
      <input className="input" placeholder="Guest name" value={name} onChange={(e) => setName(e.target.value)} /><input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[#06485a]" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Paid in cash now</label>
      <p className="font-semibold">Total {egp((s?.price || 0) * people)}</p>
      <button className="btn-sea w-full">Save booking</button>
    </form></Sheet>
  );
}

/* ---------- Consents ---------- */
function Consents() {
  const { consents, put, settings, backend } = useStore();
  const [q, setQ] = useState(""); const [view, setView] = useState<Consent | null>(null); const [sig, setSig] = useState(""); const [msg, setMsg] = useState("");
  const list = consents.filter((c) => q === "" || `${c.fullName} ${c.bookingRef} ${c.idNumber} ${c.program}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.signedAt < b.signedAt ? 1 : -1));
  const download = async (c: Consent) => { const ok = await backend?.saveFile(pdfName(c), consentPdf(c, settings)); setMsg(ok ? "" : "Downloads aren't available in this view."); };
  const countersign = async () => {
    if (!view || !(sig || settings.centerSignature)) return;
    const c = { ...view, centerSignature: sig || settings.centerSignature, centerSigner: settings.centerSigner || settings.centerName, countersignedAt: new Date().toISOString() };
    await put("consents", c); setView(c); setSig("");
  };
  return (
    <div className="space-y-5">
      <PageTitle t="Consent forms" s="Every signed medical statement and liability release. Download as PDF with both signatures." />
      <label className="relative block"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" /><input className="input pl-11" placeholder="Search name, booking ref, ID number" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {msg && <p className="text-coral">{msg}</p>}
      <div className="grid gap-3">
        {list.length ? list.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${c.needsClearance ? "bg-coral/15 text-coral" : "bg-foam text-sea"}`}>{c.needsClearance ? <AlertTriangle size={20} /> : <FileSignature size={20} />}</span>
            <span className="min-w-[12rem] flex-1"><span className="block font-semibold">{c.fullName}</span><span className="text-sm text-ink/60">{c.program} · {c.bookingRef || "no booking"}</span></span>
            <span className="text-sm text-ink/60">Stay {c.arrival} → {c.departure}</span>
            <span className={`chip ${c.countersignedAt ? "bg-foam text-sea" : "bg-sand text-ink"}`}>{c.countersignedAt ? "Countersigned" : "Awaiting center"}</span>
            <span className="flex gap-2"><button className="btn-ghost text-sm" onClick={() => setView(c)}>Open</button><button className="btn-ghost text-sm" onClick={() => download(c)}><Download size={16} /> PDF</button></span>
          </div>
        )) : <Empty>No forms yet. They appear here as soon as a guest signs.</Empty>}
      </div>
      <Sheet wide open={!!view} onClose={() => setView(null)}>{view && <div className="space-y-6 p-6 sm:p-8">
        <div><p className="text-sm text-ink/55">{view.bookingRef} · signed {new Date(view.signedAt).toLocaleString("en-GB")}</p><h3 className="text-2xl font-extrabold">{view.fullName}</h3></div>
        {view.needsClearance && <p className="flex gap-3 rounded-2xl bg-coral/10 p-4"><AlertTriangle className="shrink-0 text-coral" />Doctor's written approval required before water activities.</p>}
        <dl className="grid gap-3 sm:grid-cols-3">{[["Date of birth", view.dob], ["Nationality", view.nationality], ["ID / passport", view.idNumber], ["Phone", view.phone], ["Email", view.email], ["Stay", `${view.arrival} → ${view.departure}`], ["Accommodation", view.accommodation], ["Certification", view.certLevel || "None"], ["Emergency", `${view.emergencyName} · ${view.emergencyPhone}`]].map(([k, v]) => <div key={k}><dt className="text-xs text-ink/55">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>)}</dl>
        <div><h4 className="mb-2 font-bold">Medical answers</h4><ul className="grid gap-1 text-sm">{MEDICAL_QUESTIONS.map((q) => <li key={q.id} className="flex justify-between gap-4 border-b border-ink/5 py-1.5"><span>{q.en}</span><b className={view.answers[q.id] === "yes" ? "text-coral" : "text-ink/60"}>{view.answers[q.id]?.toUpperCase()}</b></li>)}</ul>{(view.healthNotes || view.medications) && <p className="mt-3 text-sm"><b>Notes:</b> {view.healthNotes || "—"} · <b>Medications:</b> {view.medications || "—"}</p>}</div>
        <div><h4 className="mb-2 font-bold">Acknowledged</h4><ul className="grid gap-1 text-sm">{ACKNOWLEDGEMENTS.map((a) => <li key={a.id} className="flex gap-2"><span className={view.acks[a.id] ? "text-[#0b7a52]" : "text-ink/30"}>{view.acks[a.id] ? "✓" : "–"}</span>{a.en}</li>)}</ul></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="mb-2 text-sm font-semibold">Participant</p><img src={view.signature} alt="Participant signature" className="h-32 w-full rounded-2xl border object-contain" /></div>
          <div><p className="mb-2 text-sm font-semibold">Dive center</p>{view.centerSignature ? <img src={view.centerSignature} alt="Center signature" className="h-32 w-full rounded-2xl border object-contain" /> : <><SignaturePad value={sig} onChange={setSig} height={128} />{settings.centerSignature && <p className="text-sm text-ink/55">Or leave blank to use the saved center signature.</p>}</>}</div>
        </div>
        <div className="flex flex-wrap gap-3">{!view.centerSignature && <button className="btn-sea" disabled={!sig && !settings.centerSignature} onClick={countersign}><FileSignature size={18} /> Countersign</button>}<button className="btn-coral" onClick={() => download(view)}><Download size={18} /> Download signed PDF</button></div>
      </div>}</Sheet>
    </div>
  );
}

/* ---------- Finance ---------- */
function Finance() {
  const { expenses, services, put, remove, bookings, settings, backend, can } = useStore();
  const [expMsg, setExpMsg] = useState("");
  const [range, setRange] = useState(6);
  const f = useFinance(range);
  const [e, setE] = useState<Expense>({ id: "", date: today(), category: EXP_CATS[0], amount: 0, note: "" });
  const addExpense = async (ev: React.FormEvent) => { ev.preventDefault(); if (!e.amount) return; await put("expenses", { ...e, id: uid() }); setE({ ...e, amount: 0, note: "" }); };
  const best = [...f.rows].sort((a, b) => b.revenue - a.revenue)[0];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle t={f.tot.revenue ? `${egp(f.tot.net)} net income over ${range} months` : "Finance"} s={f.tot.revenue ? `${egp(f.tot.revenue)} revenue − ${egp(f.tot.costs)} expenses & payment fees · best month ${best.label}` : "Revenue counts paid bookings by their activity date."} />
        <div className="mb-5 flex flex-wrap items-center gap-2"><div className="flex gap-1 rounded-full bg-white p-1 shadow-card">{[3, 6, 12].map((r) => <button key={r} onClick={() => setRange(r)} className={`min-h-[40px] rounded-full px-4 font-medium ${r === range ? "bg-navy text-white" : ""}`}>{r} mo</button>)}</div>
          {can("export") && <><button className="btn-ghost text-sm" onClick={async () => { const ok = await exportFinanceXlsx(f, bookings, expenses, backend); setExpMsg(ok ? "" : "Downloads aren't available in this view."); }}><FileSpreadsheet size={16} /> Excel</button>
          <button className="btn-ghost text-sm" onClick={async () => { const ok = await exportFinancePdf(f, range, settings, backend); setExpMsg(ok ? "" : "Downloads aren't available in this view."); }}><FileDown size={16} /> PDF</button></>}</div>
      </div>
      {expMsg && <p className="text-red">{expMsg}</p>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Revenue" value={egp(f.tot.revenue)} sub={`${f.tot.count} paid bookings · after refunds`} />
        <Kpi label="Expenses & fees" value={egp(f.tot.costs)} />
        <Kpi label="Net income" value={egp(f.tot.net)} sub={f.tot.revenue ? `${Math.round((f.tot.net / f.tot.revenue) * 100)}% margin` : undefined} tone={f.tot.net >= 0 ? "good" : "bad"} />
        <Kpi label="Avg booking value" value={f.tot.count ? egp(f.tot.revenue / f.tot.count) : "—"} />
      </div>
      <Card title="Revenue, costs and net income by month">
        <div className="h-[280px]"><ResponsiveContainer><LineChart data={f.rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e6ebeb" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: "#52514e" }} /><YAxis tickFormatter={short} tickLine={false} axisLine={false} width={44} tick={{ fontSize: 13, fill: "#52514e" }} />
          <Tooltip content={<ChartTip />} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
          <Line dataKey="revenue" name="Revenue" stroke="#2a78d6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
          <Line dataKey="costs" name="Expenses & fees" stroke="#eb6834" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
          <Line dataKey="net" name="Net income" stroke="#1baf7a" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
        </LineChart></ResponsiveContainer></div>
      </Card>
      <Card title="Revenue by category"><CategoryBars rows={f.rows} /></Card>
      <Card title="Top service each month">
        <div className="overflow-x-auto"><table className="w-full text-left text-[15px]"><thead className="text-sm text-ink/55"><tr><th className="py-2">Month</th><th className="py-2">Top service</th><th className="py-2 text-right">Its revenue</th><th className="py-2 text-right">Month revenue</th><th className="py-2 text-right">Costs</th><th className="py-2 text-right">Net</th></tr></thead>
          <tbody className="divide-y">{[...f.rows].reverse().map((r) => <tr key={r.m}><td className="py-2.5 font-semibold">{r.label}</td><td className="py-2.5">{r.top}</td><td className="price py-2.5 text-right">{egp(r.topValue)}</td><td className="price py-2.5 text-right">{egp(r.revenue)}</td><td className="price py-2.5 text-right">{egp(r.costs)}</td><td className={`price py-2.5 text-right font-semibold ${r.net < 0 ? "text-coral" : ""}`}>{egp(r.net)}</td></tr>)}</tbody></table></div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title={`Services ranked by revenue (${range} months)`}>
          {f.perService.length ? <ul className="space-y-3">{f.perService.slice(0, 12).map(({ s, rev, net, count, people }) => (
            <li key={s.id}><div className="flex flex-wrap justify-between gap-2 text-[15px]"><span className="font-medium">{s.name} <span className="text-sm text-ink/50">· {count} bookings, {people} guests</span></span><span className="price font-semibold">{egp(rev)} <span className="text-sm font-normal text-ink/55">net {egp(net)}</span></span></div>
              <div className="mt-1.5 h-2.5 rounded-full bg-ink/5"><div className="h-full rounded-full" style={{ width: `${(rev / f.perService[0].rev) * 100}%`, background: CAT_COLOR[s.category] }} /></div></li>
          ))}</ul> : <Empty>No paid bookings in this range.</Empty>}
        </Card>
        <Card title="Add an expense">
          <form onSubmit={addExpense} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3"><input type="date" className="input" value={e.date} onChange={(x) => setE({ ...e, date: x.target.value })} aria-label="Date" /><input type="number" min={0} className="input" placeholder="Amount EGP" value={e.amount || ""} onChange={(x) => setE({ ...e, amount: +x.target.value })} aria-label="Amount" /></div>
            <select className="input" value={e.category} onChange={(x) => setE({ ...e, category: x.target.value })}>{EXP_CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <select className="input" value={e.serviceId || ""} onChange={(x) => setE({ ...e, serviceId: x.target.value || undefined })}><option value="">General (not linked to a service)</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <input className="input" placeholder="Note (optional)" value={e.note} onChange={(x) => setE({ ...e, note: x.target.value })} />
            <button className="btn-sea"><Plus size={18} /> Add expense</button>
          </form>
          {f.byExpCat.length > 0 && <ul className="mt-5 space-y-1.5 border-t pt-4 text-[15px]">{f.byExpCat.map((x) => <li key={x.c} className="flex justify-between"><span>{x.c}</span><span className="price">{egp(x.v)}</span></li>)}</ul>}
        </Card>
      </div>
      <Card title="Recent expenses">
        {expenses.length ? <ul className="divide-y">{[...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15).map((x) => <li key={x.id} className="flex items-center gap-3 py-2.5"><span className="w-24 shrink-0 text-sm text-ink/55">{x.date}</span><span className="flex-1">{x.category}{x.note && <span className="text-ink/55"> · {x.note}</span>}{x.serviceId && <span className="text-ink/55"> · {services.find((s) => s.id === x.serviceId)?.name}</span>}</span><span className="price font-semibold">{egp(x.amount)}</span><button className="btn px-2 text-ink/40 hover:text-coral" aria-label="Delete expense" onClick={() => remove("expenses", x.id)}><Trash2 size={16} /></button></li>)}</ul> : <Empty>No expenses logged yet.</Empty>}
      </Card>
      <SampleData hasData={bookings.length + expenses.length > 0} />
    </div>
  );
}

function SampleData({ hasData }: { hasData: boolean }) {
  const { services, bookings, expenses, consents, put, remove, staff } = useStore();
  const [busy, setBusy] = useState(false);
  const sampleCount = bookings.filter((b) => b.sample).length + expenses.filter((x) => x.sample).length;
  const load = async () => {
    setBusy(true);
    const weight: Record<string, number> = { owd: 9, dsd: 12, aowd: 5, combo: 4, "bh-snorkel": 14, pools: 10, tawilat: 9, shore: 12, "bh-dive": 6, "r-full": 8, lagoon: 5, nitrox: 3, sinai: 5 };
    const pool = services.filter((s) => s.category !== "addon").flatMap((s) => Array(weight[s.id] || 1).fill(s));
    const names = ["Lena M.", "Omar K.", "Sara A.", "Tom B.", "Nour H.", "Yusuf E.", "Mia R.", "Karim S.", "Julia P.", "Ahmed F."];
    const now = new Date();
    const queue: Promise<void>[] = [];
    const flush = async () => { await Promise.all(queue.splice(0)); };
    const add = async (col: "bookings" | "expenses", doc: any) => { queue.push(put(col, doc)); if (queue.length >= 8) await flush(); };
    for (let m = 5; m >= 0; m--) {
      const season = 1 + (m % 3 === 0 ? 0.4 : 0);
      const n = Math.round((14 + Math.random() * 10) * season);
      for (let i = 0; i < n; i++) {
        const s = pool[Math.floor(Math.random() * pool.length)];
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1 + Math.floor(Math.random() * 27));
        const people = 1 + Math.floor(Math.random() * (s.category === "tour" ? 4 : 2));
        const total = s.price * people; const online = Math.random() > 0.35;
        await add("bookings", { id: uid(), ref: bookingRef(), serviceId: s.id, serviceName: s.name, category: s.category, date: d.toISOString().slice(0, 10), time: s.slots[0], people, total, customer: { name: names[i % names.length], email: "", phone: "", country: "" }, status: m === 0 && d >= now ? "confirmed" : "completed", staffId: staff.length ? staff[i % staff.length].id : undefined, payment: { method: online ? "paymob" : "cash", status: "paid", amountPaid: total, history: [{ at: d.toISOString(), amount: total, method: online ? "paymob" : "cash" }], fee: online ? Math.round(total * 0.0275 + 3) : 0 }, createdAt: d.toISOString(), sample: true } as Booking);
      }
      const md = (day: number) => new Date(now.getFullYear(), now.getMonth() - m, day).toISOString().slice(0, 10);
      for (const [c, a, sid] of [["Staff & instructors", 60000], ["Rent & utilities", 18000], ["Boat & transport", 9000 + Math.random() * 6000, "lagoon"], ["Tank fills & gas", 7000 + Math.random() * 3000], ["Certification fees", 6000 + Math.random() * 4000, "owd"], ["Marketing & ads", 5000], ["Equipment & maintenance", 3000 + Math.random() * 5000]] as [string, number, string?][])
        await add("expenses", { id: uid(), date: md(5 + Math.floor(Math.random() * 20)), category: c, amount: Math.round(a), note: "sample", serviceId: sid, sample: true });
    }
    await flush();
    setBusy(false);
  };
  const clear = async () => { setBusy(true); for (const b of bookings.filter((x) => x.sample)) await remove("bookings", b.id); for (const x of expenses.filter((y) => y.sample)) await remove("expenses", x.id); for (const c of consents.filter((y) => y.sample)) await remove("consents", c.id); setBusy(false); };
  return (
    <Card title="Sample data">
      <p className="mb-4 text-ink/65">Fill the dashboard with six months of realistic sample bookings and expenses to see how the analysis works. Sample rows are tagged and can be removed in one click.</p>
      <div className="flex flex-wrap gap-3">{(!hasData || !sampleCount) && <button className="btn-sea" disabled={busy} onClick={load}>{busy ? "Working…" : "Load sample data"}</button>}{sampleCount > 0 && <button className="btn-ghost" disabled={busy} onClick={clear}><Trash2 size={16} /> Remove {sampleCount} sample rows</button>}</div>
    </Card>
  );
}

/* ---------- Services ---------- */
function Services() {
  const { services, put, media } = useStore();
  const [edit, setEdit] = useState<Service | null>(null);
  const blank: Service = { id: "", category: "course", name: "", short: "", description: "", includes: [], duration: "", price: 0, unit: "per person", scene: "reef", requiresConsent: true, slots: ["09:00"], capacity: 8, active: true, sort: services.length };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><PageTitle t="Services & prices" s="Changes show on the website immediately." /><button className="btn-sea mb-5" onClick={() => setEdit({ ...blank, id: uid() })}><Plus size={18} /> New service</button></div>
      {CAT_ORDER.map((c) => <Card key={c} title={CATEGORY_LABEL[c]}>
        <ul className="divide-y">{services.filter((s) => s.category === c).map((s) => <li key={s.id} className="flex flex-wrap items-center gap-4 py-3">
          <span className="h-12 w-16 shrink-0 overflow-hidden rounded-xl"><Visual scene={s.scene} url={s.mediaUrl} label={s.name} /></span>
          <span className="min-w-[10rem] flex-1"><span className={`block font-semibold ${s.active ? "" : "text-ink/40 line-through"}`}>{s.name}</span><span className="text-sm text-ink/55">{s.duration}</span></span>
          <span className="price font-bold text-sea">{egp(s.price)}</span>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#06485a]" checked={s.active} onChange={(e) => put("services", { ...s, active: e.target.checked })} /> On site</label>
          <button className="btn-ghost text-sm" onClick={() => setEdit(s)}>Edit</button>
        </li>)}</ul>
      </Card>)}
      <Sheet wide open={!!edit} onClose={() => setEdit(null)}>{edit && <ServiceForm s={edit} media={media} onSave={async (s) => { await put("services", s); setEdit(null); }} />}</Sheet>
    </div>
  );
}

function ServiceForm({ s: init, media, onSave }: { s: Service; media: MediaItem[]; onSave: (s: Service) => void }) {
  const [s, setS] = useState(init);
  const [inc, setInc] = useState(init.includes.join("\n"));
  const [slots, setSlots] = useState(init.slots.join(", "));
  const f = (k: keyof Service) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.type === "number" ? +e.target.value : e.target.value });
  return (
    <form className="space-y-4 p-6 sm:p-8" onSubmit={(e) => { e.preventDefault(); if (!s.name) return; onSave({ ...s, includes: inc.split("\n").map((x) => x.trim()).filter(Boolean), slots: slots.split(",").map((x) => x.trim()).filter(Boolean) }); }}>
      <h3 className="text-2xl font-extrabold">{init.name || "New service"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="label">Name</span><input className="input" value={s.name} onChange={f("name")} /></label>
        <label><span className="label">Category</span><select className="input" value={s.category} onChange={f("category")}>{CAT_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></label>
        <label><span className="label">Price (EGP)</span><input type="number" min={0} className="input" value={s.price} onChange={f("price")} /></label>
        <label><span className="label">Unit</span><input className="input" value={s.unit} onChange={f("unit")} placeholder="per person" /></label>
        <label><span className="label">Duration</span><input className="input" value={s.duration} onChange={f("duration")} /></label>
        <label><span className="label">Badge (optional)</span><input className="input" value={s.badge || ""} onChange={f("badge")} /></label>
        <label><span className="label">Level</span><input className="input" value={s.level || ""} onChange={f("level")} placeholder="Beginner, Certified…" /></label>
        <label><span className="label">Minimum age</span><input type="number" className="input" value={s.minAge || ""} onChange={f("minAge")} /></label>
        <label><span className="label">Start times (comma separated)</span><input className="input" value={slots} onChange={(e) => setSlots(e.target.value)} /></label>
        <label><span className="label">Places per start time</span><input type="number" min={1} className="input" value={s.capacity} onChange={f("capacity")} /></label>
        <label className="sm:col-span-2"><span className="label">Short line</span><input className="input" value={s.short} onChange={f("short")} /></label>
        <label className="sm:col-span-2"><span className="label">Description</span><textarea rows={3} className="input" value={s.description} onChange={f("description")} /></label>
        <label className="sm:col-span-2"><span className="label">What's included (one per line)</span><textarea rows={4} className="input" value={inc} onChange={(e) => setInc(e.target.value)} /></label>
        <label><span className="label">Illustration (when no photo)</span><select className="input" value={s.scene} onChange={f("scene")}>{SCENES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label><span className="label">Photo / video</span><select className="input" value={s.mediaUrl || ""} onChange={(e) => setS({ ...s, mediaUrl: e.target.value || undefined })}><option value="">Use illustration</option>{media.map((m) => <option key={m.id} value={m.url}>{m.caption || m.kind} ({m.role})</option>)}</select></label>
        <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" className="h-5 w-5 accent-[#06485a]" checked={s.requiresConsent} onChange={(e) => setS({ ...s, requiresConsent: e.target.checked })} /> Guests must sign the medical form to book</label>
      </div>
      <div className="h-40 overflow-hidden rounded-2xl"><Visual scene={s.scene} url={s.mediaUrl} label="Preview" /></div>
      <button className="btn-sea w-full">Save service</button>
    </form>
  );
}

/* ---------- Media ---------- */
function Media() {
  const { media, put, remove, backend } = useStore();
  const [role, setRole] = useState<MediaRole>("gallery"); const [tag, setTag] = useState("Underwater"); const [caption, setCaption] = useState(""); const [url, setUrl] = useState("");
  const [gRef, setGRef] = useState(""); const [gEmail, setGEmail] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const add = async (files: FileList | null) => {
    if (!files?.length || !backend) return; setBusy(true); setErr("");
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) { setErr(`${file.name} is over 20 MB — compress it first.`); continue; }
        const up = await backend.upload(file);
        await put("media", { id: uid(), kind: file.type.startsWith("video") ? "video" : "image", role, url: up.url, assetId: up.assetId, caption: caption || file.name.replace(/\.\w+$/, ""), tag: role === "client" ? "Clients" : role === "reel" ? "Reels" : role === "guest" ? "Guest" : tag, ...(role === "guest" ? { bookingRef: gRef.trim().toUpperCase() || undefined, guestEmail: gEmail.trim().toLowerCase() || undefined } : {}), createdAt: new Date().toISOString() } as MediaItem);
      }
      setCaption("");
    } catch (e: any) { setErr("Upload failed: " + (e?.message || e)); }
    setBusy(false);
  };
  const addUrl = async () => { if (!url) return; await put("media", { id: uid(), kind: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image", role, url, caption, tag, createdAt: new Date().toISOString() } as MediaItem); setUrl(""); setCaption(""); };
  const roles: [MediaRole, string][] = [["hero", "Home hero video"], ["reel", "Reels"], ["gallery", "Gallery"], ["client", "Clients"], ["guest", "Guest photo packages"]];
  return (
    <div className="space-y-5">
      <PageTitle t="Media" s="Upload photos and videos. The hero video plays on the home page; reels fill the reels row; client photos show in “Our divers”." />
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className="label">Where it appears</span><select className="input" value={role} onChange={(e) => setRole(e.target.value as MediaRole)}>{roles.map(([r, l]) => <option key={r} value={r}>{l}</option>)}</select></label>
          <label><span className="label">Gallery tag</span><select className="input" value={tag} onChange={(e) => setTag(e.target.value)} disabled={role === "client" || role === "reel"}>{["Underwater", "Courses", "Trips", "Dahab", "Team", "Clients"].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label><span className="label">Caption</span><input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Sara's first dive" /></label>
          {role === "guest" && <><label><span className="label">Booking reference</span><input className="input uppercase" value={gRef} onChange={(e) => setGRef(e.target.value)} placeholder="DD-XXXXX" /></label><label className="sm:col-span-2"><span className="label">Guest email (optional)</span><input className="input" value={gEmail} onChange={(e) => setGEmail(e.target.value)} /></label><p className="text-sm text-ink/60 sm:col-span-3">Guests see these blurred in their account and unlock them by buying the photo package.</p></>}
        </div>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sea/30 bg-foam/50 p-8 text-center hover:bg-foam">
          <Upload className="text-sea" /><span className="font-semibold">{busy ? "Uploading…" : "Choose photos or videos"}</span><span className="text-sm text-ink/55">JPG, PNG, WebP, MP4 · up to 20 MB each. Vertical 9:16 videos work best for reels.</span>
          <input type="file" multiple accept="image/*,video/*" className="sr-only" onChange={(e) => add(e.target.files)} />
        </label>
        <div className="mt-4 flex flex-wrap gap-3"><input className="input flex-1" placeholder="…or paste an image/video URL" value={url} onChange={(e) => setUrl(e.target.value)} /><button className="btn-ghost" onClick={addUrl}>Add link</button></div>
        {backend?.mode === "local" && <p className="mt-3 text-sm text-ink/55">Demo mode: uploads are kept in this browser only. Connect Supabase to store them online.</p>}
        {err && <p className="mt-3 text-coral">{err}</p>}
      </Card>
      {roles.map(([r, l]) => {
        const items = media.filter((m) => m.role === r);
        return <Card key={r} title={`${l} (${items.length})`}>
          {items.length ? <div className={`grid gap-3 ${r === "reel" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>{items.map((m) => (
            <figure key={m.id} className="group relative overflow-hidden rounded-2xl bg-ink/5"><div className={r === "reel" ? "aspect-[9/16]" : "aspect-[4/3]"}><Visual scene="reef" url={m.url} kind={m.kind} label={m.caption} /></div>
              <figcaption className="truncate p-2 text-sm">{m.caption}</figcaption>
              <button className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-coral shadow" aria-label="Delete" onClick={() => remove("media", m.id)}><Trash2 size={16} /></button></figure>
          ))}</div> : <Empty>{r === "hero" ? "No hero video yet — the animated underwater scene plays instead. Upload a 10–20 s landscape clip (MP4, muted)." : "Nothing uploaded yet."}</Empty>}
        </Card>;
      })}
    </div>
  );
}

/* ---------- Settings ---------- */
function SettingsTab() {
  const { settings, put, backend, user } = useStore();
  const [s, setS] = useState(settings); const [saved, setSaved] = useState(false);
  const f = (k: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement>) => { setSaved(false); setS({ ...s, [k]: e.target.type === "number" ? +e.target.value : e.target.value }); };
  return (
    <div className="space-y-5">
      <PageTitle t="Settings" />
      <Card title="Center details">
        <div className="grid gap-4 sm:grid-cols-2">
          {([["centerName", "Center name"], ["phone", "Phone"], ["whatsapp", "WhatsApp number (digits, with country code)"], ["email", "Email"], ["address", "Address"], ["instagram", "Instagram URL"]] as [keyof typeof s, string][]).map(([k, l]) => <label key={k}><span className="label">{l}</span><input className="input" value={String(s[k])} onChange={f(k)} /></label>)}
        </div>
      </Card>
      <Card title="Booking rules and prices">
        <div className="grid gap-4 sm:grid-cols-3">
          <label><span className="label">Deposit %</span><input type="number" className="input" value={s.depositPct} onChange={f("depositPct")} /></label>
          <label><span className="label">Free change/cancel up to (hours before)</span><input type="number" className="input" value={s.freeCancelHours} onChange={f("freeCancelHours")} /></label>
          <label><span className="label">Photo and video package (EGP)</span><input type="number" className="input" value={s.photoPackagePrice} onChange={f("photoPackagePrice")} /></label>
          <label><span className="label">EGP per 1 USD (fallback)</span><input type="number" step="0.01" className="input" value={s.rates.USD} onChange={(e) => setS({ ...s, rates: { ...s.rates, USD: +e.target.value } })} /></label>
          <label><span className="label">EGP per 1 EUR (fallback)</span><input type="number" step="0.01" className="input" value={s.rates.EUR} onChange={(e) => setS({ ...s, rates: { ...s.rates, EUR: +e.target.value } })} /></label>
        </div>
        <p className="mt-3 text-sm text-ink/60">Prices are stored and charged in EGP. USD/EUR are shown for guidance using live rates; these fallback rates are used when live rates can't load.</p>
      </Card>
      <Card title="Marketing and tracking">
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">Meta Pixel ID</span><input className="input" value={s.pixelId} onChange={f("pixelId")} placeholder="123456789012345" /></label>
          <label><span className="label">Google Analytics 4 ID</span><input className="input" value={s.ga4Id} onChange={f("ga4Id")} placeholder="G-XXXXXXXXXX" /></label>
          <label className="sm:col-span-2"><span className="label">Google reviews link</span><input className="input" value={s.googleReviewsUrl} onChange={f("googleReviewsUrl")} placeholder="https://g.page/r/..." /></label>
          <label className="sm:col-span-2"><span className="label">Home hero video URL (used until you upload one in Media)</span><input className="input" value={s.heroVideo} onChange={f("heroVideo")} /></label>
        </div>
        <p className="mt-3 text-sm text-ink/60">Events tracked: page views, program views, add to trip, checkout started and purchases.</p>
      </Card>
      <Card title="Payments (Paymob)">
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">Gateway fee %</span><input type="number" step="0.01" className="input" value={s.gatewayFeePct} onChange={f("gatewayFeePct")} /></label>
          <label><span className="label">Fixed fee per transaction (EGP)</span><input type="number" className="input" value={s.gatewayFixed} onChange={f("gatewayFixed")} /></label>
        </div>
        <p className="mt-3 text-sm text-ink/60">Set these to the rates in your Paymob contract — they're deducted when calculating net income. API keys never go here: they live as server secrets (see the setup guide).</p>
        <p className="mt-2 text-sm"><b>Status:</b> {backend?.mode === "supabase" ? "Live — payments go through the paymob-intention function." : "Preview — checkout is simulated, no money moves."}</p>
      </Card>
      <Card title="Center signature for consent forms">
        <label className="mb-4 block"><span className="label">Signer name & role</span><input className="input" value={s.centerSigner} onChange={f("centerSigner")} placeholder="e.g. Ahmed — Dive Center Manager" /></label>
        {s.centerSignature ? <div><img src={s.centerSignature} alt="Saved center signature" className="h-32 w-full rounded-2xl border object-contain" /><button className="btn-ghost mt-2 text-sm" onClick={() => setS({ ...s, centerSignature: "" })}>Replace</button></div> : <SignaturePad value="" onChange={(v) => setS({ ...s, centerSignature: v })} height={140} />}
        <p className="mt-2 text-sm text-ink/60">When saved, new forms are countersigned automatically, so guests can download a PDF signed by both sides right away.</p>
      </Card>
      {user?.role === "owner" && <Card title="Owner sign-in">
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">Owner mobile (SMS code)</span><input className="input" dir="ltr" type="tel" value={s.ownerPhone || ""} onChange={f("ownerPhone")} /></label>
          <label><span className="label">Owner Gmail (Google sign-in)</span><input className="input" dir="ltr" type="email" value={s.ownerEmail || ""} onChange={f("ownerEmail")} placeholder="owner@gmail.com" /></label>
          {backend?.mode !== "supabase" && <label><span className="label">Backup PIN (preview only)</span><input className="input" value={s.adminPin} onChange={f("adminPin")} /></label>}
        </div>
        <p className="mt-3 text-sm text-ink/60">The owner always has full access with this number or Gmail. Everyone else gets access in Team and roles.</p>
      </Card>}
      <div className="flex items-center gap-3"><button className="btn-sea" onClick={async () => { await put("settings", { ...s, id: "main" }); setSaved(true); }}>Save settings</button>{saved && <span className="text-[#0b7a52]">Saved</span>}</div>
    </div>
  );
}
