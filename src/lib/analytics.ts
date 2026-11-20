/* Meta Pixel + Google Analytics 4. IDs come from Dashboard › Settings; nothing loads until they're set. */
declare global { interface Window { fbq?: any; _fbq?: any; gtag?: any; dataLayer?: any[] } }
let started = "";

export function initAnalytics(pixelId: string, ga4Id: string) {
  const key = pixelId + "|" + ga4Id;
  if (!pixelId && !ga4Id) return;
  if (started === key) return;
  started = key;
  try {
    if (pixelId && !window.fbq) {
      const f: any = (window.fbq = function (...a: any[]) { f.callMethod ? f.callMethod(...a) : f.queue.push(a); });
      f.push = f; f.loaded = true; f.version = "2.0"; f.queue = []; window._fbq = f;
      const s = document.createElement("script"); s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js"; document.head.appendChild(s);
      window.fbq("init", pixelId); window.fbq("track", "PageView");
    }
    if (ga4Id && !window.gtag) {
      const s = document.createElement("script"); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("js", new Date()); window.gtag("config", ga4Id);
    }
  } catch { /* blocked by the host page — fine */ }
}

type Ev = "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | "Lead" | "PageView";
const GA: Record<Ev, string> = { ViewContent: "view_item", AddToCart: "add_to_cart", InitiateCheckout: "begin_checkout", Purchase: "purchase", Lead: "generate_lead", PageView: "page_view" };

export function track(ev: Ev, p: { value?: number; name?: string; id?: string; ref?: string } = {}) {
  try {
    window.fbq?.("track", ev, { value: p.value, currency: "EGP", content_name: p.name, content_ids: p.id ? [p.id] : undefined });
    window.gtag?.("event", GA[ev], { value: p.value, currency: "EGP", transaction_id: p.ref, items: p.id ? [{ item_id: p.id, item_name: p.name }] : undefined });
  } catch { /* */ }
}
