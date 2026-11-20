import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Eraser, ShieldCheck } from "lucide-react";
import { ACKNOWLEDGEMENTS, MEDICAL_QUESTIONS } from "../lib/catalog";
import { uid } from "../lib/store";
import type { Consent, Settings, YesNo } from "../lib/types";

/* ---------- Finger / mouse signature ---------- */
export function SignaturePad({ value, onChange, height = 170 }: { value: string; onChange: (png: string) => void; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const cb = useRef(onChange); cb.current = onChange;
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const fit = () => {
      const r = c.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2);
      c.width = r.width * d; c.height = height * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0c2329";
      if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, r.width, height); img.src = value; }
    };
    fit();
    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const down = (e: PointerEvent) => { drawing.current = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
    const move = (e: PointerEvent) => { if (!drawing.current) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); dirty.current = true; };
    const up = () => { if (!drawing.current) return; drawing.current = false; if (dirty.current) cb.current(c.toDataURL("image/png")); };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); addEventListener("pointerup", up);
    return () => { c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const clear = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); dirty.current = false; onChange(""); };
  return (
    <div>
      <div className="relative rounded-2xl border-2 border-dashed border-ink/20 bg-white">
        <canvas ref={ref} style={{ height, touchAction: "none" }} className="block w-full cursor-crosshair" aria-label="Signature area" />
        {!value && <span className="pointer-events-none absolute inset-0 grid place-items-center text-ink/35">Sign here with your finger or mouse</span>}
        <span className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-ink/20" />
      </div>
      <button type="button" onClick={clear} className="btn mt-2 px-3 text-sm text-ink/70 hover:bg-black/5"><Eraser size={16} /> Clear</button>
    </div>
  );
}

const field = (label: string, el: React.ReactNode, ar?: string) => (
  <label className="block"><span className="label">{label}{ar && <span className="ar ms-2 text-ink/50">{ar}</span>}</span>{el}</label>
);

export type ConsentDraft = Omit<Consent, "id" | "signedAt" | "createdAt" | "needsClearance">;

export const blankConsent = (program: string, name = "", email = "", phone = ""): ConsentDraft => ({
  program, fullName: name, dob: "", nationality: "", idNumber: "", phone, email, emergencyName: "", emergencyPhone: "",
  arrival: "", departure: "", accommodation: "", certLevel: "", lastDive: "", healthNotes: "", medications: "",
  answers: {}, acks: {}, signature: ""
});

export function consentProblems(d: ConsentDraft): string[] {
  const p: string[] = [];
  const req: [keyof ConsentDraft, string][] = [["fullName", "full name"], ["dob", "date of birth"], ["nationality", "nationality"], ["idNumber", "ID or passport number"], ["phone", "phone"], ["arrival", "arrival date"], ["departure", "departure date"], ["accommodation", "hotel or hostel"], ["emergencyName", "emergency contact"], ["emergencyPhone", "emergency phone"]];
  for (const [k, l] of req) if (!String(d[k] || "").trim()) p.push(l);
  const unanswered = MEDICAL_QUESTIONS.filter((q) => !d.answers[q.id]).length;
  if (unanswered) p.push(`${unanswered} medical question${unanswered > 1 ? "s" : ""}`);
  if (ACKNOWLEDGEMENTS.some((a) => a.required && !d.acks[a.id])) p.push("the required acknowledgements");
  if (d.arrival && d.departure && d.departure < d.arrival) p.push("departure after arrival");
  if (!d.signature) p.push("your signature");
  return p;
}

export function finalizeConsent(d: ConsentDraft, s: Settings, extra: Partial<Consent> = {}): Consent {
  const now = new Date().toISOString();
  return {
    ...d, ...extra, id: uid(), signedAt: now, createdAt: now,
    needsClearance: MEDICAL_QUESTIONS.some((q) => d.answers[q.id] === "yes"),
    // the center's stored signature countersigns automatically when one is set up
    ...(s.centerSignature ? { centerSignature: s.centerSignature, centerSigner: s.centerSigner || s.centerName, countersignedAt: now } : {})
  };
}

export default function ConsentForm({ d, set }: { d: ConsentDraft; set: (d: ConsentDraft) => void }) {
  const up = (k: keyof ConsentDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set({ ...d, [k]: e.target.value });
  const yes = MEDICAL_QUESTIONS.filter((q) => d.answers[q.id] === "yes").length;
  const answer = (id: string, v: YesNo) => set({ ...d, answers: { ...d.answers, [id]: v } });
  return (
    <div className="space-y-10">
      <section>
        <h3 className="mb-1 text-xl font-bold">Participant details</h3>
        <p className="mb-5 text-ink/60">Each diver or snorkeller fills in their own form.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("Full name (as in passport)", <input className="input" value={d.fullName} onChange={up("fullName")} autoComplete="name" />, "الاسم بالكامل")}
          {field("Date of birth", <input type="date" className="input" value={d.dob} onChange={up("dob")} />, "تاريخ الميلاد")}
          {field("Nationality", <input className="input" value={d.nationality} onChange={up("nationality")} />, "الجنسية")}
          {field("ID / passport number", <input className="input" value={d.idNumber} onChange={up("idNumber")} />, "رقم البطاقة / الجواز")}
          {field("Phone (WhatsApp)", <input type="tel" className="input" value={d.phone} onChange={up("phone")} autoComplete="tel" />, "الهاتف")}
          {field("Email", <input type="email" className="input" value={d.email} onChange={up("email")} autoComplete="email" />, "البريد الإلكتروني")}
          {field("Arrival date in Dahab", <input type="date" className="input" value={d.arrival} onChange={up("arrival")} />, "تاريخ الوصول")}
          {field("Departure date from Dahab", <input type="date" className="input" value={d.departure} onChange={up("departure")} min={d.arrival} />, "تاريخ المغادرة")}
          {field("Hotel / hostel / camp in Dahab", <input className="input" value={d.accommodation} onChange={up("accommodation")} />, "مكان الإقامة")}
          {field("Diving certification", <select className="input" value={d.certLevel} onChange={up("certLevel")}><option value="">None — first time</option><option>Scuba Diver</option><option>Open Water</option><option>Advanced Open Water</option><option>Rescue Diver</option><option>Divemaster or higher</option></select>, "مستوى الشهادة")}
          {field("Last dive (approx.)", <input className="input" placeholder="e.g. March 2025, or never" value={d.lastDive} onChange={up("lastDive")} />, "آخر غطسة")}
          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            {field("Emergency contact name", <input className="input" value={d.emergencyName} onChange={up("emergencyName")} />, "جهة اتصال للطوارئ")}
            {field("Emergency contact phone", <input type="tel" className="input" value={d.emergencyPhone} onChange={up("emergencyPhone")} />)}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-xl font-bold">Medical questionnaire <span className="ar text-base font-normal text-ink/50">الاستبيان الطبي</span></h3>
        <p className="mb-5 text-ink/60">Answer every question honestly. A “yes” doesn't stop you from diving — it means we'll need a short note from your doctor first.</p>
        <ol className="divide-y divide-ink/10 rounded-2xl border border-ink/10">
          {MEDICAL_QUESTIONS.map((q, i) => (
            <li key={q.id} className={`grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center ${d.answers[q.id] === "yes" ? "bg-coral/5" : ""}`}>
              <div><p className="font-medium">{i + 1}. {q.en}</p><p className="ar mt-1 text-sm text-ink/55">{q.ar}</p></div>
              <div className="flex gap-2" role="radiogroup" aria-label={q.en}>
                {(["yes", "no"] as YesNo[]).map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={d.answers[q.id] === v} onClick={() => answer(q.id, v)}
                    className={`btn min-w-[84px] border ${d.answers[q.id] === v ? (v === "yes" ? "border-coral bg-coral text-white" : "border-sea bg-sea text-white") : "border-ink/15 hover:bg-black/5"}`}>
                    {v === "yes" ? "Yes · نعم" : "No · لا"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {yes > 0 && <p className="mt-4 flex gap-3 rounded-2xl bg-coral/10 p-4 text-ink"><AlertTriangle className="shrink-0 text-coral" /> You answered yes to {yes} question{yes > 1 ? "s" : ""}. Please bring a doctor's written approval to dive. You can still complete your booking now.</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {field("Any other health issue we should know about?", <textarea rows={3} className="input" value={d.healthNotes} onChange={up("healthNotes")} placeholder="Allergies, injuries, conditions…" />, "مشاكل صحية أخرى")}
          {field("Medications you take", <textarea rows={3} className="input" value={d.medications} onChange={up("medications")} />, "الأدوية")}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-xl font-bold">Consent & release <span className="ar text-base font-normal text-ink/50">الإقرار والموافقة</span></h3>
        <ul className="space-y-3">
          {ACKNOWLEDGEMENTS.map((a) => (
            <li key={a.id}><label className="flex cursor-pointer gap-3 rounded-2xl border border-ink/10 p-4 hover:bg-foam/60">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#06485a]" checked={!!d.acks[a.id]} onChange={(e) => set({ ...d, acks: { ...d.acks, [a.id]: e.target.checked } })} />
              <span><span className="block">{a.en}{a.required && <span className="text-coral">&nbsp;*</span>}</span><span className="ar mt-1 block text-sm text-ink/55">{a.ar}</span></span>
            </label></li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 flex items-center gap-2 text-xl font-bold"><ShieldCheck className="text-lagoon" /> Your signature <span className="ar text-base font-normal text-ink/50">التوقيع</span></h3>
        <p className="mb-4 text-ink/60">By signing you confirm the information above. The center countersigns and you can download the signed PDF.</p>
        <SignaturePad value={d.signature} onChange={(signature) => set({ ...d, signature })} />
      </section>
    </div>
  );
}
