/**
 * Storage layer with three interchangeable backends:
 *  - "supabase": production (set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY). Lovable connects to this natively.
 *  - "artifact": the hosted Claude preview (shared database + uploads).
 *  - "local":    offline demo in this browser only.
 * Every table is a simple document store: { id, data jsonb }.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Collection = "services" | "bookings" | "consents" | "expenses" | "media" | "settings" | "staff" | "inventory" | "cashcloses" | "promos" | "logbook" | "posts" | "customers" | "roles";
export const COLLECTIONS: Collection[] = ["services", "bookings", "consents", "expenses", "media", "settings", "staff", "inventory", "cashcloses", "promos", "logbook", "posts", "customers", "roles"];
export type Mode = "supabase" | "artifact" | "local";

export interface Backend {
  mode: Mode;
  list<T>(col: Collection): Promise<T[]>;
  put<T extends { id: string }>(col: Collection, doc: T): Promise<void>;
  remove(col: Collection, id: string): Promise<void>;
  upload(file: File): Promise<{ url: string; assetId?: string }>;
  saveFile(filename: string, blob: Blob): Promise<boolean>;
  canDownload: boolean;
  /** Supabase only: creates a Paymob intention server-side and returns the hosted checkout URL. */
  startPayment?(orderId: string): Promise<string>;
  /** Supabase only: public-safe RPCs (guests can't read the bookings table) */
  seats?(serviceId: string, date: string): Promise<Record<string, number>>;
  guestFind?(ref: string, email: string): Promise<any[]>;
  guestUpdate?(ref: string, email: string, id: string, patch: { date?: string; time?: string; cancel?: boolean }): Promise<void>;
  reviews?(): Promise<{ rating: number; count: number; url?: string; reviews: { author: string; rating: number; text: string; when: string }[] } | null>;
  notify?(orderId: string): Promise<void>;
  refund?(bookingId: string, amount: number): Promise<void>;
  checkPromo?(code: string): Promise<any | null>;
  storeConsentPdf?(consentId: string, pdf: Blob): Promise<void>;
  signIn?(email: string): Promise<void>;
  /** Staff sign-in (Supabase Auth): SMS code to a phone, or Google */
  phoneCode?(phone: string): Promise<void>;
  verifyPhone?(phone: string, code: string): Promise<void>;
  google?(): Promise<void>;
  identity?(): Promise<{ email?: string; phone?: string } | null>;
  /** Server-side check of the signed-in person: their role, or null when they have no access */
  access?(): Promise<{ owner: boolean; role: string; staffId: string; name: string } | null>;
  currentEmail?(): Promise<string | null>;
  signOut?(): Promise<void>;
  supabase?: SupabaseClient;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function anchorDownload(filename: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  return true;
}

/* ---------------- local (this browser) ---------------- */
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("dahab-days-media", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("blobs");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbPut(key: string, blob: Blob) {
  const db = await idb();
  await new Promise<void>((res, rej) => { const t = db.transaction("blobs", "readwrite"); t.objectStore("blobs").put(blob, key); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
async function idbGet(key: string): Promise<Blob | undefined> {
  const db = await idb();
  return new Promise((res) => { const r = db.transaction("blobs").objectStore("blobs").get(key); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); });
}

const memory: Record<string, unknown[]> = {};
function localBackend(): Backend {
  const read = (col: string): any[] => {
    try { return JSON.parse(localStorage.getItem("dd:" + col) || "[]"); } catch { return (memory[col] as any[]) || []; }
  };
  const write = (col: string, rows: any[]) => {
    memory[col] = rows;
    try { localStorage.setItem("dd:" + col, JSON.stringify(rows)); } catch { /* storage full or blocked: keep in memory */ }
  };
  return {
    mode: "local",
    canDownload: true,
    async list(col) {
      const rows = read(col);
      if (col === "media") {
        for (const m of rows) if (m.assetId?.startsWith("idb:")) {
          const b = await idbGet(m.assetId).catch(() => undefined);
          if (b) m.url = URL.createObjectURL(b);
        }
      }
      return rows;
    },
    async put(col, doc) { const rows = read(col).filter((r) => r.id !== doc.id); rows.push(clone(doc)); write(col, rows); },
    async remove(col, id) { write(col, read(col).filter((r) => r.id !== id)); },
    async upload(file) {
      const key = "idb:" + crypto.randomUUID();
      try { await idbPut(key, file); return { url: URL.createObjectURL(file), assetId: key }; }
      catch { return { url: URL.createObjectURL(file) }; }
    },
    async saveFile(name, blob) { return anchorDownload(name, blob); }
  };
}

/* ---------------- Claude artifact preview ---------------- */
async function artifactBackend(): Promise<Backend | null> {
  const c = (window as any).claude;
  if (!c?.use) return null;
  const withTimeout = <T,>(p: Promise<T>, ms = 6000) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
  const db = await withTimeout(c.use("db")).catch(() => null) as any;
  if (!db) return null;
  const assets = await withTimeout(c.use("assets"), 3000).catch(() => null) as any;
  const downloads = await withTimeout(c.use("downloads"), 3000).catch(() => null) as any;
  const fallback = localBackend();
  return {
    mode: "artifact",
    canDownload: !!downloads,
    async list(col) {
      try { const snap = await db.collection(col).get(); return snap.docs.map((d: any) => clone(d.data())); }
      catch { return fallback.list(col); }
    },
    async put(col, doc) {
      try { await db.collection(col).doc(doc.id).set(clone(doc)); }
      catch { await fallback.put(col, doc); } // viewers without write access keep a local copy
    },
    async remove(col, id) { try { await db.collection(col).doc(id).delete(); } catch { await fallback.remove(col, id); } },
    async upload(file) {
      if (assets) { const r = await assets.upload(file); return { url: r.url, assetId: r.id }; }
      return fallback.upload(file);
    },
    async saveFile(filename, blob) {
      if (!downloads) return false;
      try { await downloads.save({ filename, data: blob }); return true; } catch { return false; }
    }
  };
}

/* ---------------- Supabase (production / Lovable) ---------------- */
function supabaseBackend(url: string, key: string): Backend {
  const sb = createClient(url, key);
  return {
    mode: "supabase",
    supabase: sb,
    canDownload: true,
    async list(col) {
      const { data, error } = await sb.from(col).select("data").order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => r.data);
    },
    async put(col, doc) {
      // insert first (visitors may only insert bookings/consents); fall back to update for admins
      const ins = await sb.from(col).insert({ id: doc.id, data: doc });
      if (!ins.error) return;
      if (ins.error.code !== "23505") throw ins.error;
      const { error } = await sb.from(col).update({ data: doc, updated_at: new Date().toISOString() }).eq("id", doc.id);
      if (error) throw error;
    },
    async remove(col, id) { const { error } = await sb.from(col).delete().eq("id", id); if (error) throw error; },
    async upload(file) {
      const path = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await sb.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      return { url: sb.storage.from("media").getPublicUrl(path).data.publicUrl, assetId: path };
    },
    async saveFile(name, blob) { return anchorDownload(name, blob); },
    async startPayment(orderId) {
      const { data, error } = await sb.functions.invoke("paymob-intention", { body: { orderId, returnUrl: location.origin + location.pathname + "?r=thanks" } });
      if (error) throw error;
      return data.checkoutUrl as string;
    },
    async seats(serviceId, date) {
      const { data } = await sb.rpc("seats_taken", { p_service: serviceId, p_date: date });
      return Object.fromEntries((data || []).map((r: any) => [r.slot, Number(r.taken)]));
    },
    async guestFind(ref, email) { const { data, error } = await sb.rpc("guest_booking", { p_ref: ref, p_email: email }); if (error) throw error; return data || []; },
    async guestUpdate(ref, email, id, patch) { const { error } = await sb.rpc("guest_update_booking", { p_ref: ref, p_email: email, p_id: id, p_date: patch.date || null, p_time: patch.time || null, p_cancel: !!patch.cancel }); if (error) throw error; },
    async reviews() { const { data, error } = await sb.functions.invoke("google-reviews"); return error ? null : data; },
    async checkPromo(code) { const { data } = await sb.rpc("check_promo", { p_code: code }); return data || null; },
    async storeConsentPdf(id, pdf) { await sb.storage.from("consents").upload(`${id}.pdf`, pdf, { contentType: "application/pdf", upsert: false }); },
    async notify(orderId) { await sb.functions.invoke("notify", { body: { orderId } }); },
    async refund(bookingId, amount) { const { error } = await sb.functions.invoke("paymob-refund", { body: { bookingId, amount } }); if (error) throw error; },
    async phoneCode(phone) { const { error } = await sb.auth.signInWithOtp({ phone }); if (error) throw error; },
    async verifyPhone(phone, code) { const { error } = await sb.auth.verifyOtp({ phone, token: code, type: "sms" }); if (error) throw error; },
    async google() { const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname + "#admin" } }); if (error) throw error; },
    async access() { const { data, error } = await sb.rpc("my_access"); if (error) throw error; return data || null; },
    async identity() { const { data } = await sb.auth.getUser(); return data.user ? { email: data.user.email || undefined, phone: data.user.phone || undefined } : null; },
    async signIn(email) { const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname + "#account" } }); if (error) throw error; },
    async currentEmail() { const { data } = await sb.auth.getUser(); return data.user?.email || null; },
    async signOut() { await sb.auth.signOut(); }
  };
}

export async function createBackend(): Promise<Backend> {
  const env = (import.meta as any).env || {};
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) return supabaseBackend(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const art = await artifactBackend();
  return art || localBackend();
}
