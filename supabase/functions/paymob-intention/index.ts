// Creates one Paymob payment intention for a whole trip (all bookings sharing an orderId).
// Re-prices everything server-side: service prices, promo code and deposit % from the database.
// Secrets: PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY, PAYMOB_INTEGRATION_IDS (comma separated: card, wallet…)
import { createClient } from "npm:@supabase/supabase-js@2";
import { lineEgp } from "../_shared/pricing.ts"; // same file as src/lib/pricing.ts — keep both in sync

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const PAYMOB = "https://accept.paymob.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { orderId, returnUrl } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: rows } = await sb.from("bookings").select("id,data").eq("data->>orderId", orderId);
    if (!rows?.length) throw new Error("Order not found");
    const { data: st } = await sb.from("settings").select("data").eq("id", "main").maybeSingle();
    const depositPct = st?.data?.depositPct ?? 25;
    const baseRate = Number(st?.data?.rates?.EUR) || 56;

    // server-side prices
    const lines = [] as { id: string; b: any; line: number }[];
    for (const r of rows) {
      const b = r.data;
      if (b.payment?.status === "paid") throw new Error("Already paid");
      const { data: svc } = await sb.from("services").select("data").eq("id", b.serviceId).maybeSingle();
      // the guest's rate is accepted if it is within 5% of the rate in Settings, so nobody can pay a made-up rate
      const rate = b.fxRate && Math.abs(b.fxRate - baseRate) / baseRate <= 0.05 ? b.fxRate : baseRate;
      const market = b.market === "eg" ? "eg" : "intl";
      const line = svc?.data ? lineEgp(svc.data, { people: b.people, days: b.days, variant: b.variant }, market, rate) : b.total;
      lines.push({ id: r.id, b, line });
    }
    const subtotal = lines.reduce((a, l) => a + l.line, 0);
    let discount = 0; const code = lines[0].b.promo;
    if (code) {
      const { data: p } = await sb.rpc("check_promo", { p_code: code });
      if (p) discount = Math.min(subtotal, p.kind === "pct" ? Math.round((subtotal * p.value) / 100) : p.value);
    }
    const total = subtotal - discount;
    const plan = lines[0].b.payment?.plan === "deposit" ? "deposit" : "full";
    const due = plan === "deposit" ? Math.round((total * depositPct) / 100) : total;
    const cents = Math.round(due * 100);

    // write the server totals back
    for (const l of lines) {
      const share = subtotal ? l.line / subtotal : 0; const d = Math.round(discount * share); const tot = l.line - d;
      await sb.from("bookings").update({ data: { ...l.b, total: tot, discount: d || undefined, payment: { ...l.b.payment, dueNow: Math.round(due * (total ? tot / total : 0)) } }, updated_at: new Date().toISOString() }).eq("id", l.id);
    }

    const b = lines[0].b; const [first, ...rest] = String(b.customer?.name || "Guest").split(" ");
    const res = await fetch(`${PAYMOB}/v1/intention/`, {
      method: "POST",
      headers: { Authorization: `Token ${Deno.env.get("PAYMOB_SECRET_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: cents, currency: "EGP",
        payment_methods: Deno.env.get("PAYMOB_INTEGRATION_IDS")!.split(",").map((x) => Number(x.trim())),
        items: [{ name: (plan === "deposit" ? "Deposit: " : "") + lines.map((l) => l.b.serviceName).join(" + ").slice(0, 45), amount: cents, description: `${b.ref} · ${lines.length} item(s)`, quantity: 1 }],
        billing_data: { first_name: first || "Guest", last_name: rest.join(" ") || "-", email: b.customer?.email || "guest@dahabdays.com", phone_number: b.customer?.phone || "+200000000000", country: "EG", city: "Dahab", state: "South Sinai", street: "NA", building: "NA", apartment: "NA", floor: "NA" },
        special_reference: `${orderId}__${Date.now()}`,
        extras: { order_id: orderId, ref: b.ref },
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paymob-webhook`,
        redirection_url: returnUrl
      })
    });
    const intent = await res.json();
    if (!res.ok || !intent.client_secret) throw new Error("Paymob: " + JSON.stringify(intent).slice(0, 300));
    const checkoutUrl = `${PAYMOB}/unifiedcheckout/?publicKey=${Deno.env.get("PAYMOB_PUBLIC_KEY")}&clientSecret=${intent.client_secret}`;
    return new Response(JSON.stringify({ checkoutUrl }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
