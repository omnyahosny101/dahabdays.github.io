/* Owner operations: schedule, roster, customers, cash close, staff & payroll, equipment, promo codes, blog, exports */
import { useMemo, useState, type ReactNode } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { AlertTriangle, ChevronLeft, ChevronRight, Download, FileSpreadsheet, MessageCircle, Plus, Search, Trash2, Wrench } from "lucide-react";
import { Empty, Sheet } from "../components/ui";
import { Phase } from "../components/brand";
import type { Backend } from "../lib/backend";
import { addDays, balanceDue, egpA as egp, normPhone, paidAmount, today, uid, useStore } from "../lib/store";
import { MEDICAL_QUESTIONS, PERM_LABEL } from "../lib/catalog";
import type { Booking, CashClose, InventoryItem, Perm, Post, Promo, RoleDef, SceneKey, Settings, Staff } from "../lib/types";
import { ACTION_PERMS, PAGE_PERMS } from "../lib/types";

const Card = ({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) => (
  <section className="rounded-3xl bg-white p-5 shadow-card sm:p-6">{(title || action) && <div className="mb-4 flex flex-wrap items-center justify-between gap-3">{title && <h2 className="text-lg font-bold">{title}</h2>}{action}</div>}{children}</section>
);
const Title = ({ t, s }: { t: string; s?: string }) => <div className="mb-5"><h1 className="text-[28px] font-black leading-tight">{t}</h1>{s && <p className="text-ink/60">{s}</p>}</div>;

export const waLink = (phone: string, text: string) => {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 11) d = "20" + d.slice(1);
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
};
const activeDay = (b: Booking) => b.status !== "cancelled" && b.category !== "addon";
const staffName = (staff: Staff[], id?: string) => staff.find((s) => s.id === id)?.name || "Unassigned";
const STAFF_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"];

/* ---------- Schedule: week view with instructor assignment ---------- */
export function ScheduleTab() {
  const { bookings, staff, put, user } = useStore();
  const [start, setStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); });
  const [mine, setMine] = useState(user?.role === "instructor");
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const list = bookings.filter((b) => activeDay(b) && days.includes(b.date) && (!mine || b.staffId === user?.id));
  const clash = (b: Booking) => !!b.staffId && list.some((x) => x.id !== b.id && x.staffId === b.staffId && x.date === b.date && x.time === b.time && x.serviceId !== b.serviceId);
  const unassigned = list.filter((b) => !b.staffId).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Title t="Schedule" s={`${list.length} activities this week · ${unassigned} without an instructor`} />
        <div className="mb-5 flex items-center gap-2">
          <button className="btn-ghost px-3" aria-label="Previous week" onClick={() => setStart(addDays(start, -7))}><ChevronLeft size={18} /></button>
          <span className="font-semibold">{start} → {days[6]}</span>
          <button className="btn-ghost px-3" aria-label="Next week" onClick={() => setStart(addDays(start, 7))}><ChevronRight size={18} /></button>
          <label className="ms-2 flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Only mine</label>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((d) => { const items = list.filter((b) => b.date === d).sort((a, b) => (a.time < b.time ? -1 : 1)); return (
          <div key={d} className={`rounded-2xl bg-white p-3 shadow-card ${d === today() ? "ring-2 ring-sky" : ""}`}>
            <p className="mb-2 text-sm font-bold">{new Date(d + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
            {items.length ? <ul className="space-y-2">{items.map((b) => { const ci = staff.findIndex((s) => s.id === b.staffId); return (
              <li key={b.id} className="rounded-xl border-s-4 bg-foam p-2 text-sm" style={{ borderColor: ci >= 0 ? STAFF_COLORS[ci % 6] : "#c9ced8" }}>
                <b>{b.time}</b> {b.serviceName}<span className="block text-ink/60">{b.customer.name} · {b.people}p</span>
                <select aria-label="Instructor" className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-1.5 py-1.5" value={b.staffId || ""} onChange={(e) => put("bookings", { ...b, staffId: e.target.value || undefined })}><option value="">Unassigned</option>{staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                {clash(b) && <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-red"><AlertTriangle size={12} /> Double-booked</span>}
              </li>); })}</ul> : <p className="text-sm text-ink/40">Nothing</p>}
          </div>); })}
      </div>
      {!staff.length && <Empty>Add your instructors in Staff and payroll to assign them here.</Empty>}
    </div>
  );
}

/* ---------- Daily roster (print as PDF or CSV) ---------- */
export function RosterTab() {
  const { bookings, consents, staff, services, backend, settings } = useStore();
  const [date, setDate] = useState(today()); const [msg, setMsg] = useState("");
  const rows = bookings.filter((b) => b.date === date && activeDay(b)).sort((a, b) => (a.time < b.time ? -1 : 1));
  const med = (b: Booking) => { const c = consents.find((x) => x.id === b.consentId || x.bookingId === b.id); if (!services.find((s) => s.id === b.serviceId)?.requiresConsent) return "—"; if (!c) return "MISSING"; return c.needsClearance ? "YES: " + MEDICAL_QUESTIONS.filter((q) => c.answers[q.id] === "yes").map((q) => q.id).join(",") : "OK"; };
  const table = rows.map((b) => [b.time, b.serviceName, b.customer.name, String(b.people), [b.gear?.wetsuit && `suit ${b.gear.wetsuit}`, b.gear?.bcd && `BCD ${b.gear.bcd}`, b.gear?.fins && `fins ${b.gear.fins}`, b.gear?.weight && `${b.gear.weight}kg`].filter(Boolean).join(" "), med(b), staffName(staff, b.staffId), balanceDue(b) ? egp(balanceDue(b)) : "—", b.customer.phone]);
  const head = ["Time", "Program", "Guest", "Pax", "Gear", "Medical", "Staff", "Due", "Phone"];
  const pdf = async () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFillColor(21, 40, 75).rect(0, 0, 842, 56, "F"); doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(16).text(`${settings.centerName} — dive roster ${date}`, 32, 35);
    const widths = [44, 150, 120, 30, 140, 90, 90, 70, 90]; let y = 84;
    doc.setTextColor(21, 40, 75).setFontSize(9);
    const row = (cells: string[], bold = false) => { let x = 32; doc.setFont("helvetica", bold ? "bold" : "normal"); cells.forEach((c, i) => { doc.text(doc.splitTextToSize(c, widths[i] - 6)[0] || "", x, y); x += widths[i]; }); y += 18; if (y > 560) { doc.addPage(); y = 40; } };
    row(head, true); doc.setDrawColor(200).line(32, y - 12, 810, y - 12); table.forEach((r) => row(r));
    const ok = await backend?.saveFile(`roster-${date}.pdf`, doc.output("blob")); setMsg(ok ? "" : "Downloads aren't available in this view.");
  };
  const csv = async () => {
    const text = [head, ...table].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const ok = await backend?.saveFile(`roster-${date}.csv`, new Blob([text], { type: "text/csv" })); setMsg(ok ? "" : "Downloads aren't available in this view.");
  };
  return (
    <div className="space-y-5">
      <Title t="Daily roster" s="Who's diving, with what gear, medical status and money due." />
      <div className="flex flex-wrap items-center gap-3"><input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} /><button className="btn-sea" onClick={pdf}><Download size={16} /> PDF</button><button className="btn-ghost" onClick={csv}><FileSpreadsheet size={16} /> CSV</button>{msg && <span className="text-red">{msg}</span>}</div>
      <div className="space-y-3 md:hidden">{rows.length ? table.map((r, i) => <article key={i} className="rounded-3xl bg-white p-4 shadow-card">
        <div className="flex items-start justify-between gap-3"><p className="font-bold">{r[0]} · {r[1]}</p>{r[5] !== "OK" && r[5] !== "—" && <span className="chip bg-red/10 text-red">{r[5]}</span>}</div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">{head.slice(2).map((h, k) => k + 2 !== 5 && <div key={h} className={k + 2 === 4 ? "col-span-2" : ""}><dt className="text-ink/50">{h}</dt><dd className="font-medium">{r[k + 2] || "—"}</dd></div>)}</dl>
      </article>) : <div className="rounded-3xl bg-white p-6 shadow-card"><Empty>No activities on {date}.</Empty></div>}</div>
      <div className="hidden overflow-x-auto rounded-3xl bg-white shadow-card md:block">
        {rows.length ? <table className="w-full text-[14px]"><thead className="bg-foam text-ink/60"><tr>{head.map((h) => <th key={h} className="p-3 text-start">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{table.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} className={`p-3 ${k === 5 && c !== "OK" && c !== "—" ? "font-bold text-red" : ""}`}>{c}</td>)}</tr>)}</tbody></table> : <div className="p-6"><Empty>No activities on {date}.</Empty></div>}
      </div>
    </div>
  );
}

/* ---------- Customers (CRM) ---------- */
export function CustomersTab() {
  const { bookings, consents, customers, put } = useStore();
  const [q, setQ] = useState(""); const [open, setOpen] = useState<string | null>(null);
  const people = useMemo(() => {
    const map = new Map<string, { key: string; name: string; email: string; phone: string; country: string; bookings: Booking[]; spent: number; last: string; cert: string; flag: boolean }>();
    for (const b of bookings) {
      const key = (b.customer.email || b.customer.phone || b.customer.name).toLowerCase(); if (!key) continue;
      const p = map.get(key) || { key, name: b.customer.name, email: b.customer.email, phone: b.customer.phone, country: b.customer.country, bookings: [], spent: 0, last: "", cert: "", flag: false };
      p.bookings.push(b); p.spent += paidAmount(b); if (b.date > p.last) p.last = b.date; map.set(key, p);
    }
    for (const c of consents) { const p = map.get(c.email.toLowerCase()); if (p) { p.cert = c.certLevel || p.cert || "None"; p.flag = p.flag || c.needsClearance; } }
    return [...map.values()].sort((a, b) => b.spent - a.spent);
  }, [bookings, consents]);
  const list = people.filter((p) => !q || `${p.name} ${p.email} ${p.phone} ${p.country}`.toLowerCase().includes(q.toLowerCase()));
  const sel = people.find((p) => p.key === open); const note = customers.find((c) => c.id === open);
  const [draft, setDraft] = useState(""); const [tags, setTags] = useState("");
  return (
    <div className="space-y-5">
      <Title t="Customers" s={`${people.length} guests · ${people.filter((p) => p.bookings.length > 1).length} came back more than once`} />
      <label className="relative block"><Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-ink/40" /><input className="input ps-11" placeholder="Search name, email, phone, country" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="space-y-3 md:hidden">{list.length ? list.map((p) => <button key={p.key} className="block w-full rounded-3xl bg-white p-4 text-start shadow-card" onClick={() => { setOpen(p.key); const n = customers.find((c) => c.id === p.key); setDraft(n?.notes || ""); setTags(n?.tags.join(", ") || ""); }}>
        <div className="flex items-start justify-between gap-3"><span className="min-w-0"><b>{p.name}</b><span className="block truncate text-sm text-ink/55">{p.email || p.phone}</span></span><b className="price shrink-0">{egp(p.spent)}</b></div>
        <p className="mt-1 text-sm text-ink/60">{p.bookings.length} visits · last {p.last} · {p.country || "—"} · {p.cert || "no cert"}{p.flag && <AlertTriangle size={14} className="ms-1 inline text-red" />}</p>
        {!!customers.find((c) => c.id === p.key)?.tags.length && <div className="mt-2 flex flex-wrap gap-1">{customers.find((c) => c.id === p.key)?.tags.map((t) => <span key={t} className="chip bg-sun/30 text-navy">{t}</span>)}</div>}
      </button>) : <div className="rounded-3xl bg-white p-6 shadow-card"><Empty>Guests appear here after their first booking.</Empty></div>}</div>
      <div className="hidden overflow-x-auto rounded-3xl bg-white shadow-card md:block">
        {list.length ? <table className="w-full text-[15px]"><thead className="bg-foam text-sm text-ink/60"><tr><th className="p-3 text-start">Guest</th><th className="p-3 text-start">Country</th><th className="p-3 text-end">Visits</th><th className="p-3 text-end">Spent</th><th className="p-3 text-start">Last</th><th className="p-3 text-start">Level</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y">{list.map((p) => <tr key={p.key} className="cursor-pointer hover:bg-foam/50" onClick={() => { setOpen(p.key); const n = customers.find((c) => c.id === p.key); setDraft(n?.notes || ""); setTags(n?.tags.join(", ") || ""); }}>
            <td className="p-3"><b>{p.name}</b><span className="block text-sm text-ink/55">{p.email || p.phone}</span></td><td className="p-3">{p.country || "—"}</td><td className="p-3 text-end">{p.bookings.length}</td><td className="price p-3 text-end font-semibold">{egp(p.spent)}</td><td className="p-3">{p.last}</td>
            <td className="p-3">{p.cert || "—"}{p.flag && <AlertTriangle size={14} className="ms-1 inline text-red" />}</td>
            <td className="p-3 text-end">{customers.find((c) => c.id === p.key)?.tags.map((t) => <span key={t} className="chip ms-1 bg-sun/30 text-navy">{t}</span>)}</td></tr>)}</tbody></table> : <div className="p-6"><Empty>Guests appear here after their first booking.</Empty></div>}
      </div>
      <Sheet wide open={!!sel} onClose={() => setOpen(null)}>{sel && <div className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-2xl font-black">{sel.name}</h3><p className="text-ink/60">{sel.email} · {sel.phone} · {sel.country}</p></div><a className="btn-sea" target="_blank" rel="noreferrer" href={waLink(sel.phone, `Hi ${sel.name.split(" ")[0]}! It's the Dahab Days family 🌊`)}><MessageCircle size={16} /> WhatsApp</a></div>
        <div className="grid grid-cols-3 gap-3"><div className="rounded-2xl bg-foam p-4"><p className="text-sm text-ink/60">Spent</p><p className="font-display text-xl font-black">{egp(sel.spent)}</p></div><div className="rounded-2xl bg-foam p-4"><p className="text-sm text-ink/60">Bookings</p><p className="font-display text-xl font-black">{sel.bookings.length}</p></div><div className="rounded-2xl bg-foam p-4"><p className="text-sm text-ink/60">Level</p><p className="font-display text-xl font-black">{sel.cert || "—"}</p></div></div>
        <ul className="divide-y">{sel.bookings.sort((a, b) => (a.date < b.date ? 1 : -1)).map((b, i) => <li key={b.id} className="flex items-center gap-3 py-2"><Phase i={i} size={14} /><span className="flex-1">{b.serviceName}<span className="block text-sm text-ink/55">{b.date} · {b.ref} · {b.status}</span></span><span className="price">{egp(b.total)}</span></li>)}</ul>
        <label className="block"><span className="label">Tags (comma separated)</span><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="VIP, returning, freediver" /></label>
        <label className="block"><span className="label">Notes</span><textarea rows={4} className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Prefers morning dives, vegetarian, wants Rescue next time…" /></label>
        <button className="btn-coral" onClick={async () => { await put("customers", { id: sel.key, notes: draft, tags: tags.split(",").map((x) => x.trim()).filter(Boolean) }); setOpen(null); }}>Save notes</button>
        {note && <p className="text-xs text-ink/50">Saved notes are only visible to staff.</p>}
      </div>}</Sheet>
    </div>
  );
}

/* ---------- Daily cash close ---------- */
export function CashTab() {
  const { bookings, cashcloses, put, user } = useStore();
  const [date, setDate] = useState(today()); const [float, setFloat] = useState(0); const [counted, setCounted] = useState(0); const [terminal, setTerminal] = useState(0); const [notes, setNotes] = useState("");
  const events = bookings.flatMap((b) => (b.payment.history || []).filter((h) => h.at.slice(0, 10) === date).map((h) => ({ ...h, b })));
  const cash = events.filter((e) => e.method === "cash").reduce((a, e) => a + e.amount, 0);
  const online = events.filter((e) => e.method === "paymob").reduce((a, e) => a + e.amount, 0);
  const expected = float + cash; const variance = counted - expected;
  const done = cashcloses.find((c) => c.date === date);
  return (
    <div className="space-y-5">
      <Title t="Cash close" s="Count the drawer at the end of the day and compare it with what the system expects." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card title={`Day ${date}`} action={<input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-foam p-4"><p className="text-sm text-ink/60">Cash taken (system)</p><p className="font-display text-2xl font-black">{egp(cash)}</p></div>
            <div className="rounded-2xl bg-foam p-4"><p className="text-sm text-ink/60">Paid online (Paymob)</p><p className="font-display text-2xl font-black">{egp(online)}</p></div>
          </div>
          <ul className="mt-4 max-h-56 divide-y overflow-auto text-sm">{events.map((e, i) => <li key={i} className="flex justify-between py-2"><span>{e.at.slice(11, 16)} · {e.b.customer.name} · {e.b.serviceName}{e.note ? ` · ${e.note}` : ""}</span><span className={`price ${e.amount < 0 ? "text-red" : ""}`}>{e.method} {egp(e.amount)}</span></li>)}{!events.length && <li className="py-2 text-ink/50">No payments recorded on this day.</li>}</ul>
        </Card>
        <Card title="Close the drawer">
          <div className="grid gap-3">
            <label><span className="label">Opening float</span><input type="number" className="input" value={float} onChange={(e) => setFloat(+e.target.value)} /></label>
            <label><span className="label">Cash counted now</span><input type="number" className="input" value={counted} onChange={(e) => setCounted(+e.target.value)} /></label>
            <label><span className="label">Card terminal total (if you have one)</span><input type="number" className="input" value={terminal} onChange={(e) => setTerminal(+e.target.value)} /></label>
            <label><span className="label">Notes</span><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            <p className={`rounded-2xl p-4 font-semibold ${variance === 0 ? "bg-[#1baf7a]/15 text-[#0b6b49]" : "bg-red/10 text-red"}`}>Expected {egp(expected)} · Variance {variance > 0 ? "+" : ""}{egp(variance)}</p>
            <button className="btn-coral" onClick={() => put("cashcloses", { id: done?.id || uid(), date, float, expected, counted, terminal, variance, notes, by: user?.name || "Owner", at: new Date().toISOString() } as CashClose)}>{done ? "Update close" : "Close the day"}</button>
          </div>
        </Card>
      </div>
      <Card title="Past closes">{cashcloses.length ? <table className="w-full text-[15px]"><thead className="text-sm text-ink/55"><tr><th className="py-2 text-start">Date</th><th className="py-2 text-end">Expected</th><th className="py-2 text-end">Counted</th><th className="py-2 text-end">Variance</th><th className="py-2 text-start">By</th></tr></thead><tbody className="divide-y">{[...cashcloses].sort((a, b) => (a.date < b.date ? 1 : -1)).map((c) => <tr key={c.id}><td className="py-2">{c.date}</td><td className="price py-2 text-end">{egp(c.expected)}</td><td className="price py-2 text-end">{egp(c.counted)}</td><td className={`price py-2 text-end font-semibold ${c.variance ? "text-red" : ""}`}>{egp(c.variance)}</td><td className="py-2">{c.by}</td></tr>)}</tbody></table> : <Empty>No days closed yet.</Empty>}</Card>
    </div>
  );
}

/* ---------- Team, roles and payroll ---------- */
export function TeamTab() {
  const { staff, roles, settings, put, remove, user, can } = useStore();
  const [view, setView] = useState<"members" | "roles" | "payroll">("members");
  const [edit, setEdit] = useState<Staff | null>(null); const [role, setRole] = useState<RoleDef | null>(null); const [err, setErr] = useState("");
  const isOwner = user?.role === "owner";
  const roleOf = (id: string) => roles.find((r) => r.id === id);
  const blank: Staff = { id: "", name: "", role: "front-desk", pin: "", phone: "", email: "", commissionPct: 0, baseSalary: 0, active: true };
  const dashUrl = location.origin + location.pathname + "#admin";
  const invite = (s: Staff) => waLink(s.phone, `Hi ${s.name.split(" ")[0]}! You now have access to the ${settings.centerName} dashboard as ${roleOf(s.role)?.name || s.role}. Open ${dashUrl} and sign in with this phone number${s.email ? ` or with Google (${s.email})` : ""}.`);
  const saveMember = async () => {
    if (!edit) return; setErr("");
    if (!edit.name.trim()) return setErr("Add a name.");
    if (!normPhone(edit.phone) && !edit.email) return setErr("Add a phone number or a Gmail so they can sign in.");
    const clash = staff.find((x) => x.id !== edit.id && ((normPhone(edit.phone) && normPhone(x.phone) === normPhone(edit.phone)) || (edit.email && x.email?.toLowerCase() === edit.email.toLowerCase())));
    if (clash) return setErr(`${clash.name} already uses that phone or email.`);
    if (edit.role === "owner" && !isOwner) return setErr("Only an owner can make someone an owner.");
    await put("staff", { ...edit, email: edit.email?.trim().toLowerCase() }); setEdit(null);
  };
  const saveRole = async () => {
    if (!role) return; setErr("");
    if (!role.name.trim()) return setErr("Give the role a name.");
    if (role.perms.includes("team") && !isOwner) return setErr("Only an owner can create roles that manage the team.");
    await put("roles", role); setRole(null);
  };
  const toggle = (p: Perm) => role && setRole({ ...role, perms: role.perms.includes(p) ? role.perms.filter((x) => x !== p) : [...role.perms, p] });
  const seg = (k: typeof view, l: string) => <button onClick={() => setView(k)} className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold sm:flex-none ${view === k ? "bg-navy text-white" : "text-ink/60 hover:bg-foam"}`}>{l}</button>;
  return (
    <div className="space-y-5">
      <Title t="Team and roles" s="Give anyone access with their phone number or Gmail, and decide exactly what each role can see and do." />
      <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-card sm:w-fit">{seg("members", `People (${staff.length + 1})`)}{seg("roles", `Roles (${roles.length})`)}{can("seeMoney") && seg("payroll", "Payroll")}</div>

      {view === "members" && <Card title="Who can sign in" action={<button className="btn-sea" onClick={() => { setErr(""); setEdit({ ...blank, id: uid() }); }}><Plus size={16} /> Give access</button>}>
        <ul className="divide-y">
          <li className="flex items-start gap-3 py-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-navy text-sm font-black text-sun">OW</span><span className="min-w-0 flex-1"><b>{settings.ownerName || "Owner"}</b><span className="block break-words text-sm text-ink/55" dir="ltr">{[settings.ownerPhone, settings.ownerEmail].filter(Boolean).join(" · ") || "Set the owner phone/Gmail in Settings"}</span></span><span className="chip bg-sun/30 text-navy">Owner</span></li>
          {staff.map((s, i) => <li key={s.id} className="flex items-start gap-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-black text-white" style={{ background: STAFF_COLORS[i % 6] }}>{s.name.replace(/\(.*?\)/g, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
            <span className="min-w-0 flex-1"><b className={s.active ? "" : "text-ink/40 line-through"}>{s.name}</b>
              <span className="block truncate text-sm text-ink/55" dir="ltr">{s.phone}</span>{s.email && <span className="block truncate text-sm text-ink/55" dir="ltr">{s.email}</span>}
              <span className={`chip mt-1 ${s.active ? "bg-foam text-navy" : "bg-ink/5 text-ink/50"}`}>{s.active ? roleOf(s.role)?.name || "No role" : "Access off"}</span></span>
            <span className="flex shrink-0 gap-1">{s.phone && <a className="btn px-2.5 text-[#0b7a52] hover:bg-[#1baf7a]/10" href={invite(s)} target="_blank" rel="noreferrer" title="Send the invite on WhatsApp" aria-label="Send invite on WhatsApp"><MessageCircle size={16} /></a>}<button className="btn-ghost px-3 text-sm" onClick={() => { setErr(""); setEdit(s); }}>Edit</button></span>
          </li>)}
        </ul>
        {!staff.length && <p className="mt-2 text-sm text-ink/60">No one else yet. Tap Give access, pick a role and send them the invite.</p>}
        <p className="mt-4 rounded-2xl bg-foam p-3 text-sm text-ink/70">They sign in at <b className="break-all">{dashUrl}</b> with a code texted to their phone, or with Google. Switching someone off signs them out straight away.</p>
      </Card>}

      {view === "roles" && <div className="space-y-4">
        <div className="flex justify-end"><button className="btn-sea" onClick={() => { setErr(""); setRole({ id: uid(), name: "", perms: ["overview"] }); }}><Plus size={16} /> New role</button></div>
        <div className="grid gap-4 md:grid-cols-2">{roles.map((r) => {
          const members = staff.filter((s) => s.role === r.id).length + (r.id === "owner" ? 1 : 0);
          return <div key={r.id} className="rounded-3xl bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-2"><div><h3 className="text-lg font-black">{r.name}</h3><p className="text-sm text-ink/55">{members} {members === 1 ? "person" : "people"} · {r.perms.filter((p) => (PAGE_PERMS as readonly string[]).includes(p)).length} pages</p></div>
              {r.locked ? <span className="chip bg-sun/30 text-navy">Full access</span> : <span className="flex gap-1"><button className="btn-ghost text-sm" onClick={() => { setErr(""); setRole({ ...r, id: uid(), name: r.name + " copy" }); }}>Copy</button><button className="btn-ghost text-sm" onClick={() => { setErr(""); setRole(r); }}>Edit</button></span>}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">{r.perms.map((p) => <span key={p} className={`chip ${(ACTION_PERMS as readonly string[]).includes(p) ? "bg-red/10 text-red" : "bg-foam text-navy"}`}>{PERM_LABEL[p]}</span>)}</div>
          </div>;
        })}</div>
      </div>}

      {view === "payroll" && <PayrollCard />}

      <Sheet open={!!edit} onClose={() => setEdit(null)}>{edit && <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
        <h3 className="text-2xl font-black sm:col-span-2">{staff.some((s) => s.id === edit.id) ? edit.name : "Give someone access"}</h3>
        <label className="sm:col-span-2"><span className="label">Name</span><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
        <label><span className="label">Mobile number (SMS code)</span><input className="input" type="tel" dir="ltr" placeholder="+20 1xx xxx xxxx" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></label>
        <label><span className="label">Gmail (Google sign-in)</span><input className="input" type="email" dir="ltr" placeholder="name@gmail.com" value={edit.email || ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></label>
        <label className="sm:col-span-2"><span className="label">Role</span><select className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{roles.filter((r) => isOwner || r.id !== "owner").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          <span className="mt-1 block text-sm text-ink/55">Can open: {roleOf(edit.role)?.perms.map((p) => PERM_LABEL[p]).join(", ") || "nothing yet"}</span></label>
        <label><span className="label">Commission %</span><input type="number" className="input" value={edit.commissionPct} onChange={(e) => setEdit({ ...edit, commissionPct: +e.target.value })} /></label>
        <label><span className="label">Base salary per month (EGP)</span><input type="number" className="input" value={edit.baseSalary} onChange={(e) => setEdit({ ...edit, baseSalary: +e.target.value })} /></label>
        <label className="sm:col-span-2"><span className="label">Backup PIN (preview only, optional)</span><input className="input" value={edit.pin} onChange={(e) => setEdit({ ...edit, pin: e.target.value })} /></label>
        <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" className="h-5 w-5" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Access on (can sign in and be assigned trips)</label>
        {err && <p className="text-red sm:col-span-2">{err}</p>}
        <div className="flex gap-3 sm:col-span-2"><button className="btn-coral flex-1" onClick={saveMember}>Save</button>{staff.some((s) => s.id === edit.id) && <button className="btn-ghost text-red" aria-label="Remove access" onClick={async () => { await remove("staff", edit.id); setEdit(null); }}><Trash2 size={16} /> Remove</button>}</div>
      </div>}</Sheet>

      <Sheet open={!!role} onClose={() => setRole(null)}>{role && <div className="space-y-5 p-6 sm:p-8">
        <h3 className="text-2xl font-black">{roles.some((r) => r.id === role.id) ? "Edit role" : "New role"}</h3>
        <label className="block"><span className="label">Role name</span><input className="input" placeholder="e.g. Boat captain, Social media" value={role.name} onChange={(e) => setRole({ ...role, name: e.target.value })} /></label>
        <div><p className="label">Pages they can open</p><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{PAGE_PERMS.map((p) => <PermToggle key={p} on={role.perms.includes(p)} label={PERM_LABEL[p]} onClick={() => toggle(p)} />)}</div></div>
        <div><p className="label">What they're allowed to do</p><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{ACTION_PERMS.map((p) => <PermToggle key={p} on={role.perms.includes(p)} label={PERM_LABEL[p]} onClick={() => toggle(p)} danger />)}</div>
          <p className="mt-2 text-sm text-ink/55">Without “See money amounts”, prices and totals show as EGP •••.</p></div>
        <div className="flex flex-wrap gap-2"><button className="btn-ghost text-sm" onClick={() => setRole({ ...role, perms: [...PAGE_PERMS, ...ACTION_PERMS].filter((p) => p !== "team" && p !== "settings") })}>Select all</button><button className="btn-ghost text-sm" onClick={() => setRole({ ...role, perms: [] })}>Clear</button></div>
        {err && <p className="text-red">{err}</p>}
        <div className="flex gap-3"><button className="btn-coral flex-1" onClick={saveRole}>Save role</button>{roles.some((r) => r.id === role.id) && <button className="btn-ghost text-red" disabled={staff.some((s) => s.role === role.id)} title={staff.some((s) => s.role === role.id) ? "Move people to another role first" : "Delete role"} onClick={async () => { await remove("roles", role.id); setRole(null); }}><Trash2 size={16} /></button>}</div>
      </div>}</Sheet>
    </div>
  );
}
const PermToggle = ({ on, label, onClick, danger }: { on: boolean; label: string; onClick: () => void; danger?: boolean }) => (
  <button type="button" role="switch" aria-checked={on} onClick={onClick} className={`flex min-h-[48px] items-center justify-between gap-3 rounded-2xl border-2 px-4 text-start font-semibold transition ${on ? (danger ? "border-red/50 bg-red/5" : "border-sky bg-foam") : "border-ink/10 bg-white text-ink/55"}`}>
    {label}<span className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? (danger ? "bg-red" : "bg-sky") : "bg-ink/15"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${on ? "start-5" : "start-1"}`} /></span>
  </button>
);

function PayrollCard() {
  const { staff, bookings, backend, can } = useStore();
  const [month, setMonth] = useState(today().slice(0, 7)); const [msg, setMsg] = useState("");
  const rows = staff.map((s) => {
    const bs = bookings.filter((b) => b.staffId === s.id && b.date.startsWith(month) && b.status === "completed" && b.category !== "addon");
    const rev = bs.reduce((a, b) => a + paidAmount(b), 0); const commission = Math.round((rev * s.commissionPct) / 100);
    return { s, count: bs.length, guests: bs.reduce((a, b) => a + b.people, 0), rev, commission, total: commission + s.baseSalary };
  });
  const exportPay = async () => {
    const ws = XLSX.utils.json_to_sheet(rows.map((r) => ({ Name: r.s.name, Role: r.s.role, "Activities led": r.count, Guests: r.guests, "Revenue (EGP)": r.rev, "Commission %": r.s.commissionPct, "Commission (EGP)": r.commission, "Base salary (EGP)": r.s.baseSalary, "Total pay (EGP)": r.total })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Payroll " + month);
    const ok = await backend?.saveFile(`payroll-${month}.xlsx`, new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })])); setMsg(ok ? "" : "Downloads aren't available in this view.");
  };
  return (
    <Card title="Payroll" action={<div className="flex gap-2"><input type="month" className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />{can("export") && <button className="btn-ghost" onClick={exportPay}><FileSpreadsheet size={16} /> Excel</button>}</div>}>
      {msg && <p className="mb-2 text-red">{msg}</p>}
      {rows.length ? <>
        <ul className="divide-y md:hidden">{rows.map((r) => <li key={r.s.id} className="py-3"><div className="flex justify-between gap-3"><b>{r.s.name}</b><b className="price">{egp(r.total)}</b></div><p className="text-sm text-ink/60">{r.count} led · {r.guests} guests · {egp(r.commission)} commission + {egp(r.s.baseSalary)} base</p></li>)}</ul>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-[15px]"><thead className="text-sm text-ink/55"><tr><th className="py-2 text-start">Name</th><th className="py-2 text-end">Led</th><th className="py-2 text-end">Guests</th><th className="py-2 text-end">Revenue</th><th className="py-2 text-end">Commission</th><th className="py-2 text-end">Base</th><th className="py-2 text-end">Total</th></tr></thead>
          <tbody className="divide-y">{rows.map((r) => <tr key={r.s.id}><td className="py-2 font-semibold">{r.s.name}</td><td className="py-2 text-end">{r.count}</td><td className="py-2 text-end">{r.guests}</td><td className="price py-2 text-end">{egp(r.rev)}</td><td className="price py-2 text-end">{egp(r.commission)}</td><td className="price py-2 text-end">{egp(r.s.baseSalary)}</td><td className="price py-2 text-end font-black">{egp(r.total)}</td></tr>)}</tbody></table></div>
      </> : <Empty>No team members yet.</Empty>}
      <p className="mt-3 text-sm text-ink/60">Counts completed bookings assigned to each person in the month.</p>
    </Card>
  );
}

/* ---------- Equipment inventory ---------- */
const GEAR_TYPES = ["BCD", "Regulator", "Wetsuit 3 mm", "Wetsuit 5 mm", "Fins", "Mask", "Dive computer", "Tank 12 L", "Tank 15 L", "Torch", "Action camera"];
export function InventoryTab() {
  const { inventory, put, remove } = useStore();
  const [f, setF] = useState<InventoryItem>({ id: "", type: GEAR_TYPES[0], size: "M", code: "", status: "available" });
  const [filter, setFilter] = useState("all");
  const groups = useMemo(() => {
    const m = new Map<string, { type: string; size: string; total: number; avail: number }>();
    inventory.filter((i) => i.status !== "retired").forEach((i) => { const k = i.type + "|" + i.size; const g = m.get(k) || { type: i.type, size: i.size, total: 0, avail: 0 }; g.total++; if (i.status === "available") g.avail++; m.set(k, g); });
    return [...m.values()].sort((a, b) => (a.type + a.size < b.type + b.size ? -1 : 1));
  }, [inventory]);
  const due = (i: InventoryItem) => !i.lastService || i.lastService < addDays(today(), -180);
  const list = inventory.filter((i) => filter === "all" || i.status === filter || (filter === "service-due" && due(i)));
  return (
    <div className="space-y-5">
      <Title t="Equipment" s={`${inventory.length} items · ${inventory.filter((i) => i.status === "available").length} available · ${inventory.filter(due).length} due for service (6 months)`} />
      <Card title="Stock by size">{groups.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{groups.map((g) => <div key={g.type + g.size} className="rounded-2xl bg-foam p-3"><p className="text-sm font-semibold">{g.type} · {g.size}</p><p className={`font-display text-2xl font-black ${g.avail === 0 ? "text-red" : ""}`}>{g.avail}<span className="text-sm font-medium text-ink/50"> / {g.total} free</span></p></div>)}</div> : <Empty>Add your gear below to see what's free in each size.</Empty>}</Card>
      <Card title="Add item">
        <div className="grid gap-3 sm:grid-cols-5">
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{GEAR_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
          <input className="input" placeholder="Size" value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} />
          <input className="input" placeholder="Code / serial" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
          <input type="date" className="input" aria-label="Last service" value={f.lastService || ""} onChange={(e) => setF({ ...f, lastService: e.target.value })} />
          <button className="btn-sea" onClick={async () => { await put("inventory", { ...f, id: uid() }); setF({ ...f, code: "" }); }}><Plus size={16} /> Add</button>
        </div>
      </Card>
      <Card title="Items" action={<select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>{[["all", "All"], ["available", "Available"], ["out", "Out with guests"], ["service", "In service"], ["service-due", "Service due"], ["retired", "Retired"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}>
        {list.length ? <ul className="divide-y">{list.map((i) => <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5">
          <span className="min-w-[10rem] flex-1"><b>{i.type}</b> · {i.size} <span className="text-sm text-ink/55">{i.code}</span>{due(i) && <span className="chip ms-2 bg-sun/30 text-navy">service due</span>}</span>
          <span className="text-sm text-ink/55">Serviced {i.lastService || "never"}</span>
          <select className="rounded-lg border border-ink/15 bg-white px-2 py-2" value={i.status} onChange={(e) => put("inventory", { ...i, status: e.target.value as InventoryItem["status"] })}>{["available", "out", "service", "retired"].map((x) => <option key={x}>{x}</option>)}</select>
          <button className="btn px-2.5 text-sm hover:bg-foam" title="Mark serviced today" onClick={() => put("inventory", { ...i, lastService: today(), status: "available" })}><Wrench size={16} /></button>
          <button className="btn px-2.5 text-ink/40 hover:text-red" aria-label="Delete" onClick={() => remove("inventory", i.id)}><Trash2 size={16} /></button>
        </li>)}</ul> : <Empty>Nothing here.</Empty>}
      </Card>
    </div>
  );
}

/* ---------- Promo codes ---------- */
export function PromosTab() {
  const { promos, put, remove, bookings } = useStore();
  const [p, setP] = useState<Promo>({ id: "", code: "", kind: "pct", value: 10, active: true, used: 0 });
  return (
    <div className="space-y-5">
      <Title t="Promo codes" s="Guests enter these at the Review and pay step." />
      <Card title="New code"><div className="grid gap-3 sm:grid-cols-6">
        <input className="input uppercase sm:col-span-2" placeholder="WINTER15" value={p.code} onChange={(e) => setP({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, "") })} />
        <select className="input" value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value as Promo["kind"] })}><option value="pct">% off</option><option value="amount">EGP off</option></select>
        <input type="number" className="input" value={p.value} onChange={(e) => setP({ ...p, value: +e.target.value })} aria-label="Value" />
        <input type="date" className="input" value={p.expires || ""} onChange={(e) => setP({ ...p, expires: e.target.value || undefined })} aria-label="Expires" />
        <input type="number" className="input" placeholder="Max uses" value={p.maxUses || ""} onChange={(e) => setP({ ...p, maxUses: +e.target.value || undefined })} />
        <input className="input sm:col-span-5" placeholder="Note (e.g. Instagram campaign, partner hostel)" value={p.note || ""} onChange={(e) => setP({ ...p, note: e.target.value })} />
        <button className="btn-sea" onClick={async () => { if (!p.code) return; await put("promos", { ...p, id: uid() }); setP({ ...p, code: "", note: "" }); }}><Plus size={16} /> Create</button>
      </div></Card>
      <Card title="Codes">{promos.length ? <ul className="divide-y">{promos.map((x) => { const rev = bookings.filter((b) => b.promo === x.code).reduce((a, b) => a + b.total, 0); return <li key={x.id} className="flex flex-wrap items-center gap-3 py-3">
        <span className="font-display text-lg font-black">{x.code}</span><span className="chip bg-foam">{x.kind === "pct" ? `${x.value}%` : egp(x.value)} off</span>
        <span className="flex-1 text-sm text-ink/60">{x.used}{x.maxUses ? `/${x.maxUses}` : ""} uses · {egp(rev)} booked{x.expires ? ` · until ${x.expires}` : ""}{x.note ? ` · ${x.note}` : ""}</span>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={x.active} onChange={(e) => put("promos", { ...x, active: e.target.checked })} /> Active</label>
        <button className="btn px-2.5 text-ink/40 hover:text-red" aria-label="Delete" onClick={() => remove("promos", x.id)}><Trash2 size={16} /></button>
      </li>; })}</ul> : <Empty>No codes yet.</Empty>}</Card>
    </div>
  );
}

/* ---------- Blog editor ---------- */
const SCENES: SceneKey[] = ["bluehole", "reef", "bells", "canyon", "diver", "classroom", "turtle", "night", "pools", "lagoon", "tawilat", "ghazala", "wadi", "sinai", "gear"];
export function BlogTab() {
  const { posts, put, remove, media } = useStore();
  const [e, setE] = useState<Post | null>(null);
  const blank: Post = { id: "", slug: "", title: "", excerpt: "", body: "## Heading\nWrite here. Start a line with - for a list, wrap words in **double stars** for bold.", scene: "reef", category: "Dive site guide", published: false, date: today() };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><Title t="Blog and guides" s="Dive-site and trip guides help people find you on Google." /><button className="btn-sea mb-5" onClick={() => setE({ ...blank, id: uid() })}><Plus size={16} /> New post</button></div>
      <Card>{posts.length ? <ul className="divide-y">{[...posts].sort((a, b) => (a.date < b.date ? 1 : -1)).map((p) => <li key={p.id} className="flex flex-wrap items-center gap-3 py-3"><span className="flex-1"><b>{p.title}</b><span className="block text-sm text-ink/55">{p.category} · {p.date} · {p.published ? "Published" : "Draft"}</span></span><button className="btn-ghost text-sm" onClick={() => setE(p)}>Edit</button><button className="btn px-2.5 text-ink/40 hover:text-red" aria-label="Delete" onClick={() => remove("posts", p.id)}><Trash2 size={16} /></button></li>)}</ul> : <Empty>No posts.</Empty>}</Card>
      <Sheet wide open={!!e} onClose={() => setE(null)}>{e && <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
        <h3 className="text-2xl font-black sm:col-span-2">{e.title || "New post"}</h3>
        <label className="sm:col-span-2"><span className="label">Title</span><input className="input" value={e.title} onChange={(x) => setE({ ...e, title: x.target.value, slug: e.slug || x.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })} /></label>
        <label className="sm:col-span-2"><span className="label">Arabic title (optional)</span><input className="input ar" value={e.titleAr || ""} onChange={(x) => setE({ ...e, titleAr: x.target.value })} /></label>
        <label><span className="label">Category</span><select className="input" value={e.category} onChange={(x) => setE({ ...e, category: x.target.value as Post["category"] })}>{["Dive site guide", "Trip guide", "News"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label><span className="label">Date</span><input type="date" className="input" value={e.date} onChange={(x) => setE({ ...e, date: x.target.value })} /></label>
        <label className="sm:col-span-2"><span className="label">Summary (shown on Google and in the list)</span><input className="input" value={e.excerpt} onChange={(x) => setE({ ...e, excerpt: x.target.value })} /></label>
        <label className="sm:col-span-2"><span className="label">Body</span><textarea rows={12} className="input font-mono text-sm" value={e.body} onChange={(x) => setE({ ...e, body: x.target.value })} /></label>
        <label><span className="label">Cover photo</span><select className="input" value={e.cover || ""} onChange={(x) => setE({ ...e, cover: x.target.value || undefined })}><option value="">Illustration</option>{e.cover && !media.some((m) => m.url === e.cover) && <option value={e.cover}>Current photo</option>}{media.filter((m) => m.kind === "image").map((m) => <option key={m.id} value={m.url}>{m.caption}</option>)}</select></label>
        <label><span className="label">Illustration</span><select className="input" value={e.scene} onChange={(x) => setE({ ...e, scene: x.target.value as SceneKey })}>{SCENES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" className="h-5 w-5" checked={e.published} onChange={(x) => setE({ ...e, published: x.target.checked })} /> Published</label>
        <button className="btn-coral sm:col-span-2" onClick={async () => { if (!e.title) return; await put("posts", e); setE(null); }}>Save post</button>
      </div>}</Sheet>
    </div>
  );
}

/* ---------- Finance exports ---------- */
type Fin = { rows: any[]; perService: { s: { name: string; category: string }; count: number; people: number; rev: number; net: number; cost: number }[]; byExpCat: { c: string; v: number }[]; tot: { revenue: number; costs: number; net: number; count: number } };
export async function exportFinanceXlsx(f: Fin, bookings: Booking[], expenses: { date: string; category: string; amount: number; note: string }[], backend: Backend | null) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(f.rows.map((r) => ({ Month: r.label, "Revenue (EGP)": r.revenue, "Payment fees": r.fees, Expenses: r.expense, "Net income": r.net, "Paid bookings": r.count, "Top service": r.top }))), "Monthly");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(f.perService.map((x) => ({ Service: x.s.name, Category: x.s.category, Bookings: x.count, Guests: x.people, "Revenue (EGP)": x.rev, "Costs (EGP)": x.cost, "Net (EGP)": x.net }))), "By service");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bookings.map((b) => ({ Ref: b.ref, Date: b.date, Time: b.time, Service: b.serviceName, Guest: b.customer.name, Email: b.customer.email, People: b.people, Total: b.total, Received: paidAmount(b), Due: balanceDue(b), Refunded: b.payment.refunded || 0, Method: b.payment.method, Status: b.status, Promo: b.promo || "" }))), "Bookings");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses.map((e) => ({ Date: e.date, Category: e.category, "Amount (EGP)": e.amount, Note: e.note }))), "Expenses");
  return !!(await backend?.saveFile(`DahabDays-finance-${today()}.xlsx`, new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })])));
}
export async function exportFinancePdf(f: Fin, range: number, s: Settings, backend: Backend | null) {
  const doc = new jsPDF({ unit: "pt", format: "a4" }); const M = 40; let y = 0;
  doc.setFillColor(21, 40, 75).rect(0, 0, 595, 80, "F"); doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(18).text(`${s.centerName} — finance report`, M, 40);
  doc.setFont("helvetica", "normal").setFontSize(10).text(`Last ${range} months · generated ${today()}`, M, 60);
  y = 110; doc.setTextColor(21, 40, 75).setFont("helvetica", "bold").setFontSize(13).text(`Revenue ${egp(f.tot.revenue)}  ·  Costs ${egp(f.tot.costs)}  ·  Net ${egp(f.tot.net)}`, M, y);
  const table = (title: string, head: string[], rows: string[][], widths: number[]) => {
    y += 30; doc.setFont("helvetica", "bold").setFontSize(12).text(title, M, y); y += 18; doc.setFontSize(9);
    const line = (cells: string[], bold: boolean) => { let x = M; doc.setFont("helvetica", bold ? "bold" : "normal"); cells.forEach((c, i) => { doc.text(c, i === 0 ? x : x + widths[i] - 6, y, { align: i === 0 ? "left" : "right" }); x += widths[i]; }); y += 15; if (y > 790) { doc.addPage(); y = 40; } };
    line(head, true); rows.forEach((r) => line(r, false));
  };
  table("By month", ["Month", "Revenue", "Fees", "Expenses", "Net", "Top service"], f.rows.map((r) => [r.label, egp(r.revenue), egp(r.fees), egp(r.expense), egp(r.net), String(r.top).slice(0, 24)]), [70, 85, 65, 80, 80, 135]);
  table("By service", ["Service", "Bookings", "Guests", "Revenue", "Net"], f.perService.slice(0, 20).map((x) => [x.s.name.slice(0, 36), String(x.count), String(x.people), egp(x.rev), egp(x.net)]), [200, 60, 60, 100, 95]);
  table("Expenses by category", ["Category", "Amount"], f.byExpCat.map((x) => [x.c, egp(x.v)]), [300, 215]);
  return !!(await backend?.saveFile(`DahabDays-finance-${today()}.pdf`, doc.output("blob")));
}
