/* Dashboard card: load / remove the Mohamed Attar showcase and jump to every place it appears */
import { useState } from "react";
import { ExternalLink, Sparkles, Trash2 } from "lucide-react";
import { Phase } from "../components/brand";
import { buildShowcase, DEMO_GUEST } from "../lib/showcase";
import { go, useStore } from "../lib/store";
import type { Collection } from "../lib/backend";

export function ShowcaseCard({ openTab }: { openTab: (t: any) => void }) {
  const store = useStore();
  const { bookings, put, remove, setGuestEmail } = store;
  const [busy, setBusy] = useState(false);
  const loaded = bookings.some((b) => (b as any).showcase);

  const load = async () => {
    setBusy(true);
    const data = buildShowcase(store.services, store.settings);
    for (const [col, docs] of Object.entries(data) as [Collection, { id: string }[]][]) {
      for (const d of docs) if (col !== "staff" || !store.staff.some((s) => s.id === d.id)) await put(col, d);
    }
    setBusy(false);
  };
  const clear = async () => {
    setBusy(true);
    const cols: Collection[] = ["bookings", "consents", "logbook", "media", "inventory", "expenses", "cashcloses", "promos", "staff", "customers"];
    for (const c of cols) for (const d of (store as any)[c] as any[]) if (d.showcase || String(d.id).startsWith("sc-") || d.id === DEMO_GUEST.email) await remove(c, d.id);
    setBusy(false);
  };
  const guest = (r: "account" | "manage") => { setGuestEmail(DEMO_GUEST.email); try { sessionStorage.setItem("dd:demoRef", "DD-ATTR4"); } catch { /* */ } go(r); };

  const tour: [string, string, () => void][] = [
    ["Customers", "his history, total spent, tags and notes", () => openTab("customers")],
    ["Bookings", "deposit, balance due, refund, abandoned checkout, WhatsApp", () => openTab("bookings")],
    ["Schedule", "his Advanced course and Blue Hole day this week", () => openTab("schedule")],
    ["Daily roster", "today's shore dive with his gear sizes", () => openTab("roster")],
    ["Consent forms", "his signed, countersigned PDF", () => openTab("consents")],
    ["Cash close", "today's cash from his dive and rental", () => openTab("cash")],
    ["Finance", "his payments, fees and refund in the numbers", () => openTab("finance")],
    ["Team and roles", "give someone access, edit what each role can see", () => openTab("team")],
    ["Equipment", "the wetsuit and BCD he has out today", () => openTab("inventory")],
    ["Promo codes", "ATTAR10, used on his Open Water trip", () => openTab("promos")],
    ["His account", "trips, stamped logbook, locked photos", () => guest("account")],
    ["Manage booking", "reschedule or cancel DD-ATTR4", () => guest("manage")]
  ];
  return (
    <section className="rounded-3xl bg-navy p-5 text-white shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="flex items-center gap-2 font-display text-lg font-black"><Sparkles size={18} className="text-sun" /> Showcase guest: {DEMO_GUEST.name}</p><p className="text-sm text-white/70">One demo client whose story runs through every feature. All details are fake ({DEMO_GUEST.email}).</p></div>
        {loaded ? <button className="btn border-2 border-white/25 text-white hover:bg-white/10" disabled={busy} onClick={clear}><Trash2 size={16} /> {busy ? "Removing…" : "Remove showcase"}</button>
          : <button className="btn-coral" disabled={busy} onClick={load}><Sparkles size={16} /> {busy ? "Loading…" : "Load showcase"}</button>}
      </div>
      {loaded && <ol className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{tour.map(([t, d, f], i) => (
        <li key={t}><button onClick={f} className="flex w-full items-start gap-3 rounded-2xl bg-white/10 p-3 text-start transition hover:bg-white/20"><span className="mt-0.5 rounded-full bg-white p-1"><Phase i={i} size={14} /></span><span><b className="flex items-center gap-1.5">{t}{i >= 10 && <ExternalLink size={13} />}</b><span className="text-sm text-white/70">{d}</span></span></button></li>
      ))}</ol>}
    </section>
  );
}
