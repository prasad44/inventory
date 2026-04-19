# VoltHub — Electronics E-commerce

Next.js + Supabase storefront for Sri Lankan electronics (JBL, Sony, Philips, Anker, Xiaomi, solar, lighting, smart home). Single-seller, guest-friendly checkout, COD + bank transfer.

## Stack

- Next.js 15.5 (App Router, React 19)
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth + Storage + RLS)
- next-themes (dark/light)
- Vitest for unit tests, Playwright for E2E

## Prerequisites

- Node.js 20+
- A Supabase project (URL + anon key + service-role key)
- Optional: WhatsApp number for the quick-buy button

## Setup

1. Clone + install

   ```
   git clone <repo>
   cd inventory
   npm install
   ```

2. Copy env template

   ```
   cp .env.example .env.local
   ```

   Fill in Supabase credentials (see `.env.example` for descriptions).

3. Apply Supabase migrations

   Either:
   (a) `supabase db push` (if you have the Supabase CLI linked), or
   (b) Apply each file under `supabase/migrations/` in order via the SQL editor.

   Key migrations to check after the initial baseline (001–004):
   - 010–018: electronics schema + RLS
   - 020–024: seed data (delivery zones, categories, brands, products, deals, reviews, recommendations)
   - 031: review-images storage bucket
   - 032: alert DELETE RLS
   - 033: store_settings singleton table

4. Run dev

   ```
   npm run dev
   ```

   Open http://localhost:3000

## Seed + admin account

1. Sign up once at `/login` (creates a `profiles` row as `viewer`).
2. Promote yourself to admin in the DB:

   ```sql
   update profiles set role = 'admin' where id = '<your user id>';
   ```

3. Admin pages live at `/dashboard`, `/inventory`, `/brands`, `/flash-deals`, `/reviews`, `/delivery-zones`, `/orders`, `/settings`.

## Routes

### Customer (public)

- `/` — home
- `/c?cat=audio` — category (query-param, see URL notes below)
- `/p?slug=jbl-flip-6` — product detail
- `/brand?slug=jbl` — brand page
- `/search?q=jbl` — search results
- `/compare?ids=a,b,c` — up to 4-product compare
- `/cart` · `/checkout` · `/order?id=...`
- `/account/*` — orders, wishlist, addresses, alerts, reviews, profile

### Admin (auth + role=manager|admin)

- `/dashboard` · `/inventory` · `/orders` · `/pos`
- `/brands` · `/flash-deals` · `/reviews` · `/delivery-zones`
- `/settings` — store-wide settings

## URL notes (query-param routes)

The customer-facing shop uses `?slug=`, `?cat=`, `?id=` query-param URLs instead of path segments (`/p/jbl-flip-6`). This is a workaround for a Vercel platform bug where dynamic route functions hang indefinitely for this project.

When Vercel resolves that bug (or this project is moved off Vercel), it's a ~30-minute refactor to switch back to clean path URLs.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm start` — production server
- `npm run lint` — ESLint
- `npm test` — unit tests (vitest)
- `npm run test:watch` — vitest in watch mode
- `npm run e2e` — Playwright E2E tests (see below)
- `npm run e2e:ui` — Playwright UI runner

## Tests

### Unit

Vitest covers pure helpers in `lib/` (format, delivery math, solar calculator, kelvin-to-rgb, cart merge, compare, countdown). 51 tests.

### E2E

Playwright covers a happy-path smoke: home → category → PDP → add to cart → checkout → order confirmation. See `e2e/` directory.

First-time browser install (one-off):

```
npx playwright install chromium
```

Run with a live dev server:

```
npm run dev
# separate terminal
npm run e2e
```

The smoke test hits real Supabase, so the DB needs the seed migrations applied.

## Deployment

Deployed to Vercel at https://pdinventory.vercel.app. Main branch auto-deploys.

Environment variables must be set in the Vercel dashboard (see `.env.example`). The Supabase service-role key is server-only and must NOT be exposed as `NEXT_PUBLIC_`.

### Known Vercel issue

Dynamic route segments (`/[slug]`) hang indefinitely on this project. Shop pages use query-param URLs as a workaround. See URL notes above.

## Project docs

- `docs/plans/2026-04-19-electronics-ecom-design.md` — approved design
- `docs/plans/2026-04-19-electronics-ecom-implementation.md` — implementation plan

## License

Private project.
