export type Category = "course" | "fun" | "tour" | "rental" | "addon";

export type SceneKey =
  | "reef" | "bluehole" | "canyon" | "diver" | "tawilat" | "wadi" | "lagoon" | "pools"
  | "gear" | "sinai" | "night" | "turtle" | "classroom" | "bells" | "ghazala";

export interface Service {
  id: string;
  category: Category;
  name: string;
  short: string;
  description: string;
  includes: string[];
  duration: string;
  price: number;            // EGP
  unit: string;             // "per person", "per day", ...
  scene: SceneKey;          // illustrated fallback picture
  mediaUrl?: string;        // owner photo/video replaces the scene
  requiresConsent: boolean; // water activities need the signed medical waiver
  slots: string[];          // start times
  capacity: number;         // per slot
  minAge?: number;
  level?: string;
  badge?: string;
  active: boolean;
  sort: number;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PayStatus = "unpaid" | "deposit" | "paid" | "refunded";

export interface PaymentEvent { at: string; amount: number; method: "paymob" | "cash" | "card-terminal"; note?: string }

export interface Booking {
  id: string;
  ref: string;
  orderId?: string;          // several bookings paid together (trip cart)
  serviceId: string;
  serviceName: string;
  category: Category;
  date: string;     // YYYY-MM-DD
  time: string;
  people: number;
  days?: number;   // rentals
  total: number;
  customer: { name: string; email: string; phone: string; country: string };
  notes?: string;
  status: BookingStatus;
  payment: {
    method: "paymob" | "cash"; status: PayStatus; paidAt?: string; txnId?: string; fee?: number;
    plan?: "full" | "deposit" | "later"; dueNow?: number; amountPaid?: number; refunded?: number; refundReason?: string;
    history?: PaymentEvent[];
  };
  discount?: number;          // promo discount applied to this booking (EGP)
  promo?: string;
  staffId?: string;           // assigned instructor / guide
  gear?: { wetsuit?: string; bcd?: string; fins?: string; weight?: string };
  followedUp?: string;        // abandoned-booking follow-up timestamp
  cancelledBy?: "guest" | "staff";
  consentId?: string;
  createdAt: string;
  sample?: boolean;
}

export type YesNo = "yes" | "no";

export interface Consent {
  id: string;
  bookingId?: string;
  bookingRef?: string;
  program: string;
  fullName: string;
  dob: string;
  nationality: string;
  idNumber: string;
  phone: string;
  email: string;
  emergencyName: string;
  emergencyPhone: string;
  arrival: string;
  departure: string;
  accommodation: string;
  certLevel: string;
  lastDive: string;
  healthNotes: string;
  medications: string;
  answers: Record<string, YesNo>;
  acks: Record<string, boolean>;
  signature: string;        // PNG data URL
  signedAt: string;
  centerSignature?: string;
  centerSigner?: string;
  countersignedAt?: string;
  needsClearance: boolean;  // any "yes" → physician sign-off before water
  createdAt: string;
  sample?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
  serviceId?: string;
  sample?: boolean;
}

export type MediaRole = "hero" | "gallery" | "reel" | "client" | "guest";

export interface MediaItem {
  id: string;
  kind: "image" | "video";
  role: MediaRole;
  url: string;
  assetId?: string;
  caption: string;
  tag: string;      // Underwater, Courses, Trips, Clients, Team...
  bookingRef?: string;  // guest photo/video packages
  guestEmail?: string;
  createdAt: string;
}

export type Role = string; // role id (see RoleDef)
export const PAGE_PERMS = ["overview", "bookings", "schedule", "roster", "customers", "consents", "finance", "cash", "team", "inventory", "promos", "blog", "services", "media", "settings"] as const;
export const ACTION_PERMS = ["refunds", "delete", "export", "seeMoney"] as const;
export type Perm = (typeof PAGE_PERMS)[number] | (typeof ACTION_PERMS)[number];
export interface RoleDef { id: string; name: string; perms: Perm[]; locked?: boolean }
export interface Staff { id: string; name: string; role: Role; pin: string; phone: string; email?: string; commissionPct: number; baseSalary: number; active: boolean }
export interface InventoryItem { id: string; type: string; size: string; code: string; status: "available" | "out" | "service" | "retired"; lastService?: string; notes?: string }
export interface CashClose { id: string; date: string; float: number; expected: number; counted: number; terminal: number; variance: number; notes: string; by: string; at: string }
export interface Promo { id: string; code: string; kind: "pct" | "amount"; value: number; active: boolean; expires?: string; maxUses?: number; used: number; note?: string }
export interface LogEntry { id: string; email: string; date: string; site: string; depth: number; minutes: number; buddy?: string; notes?: string; verified?: boolean; bookingRef?: string }
export interface Post { id: string; slug: string; title: string; titleAr?: string; excerpt: string; body: string; cover?: string; scene: SceneKey; category: "Dive site guide" | "Trip guide" | "News"; published: boolean; date: string }
export interface CustomerNote { id: string; notes: string; tags: string[] }

export interface Settings {
  centerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  gatewayFeePct: number;
  gatewayFixed: number;
  centerSigner: string;
  centerSignature: string;
  adminPin: string;
  /** The owner always signs in with this phone (SMS code) or this Gmail */
  ownerPhone?: string;
  ownerEmail?: string;
  depositPct: number;
  rates: { USD: number; EUR: number };   // EGP per 1 unit, fallback when live rates are unavailable
  photoPackagePrice: number;
  pixelId: string;
  ga4Id: string;
  googleReviewsUrl: string;
  freeCancelHours: number;
  heroVideo: string;
}
