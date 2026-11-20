// Daily: WhatsApp a reminder to everyone diving or travelling tomorrow. Schedule with pg_cron (see 002_features.sql).
// Secrets: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_REMINDER_TEMPLATE (body: {{1}} name, {{2}} activity, {{3}} time)
import { createClient } from "npm:@supabase/supabase-js@2";
const intl = (p: string) => { let d = (p || "").replace(/\D/g, ""); if (d.startsWith("0") && d.length === 11) d = "20" + d.slice(1); return d; };
Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const t = new Date(Date.now() + 86400000).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
  const { data: rows } = await sb.from("bookings").select("data").eq("data->>date", t).neq("data->>status", "cancelled");
  let sent = 0;
  for (const { data: b } of rows || []) {
    if (b.category === "addon" || !b.customer?.phone) continue;
    await fetch(`https://graph.facebook.com/v20.0/${Deno.env.get("WHATSAPP_PHONE_ID")}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: intl(b.customer.phone), type: "template", template: { name: Deno.env.get("WHATSAPP_REMINDER_TEMPLATE") || "dive_reminder", language: { code: "en" }, components: [{ type: "body", parameters: [{ type: "text", text: b.customer.name }, { type: "text", text: b.serviceName }, { type: "text", text: b.time }] }] } })
    });
    sent++;
  }
  return new Response(JSON.stringify({ date: t, sent }));
});
