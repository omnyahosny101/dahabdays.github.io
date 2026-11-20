// Sends the booking confirmation by WhatsApp (Cloud API template) and email (Resend), with the signed consent PDF.
// Secrets: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE (e.g. "booking_confirmation", language "en"),
//          RESEND_API_KEY, EMAIL_FROM (e.g. "Dahab Days <bookings@dahabdays.com>"), SITE_URL
// The WhatsApp template needs: a DOCUMENT header, and body variables {{1}} name, {{2}} trip summary, {{3}} reference.
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const intl = (p: string) => { let d = (p || "").replace(/\D/g, ""); if (d.startsWith("0") && d.length === 11) d = "20" + d.slice(1); return d; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { orderId } = await req.json();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rows } = await sb.from("bookings").select("data").eq("data->>orderId", orderId);
  if (!rows?.length) return new Response("no order", { headers: cors });
  const bs = rows.map((r) => r.data); const b = bs[0];
  const summary = bs.map((x: any) => `${x.serviceName} ${x.date} ${x.time}`).join(" · ");
  let pdfUrl = "";
  if (b.consentId) { const { data } = await sb.storage.from("consents").createSignedUrl(`${b.consentId}.pdf`, 60 * 60 * 24 * 7); pdfUrl = data?.signedUrl || ""; }
  const results: Record<string, unknown> = {};

  if (Deno.env.get("WHATSAPP_TOKEN") && b.customer?.phone) {
    const components: any[] = [{ type: "body", parameters: [{ type: "text", text: b.customer.name }, { type: "text", text: summary.slice(0, 900) }, { type: "text", text: b.ref }] }];
    if (pdfUrl) components.unshift({ type: "header", parameters: [{ type: "document", document: { link: pdfUrl, filename: `DahabDays-${b.ref}.pdf` } }] });
    const r = await fetch(`https://graph.facebook.com/v20.0/${Deno.env.get("WHATSAPP_PHONE_ID")}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: intl(b.customer.phone), type: "template", template: { name: Deno.env.get("WHATSAPP_TEMPLATE") || "booking_confirmation", language: { code: "en" }, components } })
    });
    results.whatsapp = r.status;
  }
  if (Deno.env.get("RESEND_API_KEY") && b.customer?.email) {
    const site = Deno.env.get("SITE_URL") || "";
    const html = `<div style="font-family:Arial,sans-serif;color:#15284B"><h2 style="margin:0">You're booked, ${b.customer.name.split(" ")[0]}!</h2><p>Reference <b>${b.ref}</b></p><ul>${bs.map((x: any) => `<li>${x.serviceName} — ${x.date} at ${x.time}</li>`).join("")}</ul><p>Meet us at the center 15 minutes early. Manage or change your booking: <a href="${site}#manage">${site}#manage</a></p><p style="font-style:italic">Come as a guest, leave as a family member.</p><p>— The Dahab Days family</p></div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: Deno.env.get("EMAIL_FROM"), to: [b.customer.email], subject: `Your Dahab Days booking ${b.ref}`, html, attachments: pdfUrl ? [{ filename: `DahabDays-${b.ref}-consent.pdf`, path: pdfUrl }] : [] })
    });
    results.email = r.status;
  }
  return new Response(JSON.stringify(results), { headers: { ...cors, "Content-Type": "application/json" } });
});
