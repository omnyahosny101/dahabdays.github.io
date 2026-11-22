/**
 * Two price lists, like the printed one at the center:
 *  • International visitors: euro prices (shown in EUR or USD, charged in EGP at the day's rate)
 *  • Egyptians and residents: fixed EGP prices, a little cheaper (ID shown at check-in)
 * Every amount handed to the rest of the app is EGP, so totals, Paymob and finance stay in one currency.
 * This file is shared by the website and the Paymob function, so keep it free of browser-only code.
 */
export type Market = "eg" | "intl";
export interface PriceVariant { id: string; label: string; group?: string; eur: number; egp: number }
export interface Priced {
  category: string; price: number; priceEur?: number; variants?: PriceVariant[];
  priceWeek?: number; priceWeekEur?: number;
}
export interface PriceLine { people: number; days?: number; variant?: string }

export const variantOf = (s: Priced, id?: string) => (s.variants?.length ? s.variants.find((v) => v.id === id) || s.variants[0] : undefined);

/** One unit (per person / per day / per package) in EGP */
export function unitEgp(s: Priced, market: Market, eurRate: number, variant?: string) {
  const v = variantOf(s, variant);
  if (market === "eg") return v ? v.egp : s.price;
  const eur = v ? v.eur : s.priceEur ?? s.price / eurRate;
  return Math.round(eur * eurRate);
}

/** Rentals: per-day price, capped at the weekly price for each started week (10/day, 50/week on the price list) */
function rentalUnits(s: Priced, market: Market, eurRate: number, days: number, dayPrice: number) {
  const week = market === "eg" ? s.priceWeek : s.priceWeekEur != null ? Math.round(s.priceWeekEur * eurRate) : undefined;
  if (!week) return dayPrice * days;
  const weeks = Math.floor(days / 7), rest = days % 7;
  return weeks * week + Math.min(rest * dayPrice, week);
}

export function lineEgp(s: Priced, it: PriceLine, market: Market, eurRate: number) {
  const unit = unitEgp(s, market, eurRate, it.variant);
  if (s.category === "rental") return rentalUnits(s, market, eurRate, Math.max(1, it.days || 1), unit) * it.people;
  return unit * it.people;
}

/** "From" price for cards */
export function fromEgp(s: Priced, market: Market, eurRate: number) {
  if (!s.variants?.length) return unitEgp(s, market, eurRate);
  return Math.min(...s.variants.map((v) => unitEgp(s, market, eurRate, v.id)));
}
