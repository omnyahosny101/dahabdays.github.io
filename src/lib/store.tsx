import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { COLLECTIONS, createBackend, type Backend, type Collection } from "./backend";
import { DEFAULT_POSTS, DEFAULT_ROLES, DEFAULT_SERVICES, DEFAULT_SETTINGS } from "./catalog";
import type { Booking, CashClose, Consent, CustomerNote, Expense, InventoryItem, LogEntry, MediaItem, Perm, Post, Promo, Role, RoleDef, Service, Settings, Staff } from "./types";

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const bookingRef = () => "DD-" + Math.random().toString(36).slice(2, 7).toUpperCase();
export const egp = (n: number) => "EGP " + Math.round(n).toLocaleString("en-US");
/** Dashboard money: masked for roles without "See money amounts" */
let moneyHidden = false;
export const hideMoney = (v: boolean) => { moneyHidden = v; };
export const egpA = (n: number) => (moneyHidden ? "EGP •••" : egp(n));
/** "+20 100 051 5039", "01000515039" and "201000515039" all become "201000515039" */
export const normPhone = (p?: string) => { const d = (p || "").replace(/\D/g, ""); return d.startsWith("00") ? d.slice(2) : d.startsWith("0") ? "20" + d.slice(1) : d; };
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

/** Money actually received for a booking (deposits, balances, minus refunds) */
export const paidAmount = (b: Booking) => {
  const paid = b.payment.amountPaid ?? (b.payment.status === "paid" || b.payment.status === "refunded" ? b.total : 0);
  return Math.max(0, paid - (b.payment.refunded || 0));
};
export const balanceDue = (b: Booking) => (b.status === "cancelled" ? 0 : Math.max(0, b.total - (b.payment.amountPaid ?? (b.payment.status === "paid" ? b.total : 0))));

export interface CartItem { key: string; serviceId: string; date: string; time: string; people: number; days: number }
export interface StaffUser { id: string; name: string; role: Role; via?: string }

interface Data {
  services: Service[]; bookings: Booking[]; consents: Consent[]; expenses: Expense[]; media: MediaItem[]; settings: Settings;
  staff: Staff[]; inventory: InventoryItem[]; cashcloses: CashClose[]; promos: Promo[]; logbook: LogEntry[]; posts: Post[]; customers: CustomerNote[]; roles: RoleDef[];
}

interface Store extends Data {
  ready: boolean;
  backend: Backend | null;
  selected: string | null;
  select(id: string | null): void;
  put<T extends { id: string }>(col: Collection, doc: T): Promise<void>;
  remove(col: Collection, id: string): Promise<void>;
  reload(): Promise<void>;
  isAdmin: boolean;
  user: StaffUser | null;
  setUser(u: StaffUser | null): void;
  setAdmin(v: boolean): void;
  cart: CartItem[];
  setCart(c: CartItem[]): void;
  guestEmail: string | null;
  setGuestEmail(e: string | null): void;
  seatsTaken(serviceId: string, date: string): Record<string, number>;
  can(p: Perm): boolean;
}

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

const load = <T,>(k: string, d: T, session = false): T => { try { const v = (session ? sessionStorage : localStorage).getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k: string, v: unknown, session = false) => { try { (session ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch { /* */ } };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Data>({
    services: DEFAULT_SERVICES, bookings: [], consents: [], expenses: [], media: [], settings: DEFAULT_SETTINGS,
    staff: [], inventory: [], cashcloses: [], promos: [], logbook: [], posts: DEFAULT_POSTS, customers: [], roles: DEFAULT_ROLES
  });
  const [selected, select] = useState<string | null>(null);
  const [user, setUserS] = useState<StaffUser | null>(() => load("dd:user", null));
  const [cart, setCartS] = useState<CartItem[]>(() => load("dd:cart", []));
  const [guestEmail, setGuestEmailS] = useState<string | null>(() => load("dd:guest", null));
  const setUser = (u: StaffUser | null) => { setUserS(u); save("dd:user", u); }; // stays signed in until they sign out
  const setCart = (c: CartItem[]) => { setCartS(c); save("dd:cart", c); };
  const setGuestEmail = (e: string | null) => { setGuestEmailS(e); save("dd:guest", e); };

  const loadAll = useCallback(async (b: Backend) => {
    const safe = async (c: Collection): Promise<any[]> => { try { return await b.list<any>(c); } catch { return []; } };
    const r = Object.fromEntries(await Promise.all(COLLECTIONS.map(async (c) => [c, await safe(c)]))) as Record<Collection, any[]>;
    const byDate = (a: any, z: any) => (a.createdAt < z.createdAt ? 1 : -1);
    setData({
      services: r.services.length ? r.services.sort((a, z) => a.sort - z.sort) : DEFAULT_SERVICES,
      bookings: r.bookings, consents: r.consents, expenses: r.expenses, media: r.media.sort(byDate),
      settings: { ...DEFAULT_SETTINGS, ...(r.settings.find((s) => s.id === "main") || {}) },
      staff: r.staff, inventory: r.inventory, cashcloses: r.cashcloses, promos: r.promos, logbook: r.logbook,
      posts: r.posts.length ? r.posts : DEFAULT_POSTS, customers: r.customers,
      roles: [...DEFAULT_ROLES.filter((d) => d.locked || !r.roles.some((x) => x.id === d.id)), ...r.roles.filter((x) => x.id !== "owner")]
    });
  }, []);

  useEffect(() => {
    let live = true;
    createBackend().then(async (b) => { if (!live) return; setBackend(b); await loadAll(b); setReady(true); });
    return () => { live = false; };
  }, [loadAll]);

  const put = useCallback(async <T extends { id: string },>(col: Collection, doc: T) => {
    setData((d) => {
      if (col === "settings") return { ...d, settings: { ...d.settings, ...(doc as any) } };
      const rows = (d[col] as any[]).filter((r) => r.id !== doc.id).concat(doc);
      if (col === "services") rows.sort((a: Service, b: Service) => a.sort - b.sort);
      if (col === "media") rows.sort((a: MediaItem, b: MediaItem) => (a.createdAt < b.createdAt ? 1 : -1));
      return { ...d, [col]: rows };
    });
    if (backend && (col === "services" || col === "posts")) {
      // first edit of the built-in defaults: persist the whole default list so nothing disappears
      const stored = await backend.list<any>(col).catch(() => []);
      if (stored.length === 0) for (const x of (col === "services" ? DEFAULT_SERVICES : DEFAULT_POSTS)) if (x.id !== doc.id) await backend.put(col, x);
    }
    await backend?.put(col, doc);
  }, [backend]);

  const canRef = useRef<(p: Perm) => boolean>(() => true);
  const remove = useCallback(async (col: Collection, id: string) => {
    if (user && col !== "roles" && col !== "staff" && !canRef.current("delete")) return; // role has no "Delete records"
    setData((d) => ({ ...d, [col]: (d[col] as any[]).filter((r) => r.id !== id) }));
    await backend?.remove(col, id);
  }, [backend, user]);

  const seatsTaken = useCallback((serviceId: string, date: string) => {
    const out: Record<string, number> = {};
    for (const b of data.bookings) if (b.serviceId === serviceId && b.date === date && b.status !== "cancelled") out[b.time] = (out[b.time] || 0) + b.people;
    return out;
  }, [data.bookings]);

  const can = useCallback((p: Perm) => {
    if (!user) return false;
    const role = data.roles.find((r) => r.id === user.role);
    return !!role && role.perms.includes(p);
  }, [user, data.roles]);

  canRef.current = can;
  const value = useMemo<Store>(() => ({
    ready, backend, ...data, selected, select, put, remove, reload: async () => { if (backend) await loadAll(backend); },
    isAdmin: !!user, user, setUser, setAdmin: (v: boolean) => setUser(v ? { id: "owner", name: "Owner", role: "owner" } : null),
    cart, setCart, guestEmail, setGuestEmail, seatsTaken, can
  }), [ready, backend, data, selected, put, remove, loadAll, user, cart, guestEmail, seatsTaken, can]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ---------------- hash router (works in Lovable, static hosting and the preview) ---------------- */
export type Route = "home" | "courses" | "dives" | "trips" | "rentals" | "gallery" | "book" | "admin" | "thanks" | "contact" | "manage" | "account" | "blog" | "post" | "quiz";
const ROUTES: Route[] = ["home", "courses", "dives", "trips", "rentals", "gallery", "book", "admin", "thanks", "contact", "manage", "account", "blog", "post", "quiz"];

export function useRoute(): [Route, (r: Route) => void] {
  const parse = () => { const h = location.hash.replace("#", "") as Route; return ROUTES.includes(h) ? h : "home"; };
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo({ top: 0 }); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return [route, (r) => { if (location.hash === "#" + r) window.scrollTo({ top: 0 }); else location.hash = r; }];
}
export const go = (r: Route) => { if (location.hash === "#" + r) window.scrollTo({ top: 0 }); location.hash = r; };
