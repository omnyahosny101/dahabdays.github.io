/* Guest self-service: manage booking, account with logbook and photos, blog / dive-site guides */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, CalendarClock, Camera, Lock, LogOut, Plus, Search, XCircle } from "lucide-react";
import { HandNote, Mark, Phase, RedTab, Stamp, Wave } from "../components/brand";
import { Empty, Visual } from "../components/ui";
import { useI18n } from "../lib/i18n";
import { addDays, go, today, uid, useStore } from "../lib/store";
import type { Booking, LogEntry, Post } from "../lib/types";
import { DEMO_GUEST } from "../lib/showcase";

const Page = ({ kicker, a, b, children }: { kicker: string; a: string; b: string; children: ReactNode }) => {
  const { t } = useI18n();
  return (
    <div className="bg-foam pb-20">
      <section className="bg-navy pb-10 pt-32 text-white"><div className="wrap"><RedTab>{t(kicker)}</RedTab><h1 className="mt-4 break-words text-[38px] leading-tight sm:text-[54px]"><span className="font-black">{t(a)}</span> <span className="font-medium text-sky">{t(b)}</span></h1></div></section>
      <Wave top="#15284B" back="#2EA3E3" front="#EAF6FD" />
      <div className="wrap max-w-4xl">{children}</div>
    </div>
  );
};

/* ---------- Manage booking: reschedule or cancel ---------- */
export function Manage() {
  const { bookings, backend, put, settings, services } = useStore();
  const { t, money } = useI18n();
  const demo = (() => { try { return sessionStorage.getItem("dd:demoRef"); } catch { return null; } })();
  const [ref, setRef] = useState(demo || ""); const [email, setEmail] = useState(demo ? DEMO_GUEST.email : "");
  const [found, setFound] = useState<Booking[] | null>(null); const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<{ id: string; date: string; time: string } | null>(null);
  const minDays = Math.ceil(settings.freeCancelHours / 24);
  const canChange = (b: Booking) => b.status !== "cancelled" && b.date >= addDays(today(), minDays);
  const find = async () => {
    setErr(""); setMsg("");
    try {
      const r = ref.trim().toUpperCase(), e = email.trim().toLowerCase();
      const res = backend?.guestFind ? await backend.guestFind(r, e) : bookings.filter((b) => b.ref === r && b.customer.email.toLowerCase() === e);
      if (!res.length) setErr("We couldn't find a booking with that reference and email."); setFound(res);
    } catch (x: any) { setErr(x?.message || "Lookup failed."); }
  };
  const update = async (b: Booking, patch: { date?: string; time?: string; cancel?: boolean }) => {
    if (backend?.guestUpdate) await backend.guestUpdate(b.ref, email.trim().toLowerCase(), b.id, patch);
    else await put("bookings", { ...b, ...(patch.date ? { date: patch.date } : {}), ...(patch.time ? { time: patch.time } : {}), ...(patch.cancel ? { status: "cancelled", cancelledBy: "guest" } : {}) });
    setFound((f) => f?.map((x) => (x.id === b.id ? { ...x, ...(patch.date ? { date: patch.date } : {}), ...(patch.time ? { time: patch.time } : {}), ...(patch.cancel ? { status: "cancelled" } : {}) } : x)) || null);
    setEdit(null); setMsg(patch.cancel ? "Cancelled. If you paid online, our team will process your refund and confirm on WhatsApp." : "Updated — see you then!");
  };
  return (
    <Page kicker="Manage booking" a="Find" b="your booking">
      <div className="card -mt-4 p-6 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <input className="input uppercase" placeholder="DD-XXXXX" aria-label={t("Booking reference")} value={ref} onChange={(e) => setRef(e.target.value)} />
          <input className="input" type="email" placeholder={t("Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-sea" onClick={find}><Search size={18} /> {t("Find booking")}</button>
        </div>
        <p className="mt-3 text-sm text-ink/60">You can change dates or cancel for free up to {settings.freeCancelHours} hours before your start. After that, message us on WhatsApp.</p>
        {backend?.mode !== "supabase" && !found && <button className="btn mt-3 border-2 border-dashed border-sky/50 text-sm" onClick={() => { setRef("DD-ATTR4"); setEmail(DEMO_GUEST.email); }}>Try with {DEMO_GUEST.name}'s booking (demo)</button>}
        {err && <p className="mt-4 text-red">{err}</p>}
        {msg && <p className="mt-4 font-semibold text-[#0b7a52]">{msg}</p>}
        {found && found.length > 0 && <ul className="mt-6 space-y-3">{found.map((b, i) => { const s = services.find((x) => x.id === b.serviceId); return (
          <li key={b.id} className="rounded-2xl border-2 border-navy/10 p-4">
            <div className="flex flex-wrap items-center gap-3"><Phase i={i} size={18} /><span className="min-w-[10rem] flex-1"><b>{b.serviceName}</b><span className="block text-sm text-ink/60">{b.date} · {b.time} · {money(b.total)}</span></span>
              {b.status === "cancelled" ? <span className="chip bg-ink/10">Cancelled</span> : canChange(b) ? <span className="flex gap-2"><button className="btn-ghost text-sm" onClick={() => setEdit({ id: b.id, date: b.date, time: b.time })}><CalendarClock size={16} /> {t("Change date")}</button><button className="btn text-sm text-red hover:bg-red/5" onClick={() => update(b, { cancel: true })}><XCircle size={16} /> {t("Cancel booking")}</button></span> : <span className="text-sm text-ink/60">Within {settings.freeCancelHours} h — WhatsApp us to change</span>}
            </div>
            {edit?.id === b.id && <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-foam p-4">
              <label><span className="label">New date</span><input type="date" className="input" min={addDays(today(), minDays)} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></label>
              <label><span className="label">Time</span><select className="input" value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })}>{(s?.slots || [b.time]).map((x) => <option key={x}>{x}</option>)}</select></label>
              <button className="btn-coral" onClick={() => update(b, { date: edit.date, time: edit.time })}>{t("Save change")}</button>
            </div>}
          </li>); })}</ul>}
      </div>
    </Page>
  );
}

/* ---------- Diver account: trips, logbook, photos ---------- */
export function Account() {
  const { backend, guestEmail, setGuestEmail, bookings, logbook, media, put, settings, cart, setCart } = useStore();
  const { t, money } = useI18n();
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [me, setMe] = useState<string | null>(guestEmail);
  useEffect(() => { if (backend?.currentEmail) backend.currentEmail().then((e) => { if (e) { setMe(e); setGuestEmail(e); } }); }, [backend]); // eslint-disable-line
  const signIn = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    if (backend?.signIn) { await backend.signIn(email); setSent(true); } else { setMe(email.toLowerCase()); setGuestEmail(email.toLowerCase()); }
  };
  const signOut = async () => { await backend?.signOut?.(); setMe(null); setGuestEmail(null); };
  const mine = useMemo(() => bookings.filter((b) => me && b.customer.email.toLowerCase() === me.toLowerCase()).sort((a, b) => (a.date < b.date ? 1 : -1)), [bookings, me]);
  const refs = new Set(mine.map((b) => b.ref));
  const diveDays = mine.filter((b) => (b.category === "course" || b.category === "fun") && b.status === "completed");
  const entries: LogEntry[] = [
    ...diveDays.map((b) => ({ id: "auto-" + b.id, email: me!, date: b.date, site: b.serviceName, depth: 0, minutes: 0, verified: true, bookingRef: b.ref })),
    ...logbook.filter((l) => me && l.email.toLowerCase() === me.toLowerCase())
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  const photos = media.filter((m) => m.role === "guest" && ((m.guestEmail && me && m.guestEmail.toLowerCase() === me.toLowerCase()) || (m.bookingRef && refs.has(m.bookingRef))));
  const unlocked = mine.some((b) => b.serviceId === "photos" && (b.payment.status === "paid"));
  const [add, setAdd] = useState<LogEntry | null>(null);

  if (!me) return (
    <Page kicker="My account" a="Your diving," b="all in one place">
      <div className="card -mt-4 grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <p className="font-display text-xl font-black">{t("Sign in")}</p>
          <p className="mt-2 text-ink/70">{backend?.signIn ? "We'll email you a one-tap sign-in link — no password." : "Use the email you booked with."}</p>
          <div className="mt-4 flex gap-2"><input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn-sea" onClick={signIn}>{t("Sign in")}</button></div>
          {sent && <p className="mt-3 font-semibold text-[#0b7a52]">Check your inbox for the sign-in link.</p>}
          {backend?.mode !== "supabase" && <button className="btn mt-4 border-2 border-dashed border-sky/50 text-sm" onClick={() => { setMe(DEMO_GUEST.email); setGuestEmail(DEMO_GUEST.email); }}>View as {DEMO_GUEST.name} (demo)</button>}
        </div>
        <ul className="space-y-3 text-ink/75">{["Your trips and payment status", "A digital logbook — dives with us are stamped automatically", "Your photos and videos from the day", "Quick rebooking"].map((x, i) => <li key={x} className="flex gap-3"><Phase i={i} size={18} />{x}</li>)}</ul>
      </div>
    </Page>
  );

  return (
    <Page kicker="My account" a="Welcome back," b={(mine[0]?.customer.name.split(" ")[0] || me.split("@")[0]) + "!"}>
      <div className="-mt-4 space-y-6">
        <div className="flex justify-end"><button className="btn-ghost" onClick={signOut}><LogOut size={16} /> {t("Sign out")}</button></div>

        <section className="card p-6 sm:p-8">
          <h2 className="mb-4 text-2xl font-black">{t("Your trips")}</h2>
          {mine.length ? <ul className="space-y-2">{mine.map((b, i) => <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-foam p-4"><Phase i={i} size={18} /><span className="flex-1"><b>{b.serviceName}</b><span className="block text-sm text-ink/60">{b.date} · {b.ref} · {money(b.total)}</span></span><span className={`chip ${b.payment.status === "paid" ? "bg-[#1baf7a]/15 text-[#0b6b49]" : "bg-sand"}`}>{b.payment.status}</span></li>)}</ul> : <Empty>No trips yet. <a href="#book" className="font-semibold text-royal">Book your first dive</a>.</Empty>}
        </section>

        <section className="card p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">{t("Your logbook")}</h2><button className="btn-sea" onClick={() => setAdd({ id: uid(), email: me, date: today(), site: "", depth: 12, minutes: 45 })}><Plus size={16} /> {t("Add a dive")}</button></div>
          {entries.length ? <ol className="grid gap-3 sm:grid-cols-2">{entries.map((l, i) => (
            <li key={l.id} className="relative rounded-[24px] rounded-br-[80px] border-2 border-navy/10 p-5">
              <span className="font-display text-sm font-black text-sky">Dive #{entries.length - i}</span>
              <p className="font-display text-lg font-black">{l.site}</p>
              <p className="text-sm text-ink/60">{l.date}{l.depth ? ` · ${l.depth} m` : ""}{l.minutes ? ` · ${l.minutes} min` : ""}{l.buddy ? ` · buddy ${l.buddy}` : ""}</p>
              {l.notes && <p className="hand mt-2 text-[20px] text-ink/70">{l.notes}</p>}
              {l.verified && <Stamp word="LOGGED" animate={false} className="absolute -end-2 -top-3 w-16" />}
            </li>))}</ol> : <Empty>Your dives with us are stamped here automatically. Add your own dives too.</Empty>}
          {add && <div className="mt-5 grid gap-3 rounded-2xl bg-foam p-4 sm:grid-cols-3">
            <input className="input" type="date" value={add.date} onChange={(e) => setAdd({ ...add, date: e.target.value })} />
            <input className="input" placeholder={t("Dive site")} value={add.site} onChange={(e) => setAdd({ ...add, site: e.target.value })} />
            <input className="input" placeholder={t("Buddy")} value={add.buddy || ""} onChange={(e) => setAdd({ ...add, buddy: e.target.value })} />
            <label><span className="label">{t("Max depth (m)")}</span><input className="input" type="number" value={add.depth} onChange={(e) => setAdd({ ...add, depth: +e.target.value })} /></label>
            <label><span className="label">{t("Bottom time (min)")}</span><input className="input" type="number" value={add.minutes} onChange={(e) => setAdd({ ...add, minutes: +e.target.value })} /></label>
            <input className="input self-end" placeholder="Notes" value={add.notes || ""} onChange={(e) => setAdd({ ...add, notes: e.target.value })} />
            <button className="btn-coral sm:col-span-3" onClick={async () => { if (!add.site) return; await put("logbook", add); setAdd(null); }}>Save dive</button>
          </div>}
        </section>

        <section className="card p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">{t("Your photos and videos")}</h2>
            {photos.length > 0 && !unlocked && <button className="btn-coral" onClick={() => { const ref = mine[0]?.ref; if (!cart.some((c) => c.serviceId === "photos")) setCart([...cart, { key: uid(), serviceId: "photos", date: today(), time: "Any time", people: 1, days: 1 }]); try { sessionStorage.setItem("dd:photoRef", ref || ""); } catch { /* */ } go("book"); }}><Camera size={18} /> {t("Unlock all")} · {money(settings.photoPackagePrice)}</button>}</div>
          {photos.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((m) => (
            <figure key={m.id} className="relative aspect-square overflow-hidden rounded-2xl bg-navy">
              <div className={unlocked ? "" : "h-full w-full scale-105 blur-[6px]"}><Visual scene="reef" url={m.url} kind={m.kind} label={m.caption} /></div>
              {!unlocked && <span className="absolute inset-0 grid place-items-center bg-navy/30 text-white"><span className="text-center"><Lock className="mx-auto" /><Mark light gap="#15284B" className="mx-auto mt-2 w-16 opacity-80" /></span></span>}
              {unlocked && <a className="absolute bottom-2 end-2 btn-light text-sm" href={m.url} target="_blank" rel="noreferrer">Open</a>}
            </figure>))}</div> : <Empty>After your dive, our team uploads your photos and clips here.</Empty>}
        </section>
      </div>
    </Page>
  );
}

/* ---------- Blog & dive-site guides ---------- */
function md(text: string) {
  const out: ReactNode[] = []; let list: string[] = [];
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p));
  const flush = () => { if (list.length) { out.push(<ul key={out.length} className="my-4 space-y-2">{list.map((l, i) => <li key={i} className="flex gap-3"><span className="mt-1.5"><Phase i={i} size={12} /></span><span>{inline(l)}</span></li>)}</ul>); list = []; } };
  text.split("\n").forEach((line) => {
    if (line.startsWith("- ")) { list.push(line.slice(2)); return; }
    flush();
    if (line.startsWith("## ")) out.push(<h2 key={out.length} className="mt-8 text-2xl font-black">{line.slice(3)}</h2>);
    else if (line.trim()) out.push(<p key={out.length} className="mt-3 text-[18px] leading-relaxed text-ink/80">{inline(line)}</p>);
  });
  flush(); return out;
}

export function Blog() {
  const { posts } = useStore();
  const { t, lang } = useI18n();
  const list = posts.filter((p) => p.published).sort((a, b) => (a.date < b.date ? 1 : -1));
  useEffect(() => { document.title = "Dahab dive site and trip guides — Dahab Days"; }, []);
  return (
    <Page kicker="Blog" a="Guides" b="and stories">
      <div className="-mt-4 grid gap-6 sm:grid-cols-2">{list.map((p, i) => (
        <button key={p.id} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }} onClick={() => { try { sessionStorage.setItem("dd:post", p.id); } catch { /* */ } go("post"); }} className="card group text-start">
          <div className="m-2 mb-0 aspect-[16/10] overflow-hidden rounded-[22px] rounded-br-[120px]"><Visual scene={p.scene} url={p.cover} label={p.title} className="transition duration-700 group-hover:scale-105" /></div>
          <div className="p-6"><RedTab>{p.category}</RedTab><h2 className="mt-3 text-2xl font-black leading-tight">{lang === "ar" && p.titleAr ? p.titleAr : p.title}</h2><p className="mt-2 text-ink/70">{p.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 font-semibold text-royal">{t("Read guide")} <ArrowRight size={16} className="rtl:rotate-180" /></span></div>
        </button>))}</div>
    </Page>
  );
}

export function PostView() {
  const { posts } = useStore();
  const { t, lang } = useI18n();
  const id = (() => { try { return sessionStorage.getItem("dd:post"); } catch { return null; } })();
  const p: Post | undefined = posts.find((x) => x.id === id) || posts[0];
  useEffect(() => {
    if (!p) return;
    document.title = `${p.title} — Dahab Days`;
    let m = document.querySelector('meta[name="description"]'); if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); } m.setAttribute("content", p.excerpt);
    const ld = document.createElement("script"); ld.type = "application/ld+json"; ld.text = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: p.title, datePublished: p.date, description: p.excerpt, publisher: { "@type": "Organization", name: "Dahab Days Diving Center" } }); document.head.appendChild(ld);
    return () => { ld.remove(); };
  }, [p]);
  if (!p) return null;
  return (
    <article className="pb-20">
      <section className="relative isolate flex min-h-[56svh] items-end overflow-hidden bg-navy pt-[68px] text-white">
        <div className="absolute inset-0 -z-10"><Visual scene={p.scene} url={p.cover} animate label={p.title} /><div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" /></div>
        <div className="wrap max-w-3xl pb-10"><RedTab>{p.category}</RedTab><h1 className="mt-4 text-[36px] font-black leading-tight sm:text-[52px]">{lang === "ar" && p.titleAr ? p.titleAr : p.title}</h1><p className="mt-3 text-white/80">{p.date}</p></div>
      </section>
      <div className="wrap max-w-3xl pt-8">
        <p className="text-[20px] font-medium text-ink/80">{p.excerpt}</p>
        {md(p.body)}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-sand p-6"><HandNote>Ready to see it for yourself?</HandNote><a href="#book" className="btn-coral">{t("Book now")}</a></div>
        <a href="#blog" className="btn-ghost mt-6">{t("All guides")}</a>
      </div>
    </article>
  );
}
