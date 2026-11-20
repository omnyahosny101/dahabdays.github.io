import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarPlus, CreditCard, Download, Lock, MessageCircle, Minus, Plus, Smartphone, Store as StoreIcon, Tag, Trash2, UserPlus, Wallet } from "lucide-react";
import ConsentForm, { blankConsent, consentProblems, finalizeConsent, type ConsentDraft } from "../components/ConsentForm";
import { Sheet, Visual } from "../components/ui";
import { HandNote, Phase, PhaseLoader, PhaseSteps, RedTab, Stamp } from "../components/brand";
import { CATEGORY_LABEL } from "../lib/catalog";
import { consentPdf, pdfName } from "../lib/pdf";
import { bookingRef, egp, go, today, uid, useStore, type CartItem } from "../lib/store";
import { useI18n } from "../lib/i18n";
import { track } from "../lib/analytics";
import type { Booking, Consent, Promo, Service } from "../lib/types";
import { DEMO_GUEST, drawSignature } from "../lib/showcase";
import { MEDICAL_QUESTIONS, ACKNOWLEDGEMENTS } from "../lib/catalog";
import { Sparkles } from "lucide-react";

const gatewayFee = (amount: number, pct: number, fixed: number) => (amount > 0 ? Math.round((amount * pct) / 100 + fixed) : 0);
const lineTotal = (s: Service, it: CartItem) => s.price * it.people * (s.category === "rental" ? it.days : 1);

/** Keep the visitor's own order in this tab so the confirmation page works even when the database hides bookings from the public. */
function remember(bs: Booking[], consents?: Consent[]) {
  try { sessionStorage.setItem("dd:last", bs[0]?.orderId || ""); sessionStorage.setItem("dd:lastB", JSON.stringify(bs)); if (consents) sessionStorage.setItem("dd:lastC", JSON.stringify(consents)); } catch { /* */ }
}
const recall = <T,>(k: string): T | null => { try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch { return null; } };

export function validPromo(promos: Promo[], code: string): Promo | null {
  const p = promos.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!p || !p.active) return null;
  if (p.expires && p.expires < today()) return null;
  if (p.maxUses && p.used >= p.maxUses) return null;
  return p;
}

export default function Book() {
  const { services, selected, settings, backend, put, cart, setCart, promos, seatsTaken } = useStore();
  const { t, money, sv } = useI18n();
  const active = services.filter((s) => s.active);
  const bookable = active.filter((s) => s.category !== "addon");
  const addons = active.filter((s) => s.category === "addon");
  const svc = (id: string) => services.find((s) => s.id === id)!;

  // item editor
  const [sid, setSid] = useState(selected && bookable.some((s) => s.id === selected) ? selected : bookable.find((s) => s.id === "owd")?.id || bookable[0]?.id);
  const ed = bookable.find((s) => s.id === sid)!;
  const [date, setDate] = useState(() => { try { return sessionStorage.getItem("dd:date") || today(); } catch { return today(); } });
  const [time, setTime] = useState(ed?.slots[0] || "09:00");
  const [people, setPeople] = useState(1);
  const [days, setDays] = useState(1);
  const [remote, setRemote] = useState<Record<string, number> | null>(null);
  useEffect(() => { if (ed && !ed.slots.includes(time)) setTime(ed.slots[0]); }, [ed, time]);
  useEffect(() => { setRemote(null); if (ed && backend?.seats) backend.seats(ed.id, date).then(setRemote).catch(() => {}); }, [ed, date, backend]);
  const taken = (slot: string) => (remote ? remote[slot] || 0 : seatsTaken(ed?.id, date)[slot] || 0) + cart.filter((c) => c.serviceId === ed?.id && c.date === date && c.time === slot).reduce((a, c) => a + c.people, 0);
  const left = (slot: string) => Math.max(0, (ed?.capacity || 0) - taken(slot));

  const [cust, setCust] = useState({ name: "", email: "", phone: "", country: "" });
  const [gear, setGear] = useState({ wetsuit: "", bcd: "", fins: "", weight: "" });
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState<ConsentDraft>(blankConsent(""));
  const [plan, setPlan] = useState<"full" | "deposit" | "later">("full");
  const [code, setCode] = useState(""); const [promo, setPromo] = useState<Promo | null>(null); const [promoMsg, setPromoMsg] = useState("");
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<Booking[] | null>(null);

  const items = cart.filter((c) => services.some((s) => s.id === c.serviceId));
  const needsConsent = items.some((c) => svc(c.serviceId).requiresConsent);
  const needsGear = items.some((c) => ["course", "fun", "rental"].includes(svc(c.serviceId).category));
  const subtotal = items.reduce((a, c) => a + lineTotal(svc(c.serviceId), c), 0);
  const discount = promo ? Math.min(subtotal, promo.kind === "pct" ? Math.round((subtotal * promo.value) / 100) : promo.value) : 0;
  const total = subtotal - discount;
  const dueNow = plan === "full" ? total : plan === "deposit" ? Math.round((total * settings.depositPct) / 100) : 0;
  const steps = [t("Your trip"), t("Your details"), ...(needsConsent ? [t("Medical form")] : []), t("Review & pay")];
  const name = ["trip", "details", ...(needsConsent ? ["medical"] : []), "review"][step];
  useEffect(() => { if (name === "review") track("InitiateCheckout", { value: total }); }, [name, total]);

  const addItem = () => {
    if (!ed) return false;
    if (!date || date < today()) { setErr("Choose a date from today onwards."); return false; }
    if (left(time) < people) { setErr(`Only ${left(time)} place${left(time) === 1 ? "" : "s"} left at ${time}. Pick another time or date.`); return false; }
    setCart([...cart, { key: uid(), serviceId: ed.id, date, time, people, days }]); setErr("");
    track("AddToCart", { id: ed.id, name: ed.name, value: lineTotal(ed, { key: "", serviceId: ed.id, date, time, people, days }) });
    return true;
  };
  const toggleAddon = (a: Service) => {
    const has = cart.find((c) => c.serviceId === a.id);
    if (has) setCart(cart.filter((c) => c !== has));
    else setCart([...cart, { key: uid(), serviceId: a.id, date: items[0]?.date || date, time: a.slots[0], people: a.unit.includes("person") ? Math.max(1, ...items.map((i) => i.people)) : 1, days: 1 }]);
  };
  const applyPromo = async () => {
    const p = backend?.checkPromo ? ((await backend.checkPromo(code.trim().toUpperCase())) as Promo | null) : validPromo(promos, code);
    setPromo(p); setPromoMsg(p ? `${p.code}: ${p.kind === "pct" ? p.value + "%" : egp(p.value)} off` : "That code isn't valid.");
  };

  const next = () => {
    setErr("");
    if (name === "trip") {
      if (!items.length && !addItem()) return;
      if (!items.length) { /* item just added */ }
    }
    if (name === "details") {
      if (!cust.name.trim() || !/^\S+@\S+\.\S+$/.test(cust.email) || cust.phone.replace(/\D/g, "").length < 7) return setErr("Please add your name, a valid email and a phone number.");
      const first = [...items].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
      const last = [...items].sort((a, b) => (a.date > b.date ? -1 : 1))[0];
      setConsent((c) => ({ ...c, program: items.map((i) => `${svc(i.serviceId).name} ${i.date}`).join(" · "), fullName: c.fullName || cust.name, email: c.email || cust.email, phone: c.phone || cust.phone, nationality: c.nationality || cust.country, arrival: c.arrival || first?.date || "", departure: c.departure || last?.date || "" }));
    }
    if (name === "medical") { const p = consentProblems(consent); if (p.length) return setErr("Still missing: " + p.join(", ") + "."); }
    setStep((s) => s + 1); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const orderId = uid(), ref = bookingRef(), now = new Date().toISOString();
      const bs: Booking[] = items.map((it) => {
        const s = svc(it.serviceId); const line = lineTotal(s, it);
        const share = subtotal ? line / subtotal : 0; const d = Math.round(discount * share); const tot = line - d;
        return {
          id: uid(), ref, orderId, serviceId: s.id, serviceName: s.name, category: s.category, date: it.date, time: it.time, people: it.people,
          ...(s.category === "rental" ? { days: it.days } : {}), total: tot, discount: d || undefined, promo: promo?.code,
          customer: cust, notes, gear: ["course", "fun", "rental"].includes(s.category) ? gear : undefined,
          status: plan === "later" ? "confirmed" : "pending",
          payment: { method: plan === "later" ? "cash" : "paymob", status: "unpaid", plan, dueNow: Math.round(dueNow * (total ? tot / total : 0)), amountPaid: 0, history: [] },
          createdAt: now
        } as Booking;
      });
      let signed: Consent[] = [];
      if (needsConsent) {
        const first = bs.find((b) => svc(b.serviceId).requiresConsent)!;
        const c = finalizeConsent(consent, settings, { bookingId: first.id, bookingRef: ref });
        await put("consents", c); signed = [c];
        backend?.storeConsentPdf?.(c.id, consentPdf(c, settings)).catch(() => {});
        bs.forEach((b) => { if (svc(b.serviceId).requiresConsent) b.consentId = c.id; });
      }
      for (const b of bs) await put("bookings", b);
      if (promo && !backend?.checkPromo) await put("promos", { ...promo, used: promo.used + 1 }); // live: the payment function counts the use
      remember(bs, signed); setCart([]);
      if (plan !== "later") {
        if (backend?.startPayment) { location.href = await backend.startPayment(orderId); return; }
        setCheckout(bs); // preview: simulated Paymob checkout
      } else { backend?.notify?.(orderId).catch(() => {}); go("thanks"); }
    } catch (e: any) { setErr("Something went wrong saving your booking: " + (e?.message || e)); }
    setBusy(false);
  };

  const confirmDemoPayment = async () => {
    if (!checkout) return;
    const paid = checkout.map((b) => {
      const amt = b.payment.dueNow || 0; const full = amt >= b.total;
      return { ...b, status: "confirmed", payment: { ...b.payment, status: full ? "paid" : "deposit", paidAt: new Date().toISOString(), txnId: "TEST-" + Math.floor(Math.random() * 1e8), amountPaid: amt, fee: gatewayFee(amt, settings.gatewayFeePct, settings.gatewayFixed), history: [{ at: new Date().toISOString(), amount: amt, method: "paymob" }] } } as Booking;
    });
    for (const b of paid) await put("bookings", b);
    remember(paid); setCheckout(null); go("thanks");
  };

  if (!ed) return <div className="wrap pt-32">No programs are available right now.</div>;
  const hero = items[0] ? svc(items[0].serviceId) : ed;

  return (
    <div className="bg-foam pb-20 pt-[68px]">
      <div className="relative h-48 overflow-hidden sm:h-64"><Visual scene={hero.scene} url={hero.mediaUrl} animate label={hero.name} /><div className="absolute inset-0 bg-gradient-to-t from-navy/85 to-transparent" />
        <div className="wrap absolute inset-x-0 bottom-8 text-white"><RedTab className="mb-3">{t("Your trip")}</RedTab><h1 className="text-[30px] font-black leading-tight sm:text-[46px]">{items.length ? `${items.length} × ${sv(hero).name}${items.length > 1 ? " +" : ""}` : sv(ed).name}</h1></div>
      </div>
      <div className="wrap -mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card p-5 sm:p-8">
          <div className="mb-8"><PhaseSteps steps={steps} active={step} /></div>

          {name === "trip" && <div className="space-y-8">
            {items.length > 0 && <ul className="space-y-2">
              {items.map((it, i) => { const s = svc(it.serviceId); return (
                <li key={it.key} className="flex flex-wrap items-center gap-3 rounded-2xl bg-foam p-3">
                  <Phase i={i} size={18} /><span className="min-w-[10rem] flex-1"><b>{sv(s).name}</b><span className="block text-sm text-ink/60">{it.date} · {it.time} · {it.people} {s.category === "rental" ? `× ${it.days}d` : t("People").toLowerCase()}</span></span>
                  <span className="price font-bold">{money(lineTotal(s, it))}</span>
                  <button className="btn px-2 text-ink/50 hover:text-red" aria-label="Remove" onClick={() => setCart(cart.filter((c) => c.key !== it.key))}><Trash2 size={16} /></button>
                </li>); })}
            </ul>}

            <div className="space-y-5 rounded-[24px] border-2 border-navy/10 p-4 sm:p-5">
              <p className="font-display font-black">{items.length ? t("Add another activity") : t("Program")}</p>
              <select className="input" value={sid} onChange={(e) => setSid(e.target.value)}>
                {(["course", "fun", "tour", "rental"] as const).map((c) => <optgroup key={c} label={t(CATEGORY_LABEL[c])}>{bookable.filter((s) => s.category === c).map((s) => <option key={s.id} value={s.id}>{sv(s).name} — {money(s.price)}</option>)}</optgroup>)}
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="label">{t("Start date")}</span><input type="date" className="input" min={today()} value={date} onChange={(e) => setDate(e.target.value)} /></label>
                <div><span className="label">{t("Start time")}</span><div className="flex flex-wrap gap-2">{ed.slots.map((s) => { const l = left(s); return (
                  <button key={s} type="button" disabled={l === 0} onClick={() => setTime(s)} className={`btn flex-col gap-0 border-2 py-1 leading-tight ${s === time ? "border-navy bg-navy text-white" : "border-navy/10 bg-white"}`}>
                    <span>{s}</span><span className={`text-[11px] font-semibold ${s === time ? "text-sun" : l <= 2 ? "text-red" : "text-ink/50"}`}>{l === 0 ? t("Full") : `${l} ${t("seats left")}`}</span>
                  </button>); })}</div></div>
                <Stepper label={ed.category === "rental" ? t("Quantity") : t("People")} v={people} set={setPeople} max={Math.max(1, left(time))} />
                {ed.category === "rental" && <Stepper label={t("Days")} v={days} set={setDays} max={30} />}
              </div>
              <p className="text-ink/70">{sv(ed).short} {ed.minAge ? `· ${t("Age")} ${ed.minAge}+` : ""}</p>
              <button className="btn-sea" onClick={addItem}><Plus size={18} /> {t("Add to trip")} · {money(lineTotal(ed, { key: "", serviceId: ed.id, date, time, people, days }))}</button>
            </div>

            {items.length > 0 && addons.length > 0 && <div>
              <p className="mb-3 font-display font-black">{t("Extras")}</p>
              <div className="grid gap-3 sm:grid-cols-2">{addons.map((a) => { const on = cart.some((c) => c.serviceId === a.id); return (
                <label key={a.id} className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition ${on ? "border-sky bg-sky/5" : "border-navy/10"}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-[#15284B]" checked={on} onChange={() => toggleAddon(a)} />
                  <span><b className="block">{sv(a).name}</b><span className="text-sm text-ink/60">{sv(a).short}</span><span className="mt-1 block text-sm font-bold">{money(a.price)} <span className="font-normal text-ink/50">{a.unit}</span></span></span>
                </label>); })}</div>
            </div>}
          </div>}

          {(name === "details" || name === "medical") && backend?.mode !== "supabase" && <button type="button" className="btn mb-5 border-2 border-dashed border-sky/50 text-sm text-navy hover:bg-foam" onClick={() => {
            const g = DEMO_GUEST;
            if (name === "details") { setCust({ name: g.name, email: g.email, phone: g.phone, country: g.country }); setGear({ wetsuit: "M", bcd: "M", fins: "42", weight: "78" }); setNotes("Showcase booking (demo)"); }
            else setConsent({ ...consent, fullName: g.name, dob: g.dob, nationality: g.nationality, idNumber: g.idNumber, phone: g.phone, email: g.email, emergencyName: g.emergencyName, emergencyPhone: g.emergencyPhone, accommodation: g.accommodation, arrival: consent.arrival || today(), departure: consent.departure || today(), certLevel: "Open Water", lastDive: "With Dahab Days", answers: Object.fromEntries(MEDICAL_QUESTIONS.map((q) => [q.id, "no"])), acks: Object.fromEntries(ACKNOWLEDGEMENTS.map((a) => [a.id, true])), signature: drawSignature("M. Attar") });
          }}><Sparkles size={16} className="text-sun" /> Fill as {DEMO_GUEST.name} (demo)</button>}

          {name === "details" && <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">{t("Full name")}</span><input className="input" autoComplete="name" value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} /></label>
            <label className="block"><span className="label">{t("Email")}</span><input type="email" className="input" autoComplete="email" value={cust.email} onChange={(e) => setCust({ ...cust, email: e.target.value })} /></label>
            <label className="block"><span className="label">{t("Phone (WhatsApp)")}</span><input type="tel" className="input" autoComplete="tel" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} /></label>
            <label className="block"><span className="label">{t("Country")}</span><input className="input" autoComplete="country-name" value={cust.country} onChange={(e) => setCust({ ...cust, country: e.target.value })} /></label>
            {needsGear && <fieldset className="grid grid-cols-2 gap-3 rounded-2xl bg-foam p-4 sm:col-span-2 sm:grid-cols-4">
              <legend className="label px-1">{t("Gear sizes")}</legend>
              <select className="input" value={gear.wetsuit} onChange={(e) => setGear({ ...gear, wetsuit: e.target.value })} aria-label={t("Wetsuit")}><option value="">{t("Wetsuit")}</option>{["XS", "S", "M", "L", "XL", "XXL"].map((x) => <option key={x}>{x}</option>)}</select>
              <select className="input" value={gear.bcd} onChange={(e) => setGear({ ...gear, bcd: e.target.value })} aria-label={t("BCD")}><option value="">{t("BCD")}</option>{["XS", "S", "M", "L", "XL"].map((x) => <option key={x}>{x}</option>)}</select>
              <input className="input" placeholder={t("Fins (shoe size)")} value={gear.fins} onChange={(e) => setGear({ ...gear, fins: e.target.value })} />
              <input className="input" placeholder={t("Weight (kg)")} inputMode="numeric" value={gear.weight} onChange={(e) => setGear({ ...gear, weight: e.target.value })} />
            </fieldset>}
            <label className="block sm:col-span-2"><span className="label">{t("Notes (optional)")}</span><textarea rows={3} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          </div>}

          {name === "medical" && <ConsentForm d={consent} set={setConsent} />}

          {name === "review" && <div className="space-y-6">
            <div className="rounded-2xl bg-foam p-5"><p className="font-semibold">{cust.name} · {cust.email}</p><p className="text-sm text-ink/60">{needsConsent ? (consent.signature ? "Medical form signed ✓" : "Medical form missing") : "No medical form needed"}</p></div>
            <div className="flex flex-wrap gap-2"><label className="relative min-w-[200px] flex-1"><Tag size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-ink/40" /><input className="input ps-10 uppercase" placeholder={t("Promo code")} value={code} onChange={(e) => setCode(e.target.value)} /></label><button className="btn-ghost" onClick={applyPromo}>{t("Apply")}</button></div>
            {promoMsg && <p className={promo ? "font-semibold text-[#0b7a52]" : "text-red"}>{promoMsg}</p>}
            <fieldset><legend className="label">{t("Payment")}</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {([["full", t("Pay in full online"), "Card, Meeza or wallet via Paymob", CreditCard], ["deposit", `${t("Pay a deposit")} (${settings.depositPct}%)`, "Rest on arrival", Wallet], ["later", t("Pay at the center"), "Reserve now", StoreIcon]] as const).map(([v, tt, d, I]) => (
                  <label key={v} className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 ${plan === v ? "border-navy bg-navy/5" : "border-navy/10"}`}>
                    <input type="radio" name="plan" className="mt-1 accent-[#15284B]" checked={plan === v} onChange={() => setPlan(v)} />
                    <span><span className="flex items-center gap-2 font-semibold"><I size={18} />{tt}</span><span className="text-sm text-ink/60">{d}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="flex items-center gap-2 text-sm text-ink/60"><Lock size={15} /> Card details are entered on Paymob's secure page. {t("Prices are charged in Egyptian pounds.")}</p>
          </div>}

          {err && <p className="mt-6 rounded-2xl bg-red/10 p-4 text-ink" role="alert">{err}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
            {step > 0 ? <button className="btn-ghost" onClick={() => { setErr(""); setStep(step - 1); }}><ArrowLeft size={18} className="rtl:rotate-180" /> {t("Back")}</button> : <span />}
            {name === "review"
              ? <button className="btn-coral px-8" disabled={busy || !items.length} onClick={submit}>{busy ? <PhaseLoader label="Saving" /> : plan === "later" ? t("Confirm booking") : `Pay ${egp(dueNow)}`}</button>
              : <button className="btn-sea px-8" onClick={next}>{t("Continue")} <ArrowRight size={18} className="rtl:rotate-180" /></button>}
          </div>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <p className="font-display font-black">{t("Your trip")}</p>
          {items.length ? <ul className="mt-3 space-y-2 text-sm">{items.map((it) => { const s = svc(it.serviceId); return <li key={it.key} className="flex justify-between gap-3"><span>{sv(s).name}<span className="block text-ink/50">{it.date}</span></span><span className="price">{money(lineTotal(s, it))}</span></li>; })}</ul> : <p className="mt-2 text-sm text-ink/60">Nothing added yet.</p>}
          <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
            <div className="flex justify-between"><dt>{t("Subtotal")}</dt><dd className="price">{money(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-[#0b7a52]"><dt>{t("Discount")} ({promo?.code})</dt><dd className="price">−{money(discount)}</dd></div>}
            <div className="flex items-end justify-between pt-2"><dt className="font-semibold">{t("Total")}</dt><dd className="price font-display text-3xl font-black text-navy">{money(total)}</dd></div>
            {name === "review" && plan !== "full" && <><div className="flex justify-between"><dt>{t("Due now")}</dt><dd className="price font-bold">{money(dueNow)}</dd></div><div className="flex justify-between text-ink/60"><dt>{t("Due on arrival")}</dt><dd className="price">{money(total - dueNow)}</dd></div></>}
          </dl>
          <p className="mt-6"><HandNote>{t("No hidden extras — gear included.")}</HandNote></p>
          <a href={"https://wa.me/" + settings.whatsapp} target="_blank" rel="noreferrer" className="btn-ghost mt-6 w-full"><MessageCircle size={18} /> {t("Questions? WhatsApp us")}</a>
        </aside>
      </div>

      <Sheet open={!!checkout} onClose={() => setCheckout(null)}>
        {checkout && <div className="p-6 sm:p-8">
          <p className="chip bg-sand text-ink">Preview · test mode, no real charge</p>
          <h3 className="mt-4 text-2xl font-black">Paymob secure checkout</h3>
          <p className="mt-1 text-ink/60">{checkout[0].ref} · {checkout.length} item{checkout.length > 1 ? "s" : ""}</p>
          <div className="mt-6 grid gap-3">
            <input className="input" placeholder="Card number" defaultValue="5123 4567 8901 2346" inputMode="numeric" />
            <div className="grid grid-cols-2 gap-3"><input className="input" placeholder="MM/YY" defaultValue="12/30" /><input className="input" placeholder="CVV" defaultValue="123" /></div>
            <p className="flex items-center gap-2 text-sm text-ink/55"><Smartphone size={15} /> Wallets appear here when enabled in your Paymob account.</p>
          </div>
          <button className="btn-coral mt-6 w-full" onClick={confirmDemoPayment}>Pay {egp(checkout.reduce((a, b) => a + (b.payment.dueNow || 0), 0))}</button>
          <p className="mt-3 text-center text-xs text-ink/50">On the live site this step is Paymob's own hosted page.</p>
        </div>}
      </Sheet>
    </div>
  );
}

function Stepper({ label, v, set, max }: { label: string; v: number; set: (n: number) => void; max: number }) {
  return <div><span className="label">{label}</span><div className="flex items-center gap-3"><button type="button" className="btn-ghost w-12 px-0" onClick={() => set(Math.max(1, v - 1))} aria-label={"Fewer " + label}><Minus size={16} /></button><span className="w-8 text-center text-xl font-bold tabular-nums">{v}</span><button type="button" className="btn-ghost w-12 px-0" onClick={() => set(Math.min(max, v + 1))} aria-label={"More " + label}><Plus size={16} /></button><span className="text-sm text-ink/50">max {max}</span></div></div>;
}

/* ---------- calendar ---------- */
const stamp = (date: string, time: string, addH = 0) => { const [h, m] = /^\d\d:\d\d$/.test(time) ? time.split(":").map(Number) : [9, 0]; const d = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`); d.setHours(d.getHours() + addH); return d.toISOString().replace(/[-:]/g, "").slice(0, 15); };
export const gcalUrl = (b: Booking, place: string) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(b.serviceName + " — Dahab Days")}&dates=${stamp(b.date, b.time)}/${stamp(b.date, b.time, 4)}&ctz=Africa/Cairo&location=${encodeURIComponent(place)}&details=${encodeURIComponent(`Booking ${b.ref}. Meet at the center 15 minutes early.`)}`;
export const ics = (bs: Booking[], place: string) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dahab Days//Booking//EN",
  ...bs.flatMap((b) => ["BEGIN:VEVENT", `UID:${b.id}@dahabdays`, `DTSTAMP:${stamp(today(), "00:00")}`, `DTSTART;TZID=Africa/Cairo:${stamp(b.date, b.time)}`, `DTEND;TZID=Africa/Cairo:${stamp(b.date, b.time, 4)}`, `SUMMARY:${b.serviceName} — Dahab Days`, `LOCATION:${place}`, `DESCRIPTION:Booking ${b.ref}`, "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Dive day tomorrow!", "END:VALARM", "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");

/* ---------- Confirmation ---------- */
export function Thanks() {
  const { bookings, consents, settings, backend, put, reload } = useStore();
  const { t, money } = useI18n();
  const [extra, setExtra] = useState<ConsentDraft | null>(null);
  const [msg, setMsg] = useState("");
  const orderId = useMemo(() => { try { return sessionStorage.getItem("dd:last"); } catch { return null; } }, []);
  const paidParam = new URLSearchParams(location.search).get("success");
  useEffect(() => { if (paidParam) setTimeout(reload, 2500); }, [paidParam, reload]);
  const fromStore = bookings.filter((b) => b.orderId && b.orderId === orderId);
  const bs: Booking[] = fromStore.length ? fromStore : recall<Booking[]>("dd:lastB") || [];
  const b = bs[0];
  const [local, setLocal] = useState<Consent[]>(() => recall<Consent[]>("dd:lastC") || []);
  const mine = [...consents.filter((c) => c.bookingRef === b?.ref), ...local.filter((l) => !consents.some((c) => c.id === l.id))];
  const paid = bs.some((x) => x.payment.status === "paid") || paidParam === "true";
  const dep = bs.some((x) => x.payment.status === "deposit");
  useEffect(() => { if (paid || dep) track("Purchase", { value: bs.reduce((a, x) => a + (x.payment.amountPaid || 0), 0), ref: b?.ref }); }, [paid, dep]); // eslint-disable-line
  const place = `${settings.centerName}, ${settings.address}`;
  const download = async (c: Consent) => { const ok = await backend?.saveFile(pdfName(c), consentPdf(c, settings)); if (!ok) setMsg("Downloads aren't available in this view. The signed form is saved in the dashboard."); };
  const saveIcs = async () => { const ok = await backend?.saveFile(`DahabDays-${b.ref}.ics`, new Blob([ics(bs, place)], { type: "text/calendar" })); if (!ok) setMsg("Calendar files can't be downloaded in this preview — use the Google Calendar buttons."); };
  const saveExtra = async () => {
    if (!extra || !b) return;
    const p = consentProblems(extra); if (p.length) return setMsg("Still missing: " + p.join(", ") + ".");
    const c = finalizeConsent(extra, settings, { bookingId: b.id, bookingRef: b.ref });
    await put("consents", c); const all = [...local, c]; setLocal(all); remember(bs, all); setExtra(null); setMsg("Form signed and saved.");
  };
  const people = Math.max(0, ...bs.filter((x) => x.consentId).map((x) => x.people));
  const wa = b ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hi Dahab Days! It's ${b.customer.name}. My booking ${b.ref}: ${bs.map((x) => `${x.serviceName} on ${x.date} at ${x.time}`).join("; ")}.`)}` : "";
  return (
    <div className="bg-foam pb-20 pt-28">
      <div className="wrap max-w-3xl">
        <div className="card p-6 text-center sm:p-10">
          <Stamp word={paid ? "PAID" : dep ? "DEPOSIT" : "BOOKED"} className="mx-auto w-36" />
          <h1 className="mt-4 text-[32px] leading-tight sm:text-[40px]"><span className="font-black">{t("You're booked,")}</span> <span className="font-black text-red">{t("welcome to the family")}</span></h1>
          {b ? <p className="mt-2 text-ink/70">{t("Booking reference")} <b className="font-display text-navy">{b.ref}</b> · {b.customer.email}</p> : <p className="mt-2 text-ink/70">We'll confirm your booking by email and WhatsApp.</p>}
          {bs.length > 0 && <ul className="mt-8 space-y-2 text-start">{bs.map((x, i) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-foam p-4">
              <Phase i={i} size={18} /><span className="min-w-[10rem] flex-1"><b>{x.serviceName}</b><span className="block text-sm text-ink/60">{x.date} · {x.time} · {money(x.total)}{balanceLabel(x)}</span></span>
              {x.category !== "addon" && <a className="btn-ghost text-sm" target="_blank" rel="noreferrer" href={gcalUrl(x, place)}><CalendarPlus size={16} /> {t("Add to Google Calendar")}</a>}
            </li>))}</ul>}
          {bs.length > 0 && <button className="btn mt-3 text-sm text-royal hover:bg-royal/5" onClick={saveIcs}><Download size={16} /> {t("Download calendar file")}</button>}
          {mine.length > 0 && <div className="mt-8 space-y-2 text-start">
            <p className="font-semibold">Signed medical forms</p>
            {mine.map((c) => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-foam p-4"><span>{c.fullName}{c.needsClearance && <span className="chip ms-2 bg-red/10 text-red">Doctor's note needed</span>}</span><button className="btn-ghost" onClick={() => download(c)}><Download size={16} /> PDF</button></div>)}
          </div>}
          {b && people > mine.length && <button className="btn-sea mt-6" onClick={() => setExtra(blankConsent(`${b.serviceName} · ${b.date} ${b.time}`))}><UserPlus size={18} /> Sign for another participant ({mine.length}/{people})</button>}
          {msg && <p className="mt-4 text-ink/70">{msg}</p>}
          <p className="mt-6"><HandNote>We'll message you on WhatsApp the day before.</HandNote></p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {b && <a className="btn-coral" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={18} /> {t("Send us your booking on WhatsApp")}</a>}
            <a className="btn-ghost" href="#manage">{t("Manage booking")}</a><a className="btn-ghost" href="#home">{t("Back to home")}</a>
          </div>
        </div>
      </div>
      <Sheet wide open={!!extra} onClose={() => setExtra(null)}>{extra && <div className="p-6 sm:p-8"><h3 className="mb-6 text-2xl font-black">Medical form for another participant</h3><ConsentForm d={extra} set={setExtra} /><button className="btn-coral mt-8 w-full" onClick={saveExtra}>Sign and save</button>{msg && <p className="mt-3 text-red">{msg}</p>}</div>}</Sheet>
    </div>
  );
}
const balanceLabel = (b: Booking) => (b.payment.status === "deposit" ? ` · deposit paid, ${egp(b.total - (b.payment.amountPaid || 0))} on arrival` : b.payment.status === "unpaid" && b.payment.method === "cash" ? " · pay at the center" : "");
