// Refunds a Paymob card/wallet payment. Staff only (checks the caller is in public.admins).
// Secrets: PAYMOB_SECRET_KEY
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: ok } = await caller.rpc("is_admin"); if (!ok) throw new Error("Staff only");
    const { bookingId, amount } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row } = await sb.from("bookings").select("data").eq("id", bookingId).single();
    const txn = row?.data?.payment?.txnId; if (!txn) throw new Error("No Paymob transaction on this booking");
    const res = await fetch("https://accept.paymob.com/api/acceptance/void_refund/refund", {
      method: "POST", headers: { Authorization: `Token ${Deno.env.get("PAYMOB_SECRET_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: Number(txn), amount_cents: Math.round(amount * 100) })
    });
    const out = await res.json();
    if (!res.ok || out.success === false || out.success === "false") throw new Error("Paymob: " + JSON.stringify(out).slice(0, 300));
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
