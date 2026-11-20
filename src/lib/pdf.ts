import { jsPDF } from "jspdf";
import { ACKNOWLEDGEMENTS, MEDICAL_QUESTIONS } from "./catalog";
import type { Consent, Settings } from "./types";

/** Builds the signed consent PDF (participant + center signatures). */
export function consentPdf(c: Consent, s: Settings): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 42;
  let y = 0;
  const ensure = (h: number) => { if (y + h > H - 60) { footer(); doc.addPage(); y = M; } };
  const footer = () => {
    doc.setFontSize(8).setTextColor(120);
    doc.text(`Document ${c.id.slice(0, 8).toUpperCase()} · ${s.centerName} · signed electronically ${new Date(c.signedAt).toLocaleString("en-GB")}`, M, H - 28);
    doc.text(`Page ${doc.getNumberOfPages()}`, W - M, H - 28, { align: "right" });
  };

  // header band
  doc.setFillColor(6, 72, 90).rect(0, 0, W, 86, "F");
  doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(18).text(s.centerName, M, 38);
  doc.setFont("helvetica", "normal").setFontSize(10).text(`${s.address}  ·  ${s.phone}  ·  ${s.email}`, M, 58);
  doc.setFontSize(10).text(c.bookingRef ? `Booking ${c.bookingRef}` : "", W - M, 38, { align: "right" });
  y = 118;
  doc.setTextColor(12, 35, 41).setFont("helvetica", "bold").setFontSize(15).text("Diver Medical Statement, Consent & Release of Liability", M, y);
  y += 22;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(80).text(`Program: ${c.program}`, M, y);
  y += 22;

  const rows: [string, string][] = [
    ["Full name", c.fullName], ["Date of birth", c.dob], ["Nationality", c.nationality], ["ID / passport no.", c.idNumber],
    ["Phone", c.phone], ["Email", c.email], ["Arrival in Dahab", c.arrival], ["Departure from Dahab", c.departure],
    ["Hotel / hostel", c.accommodation], ["Certification level", c.certLevel || "None"], ["Last dive", c.lastDive || "—"],
    ["Emergency contact", `${c.emergencyName} · ${c.emergencyPhone}`]
  ];
  const colW = (W - M * 2) / 2;
  rows.forEach(([k, v], i) => {
    const x = M + (i % 2) * colW; if (i % 2 === 0) ensure(30);
    doc.setFontSize(8).setTextColor(110).text(k.toUpperCase(), x, y);
    doc.setFontSize(10.5).setTextColor(12, 35, 41).text(String(v || "—").slice(0, 60), x, y + 13);
    if (i % 2 === 1) y += 30;
  });
  y += 8;

  const section = (t: string) => { ensure(36); doc.setDrawColor(31, 181, 172).setLineWidth(1.2).line(M, y, W - M, y); y += 18; doc.setFont("helvetica", "bold").setFontSize(11.5).setTextColor(12, 35, 41).text(t, M, y); y += 14; doc.setFont("helvetica", "normal"); };

  section("Medical questionnaire");
  MEDICAL_QUESTIONS.forEach((q, i) => {
    const lines = doc.setFontSize(9.5).splitTextToSize(`${i + 1}. ${q.en}`, W - M * 2 - 60);
    ensure(lines.length * 12 + 6);
    doc.setTextColor(40).text(lines, M, y + 10);
    const a = c.answers[q.id];
    doc.setFont("helvetica", "bold").setTextColor(a === "yes" ? 200 : 20, a === "yes" ? 60 : 120, a === "yes" ? 50 : 90).text(a === "yes" ? "YES" : "NO", W - M, y + 10, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += lines.length * 12 + 6;
  });
  if (c.healthNotes || c.medications) {
    ensure(40);
    doc.setFontSize(9.5).setTextColor(40);
    const t = doc.splitTextToSize(`Health notes: ${c.healthNotes || "—"}   Medications: ${c.medications || "—"}`, W - M * 2);
    doc.text(t, M, y + 10); y += t.length * 12 + 8;
  }
  ensure(26);
  doc.setFillColor(c.needsClearance ? 255 : 231, c.needsClearance ? 236 : 246, c.needsClearance ? 230 : 244).roundedRect(M, y, W - M * 2, 24, 6, 6, "F");
  doc.setFontSize(9.5).setTextColor(12, 35, 41).text(c.needsClearance ? "One or more YES answers: physician's written approval required before any water activity." : "No medical conditions declared.", M + 10, y + 16);
  y += 36;

  section("Acknowledgements");
  ACKNOWLEDGEMENTS.forEach((a) => {
    const lines = doc.setFontSize(9.5).splitTextToSize(a.en, W - M * 2 - 22);
    ensure(lines.length * 12 + 6);
    const ok = !!c.acks[a.id];
    doc.setDrawColor(12, 35, 41).setLineWidth(0.8).rect(M, y + 2, 10, 10);
    if (ok) { doc.setLineWidth(1.4).line(M + 2, y + 7, M + 4.5, y + 10).line(M + 4.5, y + 10, M + 9, y + 3.5); }
    doc.setTextColor(40).text(lines, M + 20, y + 10);
    y += lines.length * 12 + 6;
  });

  section("Signatures");
  ensure(130);
  const box = (x: string, img: string | undefined, name: string, when: string | undefined, label: string, left: number) => {
    doc.setDrawColor(200).setLineWidth(0.6).roundedRect(left, y, colW - 10, 110, 8, 8);
    if (img) { try { doc.addImage(img, "PNG", left + 10, y + 8, colW - 30, 58); } catch { /* bad image */ } }
    else { doc.setFontSize(9).setTextColor(170).text("Awaiting signature", left + 14, y + 40); }
    doc.setDrawColor(150).line(left + 10, y + 72, left + colW - 20, y + 72);
    doc.setFontSize(9).setTextColor(110).text(label, left + 10, y + 86);
    doc.setFontSize(10).setTextColor(12, 35, 41).text(name || x, left + 10, y + 99);
    if (when) doc.setFontSize(8).setTextColor(110).text(new Date(when).toLocaleString("en-GB"), left + colW - 20, y + 99, { align: "right" });
  };
  box("", c.signature, c.fullName, c.signedAt, "Participant", M);
  box("Pending", c.centerSignature, c.centerSigner || "Dahab Days representative", c.countersignedAt, "For the dive center", M + colW + 10);
  y += 120;
  footer();
  return doc.output("blob");
}

export const pdfName = (c: Consent) => `DahabDays-consent-${c.fullName.replace(/[^\w]+/g, "-")}-${c.signedAt.slice(0, 10)}.pdf`;
