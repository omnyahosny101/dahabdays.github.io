# Dahab Days — website, booking & owner dashboard

React + Vite + TypeScript + Tailwind, with Supabase for data and Paymob for payments — the same stack Lovable uses, so the owner can keep editing it there.

## What's inside
| Area | Where |
|---|---|
| Home (hero video, programs, reels, dive-site map, trips, clients, gallery, FAQ) | `src/pages/Home.tsx` |
| Courses / Guided dives / Trips / Rentals / Gallery / Contact | `src/pages/Catalog.tsx` |
| Booking wizard, Paymob checkout, confirmation, extra participants | `src/pages/Book.tsx` |
| Bilingual medical questionnaire + e-signature | `src/components/ConsentForm.tsx` |
| Signed PDF (participant + center signatures) | `src/lib/pdf.ts` |
| Owner dashboard: bookings, consents, finance, services, media, settings | `src/pages/Admin.tsx` |
| Default programs, prices, medical questions, FAQ | `src/lib/catalog.ts` |
| Brand colours & fonts | `tailwind.config.js`, `index.html` |
| Database schema + security rules | `supabase/migrations/001_dahab_days.sql` |
| Paymob intention + webhook | `supabase/functions/*` |

## Run locally
```bash
npm install
npm run dev        # demo mode: data in this browser. Dashboard: owner phone +20 100 051 5039 (code shown on screen) or PIN "dahab"
```

## Features
**Guests:** trip cart (several activities + extras in one payment), live seats left per time slot, deposit or full payment or pay at the center, promo codes, self-service reschedule/cancel (#manage), Google Calendar + .ics with a 1-day reminder, airport/hotel transfer add-ons, Arabic/English (RTL) switch, EGP/USD/EUR display, "Which course fits me?" quiz, live sea and wind (Open-Meteo), diver account with digital logbook and purchasable photo/video packages (#account), real Google reviews, WhatsApp/email confirmations with the signed PDF, blog and dive-site guides.

**Staff:** roles (owner / manager / instructor), weekly schedule with instructor assignment and double-booking warnings, printable daily roster (PDF/CSV) with gear sizes, medical flags and money due, customer CRM with notes and tags, equipment inventory by size with service-due tracking, daily cash close, payroll with commission, refunds (Paymob API), deposits and balances, abandoned-checkout follow-up on WhatsApp, finance exports (Excel + PDF), promo codes, blog editor, Meta Pixel + GA4.

## Go live (Supabase + Paymob)
1. **Supabase** — create a project, open SQL Editor, run `supabase/migrations/001_dahab_days.sql`, then `002_features.sql`, then `003_team_access.sql`.
2. **Dashboard login (phone code or Gmail)** — in Supabase › Authentication › Providers:
   - **Phone**: turn on and connect an SMS provider (Twilio, MessageBird, Vonage or Textlocal). Staff get a 6-digit code by SMS.
   - **Google**: turn on and paste a Google OAuth client ID and secret (Google Cloud › APIs & Services › Credentials, redirect URL `https://<project>.supabase.co/auth/v1/callback`).
   - **URL configuration**: add the site address (e.g. `https://dahabdays.github.io`) to Site URL and Redirect URLs.
   - The owner signs in with the phone/Gmail saved in Dashboard › Settings › Owner sign-in (first time: run `insert into settings (id, data) values ('main', '{"ownerPhone":"+201000515039","ownerEmail":"owner@gmail.com"}') on conflict (id) do update set data = settings.data || excluded.data;`).
   - Everyone else: Dashboard › **Team and roles** › Give access (name, phone and/or Gmail, role). Roles are fully editable: tick which pages each role can open and whether it can refund, delete, export or see money. The database enforces the same permissions (row-level security), not just the screen.
3. **Env** — copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings › API). The app switches to live mode automatically.
4. **Paymob** — in the Paymob dashboard (Settings › Account info / Developers) copy your Secret key, Public key and HMAC secret, and the Integration IDs of the methods you enabled (card, mobile wallet…). Start with **test** keys.
5. **Functions**
   ```bash
   supabase secrets set PAYMOB_SECRET_KEY=... PAYMOB_PUBLIC_KEY=... PAYMOB_HMAC_SECRET=... PAYMOB_INTEGRATION_IDS=1234567,7654321
   supabase functions deploy paymob-intention
   supabase functions deploy paymob-webhook --no-verify-jwt
   supabase functions deploy paymob-refund
   supabase functions deploy notify --no-verify-jwt
   supabase functions deploy reminders --no-verify-jwt
   supabase functions deploy google-reviews --no-verify-jwt
   ```
   Optional secrets for the extras:
   - WhatsApp confirmations and reminders (Meta WhatsApp Cloud API): `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TEMPLATE` (needs a document header + 3 body variables), `WHATSAPP_REMINDER_TEMPLATE`. Templates must be approved by Meta first.
   - Email confirmations (Resend): `RESEND_API_KEY`, `EMAIL_FROM`, `SITE_URL`.
   - Google reviews: `GOOGLE_PLACES_KEY`, `GOOGLE_PLACE_ID`.
   - Daily reminders: enable pg_cron + pg_net and run the commented `cron.schedule` line at the end of `002_features.sql`.
   - Guest sign-in for the diver account uses Supabase magic links: Authentication › URL configuration › add your site URL.
   The intention sets `notification_url` to the webhook automatically; you can also set it as the transaction-processed callback on each integration in Paymob.
6. **Test** a booking with Paymob's test card, confirm the booking turns *Paid* in the dashboard, then switch to live keys.
7. **Content** — Dashboard › Settings: add the center signature (forms are then countersigned automatically) and your real Paymob fee rate. Dashboard › Media: upload the hero video, reels, gallery and client photos. Dashboard › Services: adjust prices.

## Notes
- Photos and videos: until the owner uploads their own, the site uses free Pexels stock (pexels.com/license) listed in `src/lib/stock.ts`. If a stock file ever fails to load, the slot falls back to its illustration.
- Guest photo packages are hidden from the public by database rules, but files in the public `media` bucket are reachable by direct URL. For strict paywalling move them to a private bucket and serve signed URLs.
- SEO: the site uses hash routes so it works anywhere. For best Google indexing of the blog, switch to path routes (React Router `BrowserRouter`) when hosting on Lovable/Netlify/Vercel — ask Lovable: "switch the hash router to React Router with real paths".
- Revenue counts bookings that are paid (online, or cash marked paid) by their activity date. Net income = revenue − expenses − payment-gateway fees.
- Consent forms hold ID numbers and health answers: only the signed-in team can read them (row-level security). Have the release wording reviewed by an Egyptian lawyer before going live.
- Build for any static host: `npm run build` → `dist/`.
