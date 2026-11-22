/**
 * Showcase guest: "Mohamed Attar" — one demo client whose story touches every feature.
 * All personal details are clearly fake (TEST ID, example.com email). Every record is tagged
 * `showcase: true` so the whole story can be removed in one click from the dashboard.
 */
import { ACKNOWLEDGEMENTS, MEDICAL_QUESTIONS } from "./catalog";
import { STOCK } from "./stock";
import { addDays, today } from "./store";
import type { Booking, CashClose, Consent, CustomerNote, Expense, InventoryItem, LogEntry, MediaItem, Promo, Service, Settings, Staff } from "./types";

export const DEMO_GUEST = {
  name: "Mohamed Attar", email: "mohamed.attar@example.com", phone: "+20 100 000 0000", country: "Egypt",
  dob: "1994-03-12", nationality: "Egyptian", idNumber: "TEST-ID-0000", accommodation: "Hotel in Dahab (demo)",
  emergencyName: "Family contact (demo)", emergencyPhone: "+20 100 000 0001"
};
const customer = { name: DEMO_GUEST.name, email: DEMO_GUEST.email, phone: DEMO_GUEST.phone, country: DEMO_GUEST.country };

/** A hand-drawn-looking signature, rendered to PNG in the browser */
export function drawSignature(text = "M. Attar"): string {
  try {
    const c = document.createElement("canvas"); c.width = 520; c.height = 160; const x = c.getContext("2d")!;
    x.strokeStyle = "#15284B"; x.fillStyle = "#15284B"; x.lineWidth = 2.6; x.lineCap = "round";
    x.font = "italic 64px 'Caveat', 'Segoe Script', cursive"; x.fillText(text, 30, 100);
    x.beginPath(); x.moveTo(30, 120); x.bezierCurveTo(160, 140, 320, 100, 480, 118); x.stroke();
    return c.toDataURL("image/png");
  } catch { return ""; }
}

const iso = (d: string, h = 10) => new Date(`${d}T${String(h).padStart(2, "0")}:00:00`).toISOString();

export function buildShowcase(services: Service[], settings: Settings) {
  const T = today();
  const svc = (id: string) => services.find((s) => s.id === id)!;
  const tag = { showcase: true, sample: true } as const;

  const staff: Staff[] = [
    { id: "sc-staff-1", name: "Instructor (demo)", role: "instructor", pin: "1111", phone: "+20 100 000 0101", email: "instructor.dahabdays@gmail.com", commissionPct: 12, baseSalary: 8000, active: true },
    { id: "sc-staff-2", name: "Manager (demo)", role: "manager", pin: "2222", phone: "+20 100 000 0102", email: "manager.dahabdays@gmail.com", commissionPct: 0, baseSalary: 15000, active: true },
    { id: "sc-staff-3", name: "Front desk (demo)", role: "front-desk", pin: "3333", phone: "+20 100 000 0103", email: "frontdesk.dahabdays@gmail.com", commissionPct: 0, baseSalary: 9000, active: true }
  ];
  const inst = staff[0].id;

  const promo: Promo = { id: "sc-promo", code: "ATTAR10", kind: "pct", value: 10, active: true, used: 1, note: "Showcase: friends & family", maxUses: 20 };

  const mk = (o: Partial<Booking> & { id: string; ref: string; serviceId: string; date: string; time: string; people: number }): Booking => {
    const s = svc(o.serviceId);
    return { orderId: o.ref, serviceName: s.name, category: s.category, market: "eg", total: s.price * o.people, customer, status: "confirmed",
      payment: { method: "paymob", status: "unpaid", amountPaid: 0, history: [] }, createdAt: iso(o.date, 8), ...tag, ...o } as Booking;
  };
  const paid = (amt: number, d: string, method: "paymob" | "cash" = "paymob", h = 9) => ({ at: iso(d, h), amount: amt, method });

  // 1) First visit, 40 days ago: intro dive, paid online in full
  const dsd = mk({ id: "sc-b1", ref: "DD-ATTR1", serviceId: "dsd", date: addDays(T, -40), time: "09:00", people: 1, status: "completed", staffId: inst,
    payment: { method: "paymob", status: "paid", plan: "full", amountPaid: 3000, txnId: "TEST-1001", fee: 86, history: [paid(3000, addDays(T, -42))] } });

  // 2) Came back for Open Water + Tawilat night + hotel pick-up, promo ATTAR10, 25% deposit online then balance in cash
  const owTotal = Math.round(svc("owd").price * 0.9), twTotal = Math.round(svc("tawilat").price * 0.9), puTotal = Math.round(svc("t-hotel").price * 0.9);
  const dep = (t: number) => Math.round(t * 0.25);
  const ow = mk({ id: "sc-b2", ref: "DD-ATTR2", serviceId: "owd", date: addDays(T, -14), time: "09:00", people: 1, total: owTotal, discount: svc("owd").price - owTotal, promo: "ATTAR10", status: "completed", staffId: inst,
    gear: { wetsuit: "M", bcd: "M", fins: "42", weight: "78" },
    payment: { method: "paymob", status: "paid", plan: "deposit", amountPaid: owTotal, txnId: "TEST-2001", fee: Math.round(dep(owTotal) * 0.0275 + 3), history: [paid(dep(owTotal), addDays(T, -20)), paid(owTotal - dep(owTotal), addDays(T, -14), "cash", 17)] } });
  const tw = mk({ id: "sc-b3", ref: "DD-ATTR2", serviceId: "tawilat", date: addDays(T, -12), time: "17:00", people: 2, total: twTotal * 2, promo: "ATTAR10", status: "completed",
    payment: { method: "paymob", status: "paid", plan: "deposit", amountPaid: twTotal * 2, txnId: "TEST-2001", history: [paid(dep(twTotal * 2), addDays(T, -20)), paid(twTotal * 2 - dep(twTotal * 2), addDays(T, -12), "cash", 16)] } });
  const pu = mk({ id: "sc-b4", ref: "DD-ATTR2", serviceId: "t-hotel", date: addDays(T, -14), time: "Any time", people: 1, total: puTotal, promo: "ATTAR10", status: "completed",
    payment: { method: "paymob", status: "paid", plan: "deposit", amountPaid: puTotal, history: [paid(dep(puTotal), addDays(T, -20)), paid(puTotal - dep(puTotal), addDays(T, -14), "cash", 17)] } });

  // 3) Today: a guided shore dive and a full-set rental, paid in cash at the center (shows in roster + cash close)
  const shore = mk({ id: "sc-b5", ref: "DD-ATTR3", serviceId: "shore", date: T, time: "08:30", people: 1, staffId: inst, gear: { wetsuit: "M", bcd: "M", fins: "42", weight: "78" },
    payment: { method: "cash", status: "paid", plan: "later", amountPaid: svc("shore").price, history: [paid(svc("shore").price, T, "cash", 8)] } });
  const rent = mk({ id: "sc-b6", ref: "DD-ATTR3", serviceId: "r-full", date: T, time: "08:00", people: 1, days: 2, total: svc("r-full").price * 2,
    payment: { method: "cash", status: "paid", plan: "later", amountPaid: svc("r-full").price * 2, history: [paid(svc("r-full").price * 2, T, "cash", 8)] } });

  // 4) Upcoming: Advanced course + Blue Hole snorkel for his friend, deposit paid online (balance due on arrival)
  const aowTotal = svc("aowd").price, bhTotal = svc("bh-snorkel").price * 2;
  const aow = mk({ id: "sc-b7", ref: "DD-ATTR4", serviceId: "aowd", date: addDays(T, 3), time: "09:00", people: 1, total: aowTotal, staffId: inst, gear: { wetsuit: "M", bcd: "M", fins: "42", weight: "78" },
    payment: { method: "paymob", status: "deposit", plan: "deposit", amountPaid: dep(aowTotal), txnId: "TEST-4001", fee: Math.round(dep(aowTotal) * 0.0275 + 3), history: [paid(dep(aowTotal), addDays(T, -1))] } });
  const bh = mk({ id: "sc-b8", ref: "DD-ATTR4", serviceId: "bh-snorkel", date: addDays(T, 4), time: "09:30", people: 2, total: bhTotal,
    payment: { method: "paymob", status: "deposit", plan: "deposit", amountPaid: dep(bhTotal), txnId: "TEST-4001", history: [paid(dep(bhTotal), addDays(T, -1))] } });

  // 5) Cancelled and refunded: Mount Sinai sunrise
  const sinai = mk({ id: "sc-b9", ref: "DD-ATTR5", serviceId: "sinai", date: addDays(T, -5), time: "23:00", people: 1, status: "cancelled", cancelledBy: "guest",
    payment: { method: "paymob", status: "refunded", plan: "full", amountPaid: svc("sinai").price, refunded: svc("sinai").price, refundReason: "Guest cancelled 3 days before — free cancellation", txnId: "TEST-5001",
      history: [paid(svc("sinai").price, addDays(T, -10)), { at: iso(addDays(T, -8), 12), amount: -svc("sinai").price, method: "paymob", note: "refund: free cancellation" }] } });

  // 6) Abandoned checkout 3 hours ago: Colored Canyon (payment never completed)
  const canyon = mk({ id: "sc-b10", ref: "DD-ATTR6", serviceId: "colored", date: addDays(T, 6), time: "08:00", people: 2, total: svc("colored").price * 2, status: "pending",
    payment: { method: "paymob", status: "unpaid", plan: "full", dueNow: svc("colored").price * 2, amountPaid: 0, history: [] }, createdAt: new Date(Date.now() - 3 * 3600_000).toISOString() });

  const bookings = [dsd, ow, tw, pu, shore, rent, aow, bh, sinai, canyon];

  const sig = drawSignature("M. Attar"); const center = settings.centerSignature || drawSignature("Dahab Days");
  const answers = Object.fromEntries(MEDICAL_QUESTIONS.map((q) => [q.id, "no"])) as Consent["answers"];
  const acks = Object.fromEntries(ACKNOWLEDGEMENTS.map((a) => [a.id, true]));
  const consent: Consent = {
    id: "sc-consent", bookingId: ow.id, bookingRef: ow.ref, program: "Open Water Diver + Gabal El Tawilat night",
    fullName: DEMO_GUEST.name, dob: DEMO_GUEST.dob, nationality: DEMO_GUEST.nationality, idNumber: DEMO_GUEST.idNumber, phone: DEMO_GUEST.phone, email: DEMO_GUEST.email,
    emergencyName: DEMO_GUEST.emergencyName, emergencyPhone: DEMO_GUEST.emergencyPhone, arrival: addDays(T, -15), departure: addDays(T, 6), accommodation: DEMO_GUEST.accommodation,
    certLevel: "Scuba Diver", lastDive: "Intro dive with Dahab Days", healthNotes: "", medications: "", answers, acks,
    signature: sig, signedAt: iso(addDays(T, -20), 20), centerSignature: center, centerSigner: settings.centerSigner || "Dahab Days (demo signer)", countersignedAt: iso(addDays(T, -19), 9),
    needsClearance: false, createdAt: iso(addDays(T, -20), 20), ...tag
  } as Consent;
  [ow, tw, pu, aow, bh, shore].forEach((b) => { if (svc(b.serviceId).requiresConsent) b.consentId = consent.id; });

  const logbook: LogEntry[] = [
    { id: "sc-log1", email: DEMO_GUEST.email, date: addDays(T, -13), site: "Lighthouse", depth: 12, minutes: 48, buddy: "Instructor (demo)", notes: "Saw a turtle on the safety stop!" },
    { id: "sc-log2", email: DEMO_GUEST.email, date: addDays(T, -12), site: "Eel Garden", depth: 18, minutes: 45, buddy: "Instructor (demo)", notes: "Garden eels everywhere, perfect buoyancy" }
  ].map((l) => ({ ...l, showcase: true } as LogEntry));

  const media: MediaItem[] = [[STOCK.diverReef, "Mohamed on the Lighthouse reef"], [STOCK.fishCorals, "Open Water dive 3"], [STOCK.anthias, "Anthias on the safety stop"]].map(([url, caption], i) => ({
    id: `sc-photo-${i}`, kind: "image", role: "guest", url, caption, tag: "Guest", bookingRef: ow.ref, guestEmail: DEMO_GUEST.email, createdAt: iso(addDays(T, -12), 18 + i), showcase: true
  } as MediaItem));

  const note: CustomerNote = { id: DEMO_GUEST.email, notes: "Showcase guest. Started with an intro dive, came back for Open Water, now booked on Advanced. Prefers morning dives; wetsuit M, fins 42.", tags: ["Returning", "Advanced next", "Showcase"] };

  const inventory: InventoryItem[] = [
    { id: "sc-inv1", type: "Wetsuit 5 mm", size: "M", code: "WS5-M-07", status: "out", lastService: addDays(T, -30), notes: "With Mohamed Attar today" },
    { id: "sc-inv2", type: "BCD", size: "M", code: "BCD-M-03", status: "out", lastService: addDays(T, -60), notes: "With Mohamed Attar today" },
    { id: "sc-inv3", type: "Regulator", size: "One size", code: "REG-11", status: "available", lastService: addDays(T, -20) },
    { id: "sc-inv4", type: "Dive computer", size: "One size", code: "PC-04", status: "available", lastService: addDays(T, -220) }
  ].map((x) => ({ ...x, showcase: true }) as unknown as InventoryItem);

  const expenses: Expense[] = [{ id: "sc-exp1", date: addDays(T, -13), category: "Certification fees", amount: 2500, note: "Mohamed Attar — Open Water card (demo)", serviceId: "owd", ...tag } as Expense];

  const cash = [shore, rent].reduce((a, b) => a + (b.payment.amountPaid || 0), 0);
  const cashclose: CashClose = { id: "sc-cash", date: T, float: 1000, expected: 1000 + cash, counted: 1000 + cash, terminal: 0, variance: 0, notes: "Showcase: Mohamed Attar paid cash for today's dive and rental", by: "Manager (demo)", at: new Date().toISOString() };

  return { staff, promos: [promo], bookings, consents: [consent], logbook, media, customers: [note], inventory, expenses, cashcloses: [{ ...cashclose, showcase: true }] as unknown as CashClose[] };
}
