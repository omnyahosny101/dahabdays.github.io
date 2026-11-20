// Paymob "transaction processed" callback: verifies the HMAC, records the payment on every booking
// in the order (full or deposit), counts the promo use, then sends confirmations.
// Secrets: PAYMOB_HMAC_SECRET. Deploy with --no-verify-jwt.
import { createClient } from "npm:@supabase/supabase-js@2";

const FIELDS = ["amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded", "is_standalone_payment", "is_voided", "order.id", "owner", "pending", "source_data.pan", "source_data.sub_type", "source_data.type", "success"];
const pick = (o: any, path: string) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const obj = body.obj || {};
  const expected = await hmacHex(Deno.env.get("PAYMOB_HMAC_SECRET")!, FIELDS.map((f) => String(pick(obj, f) ?? "")).join(""));
  if (expected !== url.searchParams.get("hmac")) return new Response("bad hmac", { status: 401 });
  if (obj.is_refunded || obj.is_voided) return new Response("ok"); // refunds are recorded by paymob-refund

  const ref: string = obj.order?.merchant_order_id || obj.special_reference || "";
  const orderId = obj.payment_key_claims?.extra?.order_id || ref.split("__")[0];
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rows } = await sb.from("bookings").select("id,data").eq("data->>orderId", orderId);
  if (!rows?.length) return new Response("unknown order");
  const { data: st } = await sb.from("settings").select("data").eq("id", "main").maybeSingle();
  const pct = st?.data?.gatewayFeePct ?? 2.75, fixed = st?.data?.gatewayFixed ?? 3;
  const paidTotal = Number(obj.amount_cents || 0) / 100;
  const now = new Date().toISOString();

  if (obj.success !== true) {
    for (const r of rows) await sb.from("bookings").update({ data: { ...r.data, payment: { ...r.data.payment, lastError: obj.data?.message || "declined" } } }).eq("id", r.id);
    return new Response("ok");
  }
  const dueSum = rows.reduce((a, r) => a + (r.data.payment?.dueNow || 0), 0) || paidTotal;
  for (const r of rows) {
    const b = r.data; const amt = Math.round(paidTotal * ((b.payment?.dueNow || 0) / dueSum));
    const amountPaid = (b.payment?.amountPaid || 0) + amt;
    const payment = { ...b.payment, method: "paymob", status: amountPaid >= b.total ? "paid" : "deposit", paidAt: now, txnId: String(obj.id), amountPaid,
      fee: Math.round((amt * pct) / 100 + fixed / rows.length), history: [...(b.payment?.history || []), { at: now, amount: amt, method: "paymob" }] };
    await sb.from("bookings").update({ data: { ...b, status: "confirmed", payment }, updated_at: now }).eq("id", r.id);
  }
  const code = rows[0].data.promo;
  if (code) {
    const { data: p } = await sb.from("promos").select("id,data").eq("data->>code", code).maybeSingle();
    if (p) await sb.from("promos").update({ data: { ...p.data, used: (p.data.used || 0) + 1 } }).eq("id", p.id);
  }
  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify`, { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) }).catch(() => {});
  return new Response("ok");
});
