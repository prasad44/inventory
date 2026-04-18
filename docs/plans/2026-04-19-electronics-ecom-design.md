# Electronics E-Commerce Transformation — Design

**Date:** 2026-04-19
**Author:** prasad44 + Claude (brainstorm)
**Status:** Approved — ready for implementation plan

## 1. Summary

Transform the existing Next.js inventory management app into a **single-seller electronics e-commerce storefront** for the Sri Lankan market. Selling headsets, JBL speakers, LED lights, solar lights, and other electronics. Inspired by Wildberries' density and faceted-filter UX, but with a modern electronics aesthetic (think Best Buy × Nothing) rather than the Wildberries visual style.

Standard MVP scope with seven product-differentiating features tailored for Sri Lanka.

## 2. Key Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Visual direction | Modern electronics, Wildberries-inspired density and filters, not the chaotic look |
| 2 | Business model | Single-seller store |
| 3 | MVP scope | Standard: filters, reviews with photos, wishlist, recently viewed, recommendations, flash deals, comparison, user account |
| 4 | Backend | Extend existing Supabase schema; seed realistic electronics |
| 5 | Currency | LKR (Sri Lankan Rupee) |
| 6 | Checkout | Mock + COD + Bank Transfer (Card "coming soon") |
| 7 | Auth | Guest checkout + optional account (reviews/wishlist/alerts require login) |
| 8 | Differentiators | Warranty badge, WhatsApp quick-buy, delivery estimator, stock/price alerts, solar savings calculator, LED color-temp preview, dark mode |

## 3. Vision & Brand

- **Working name:** VoltHub (placeholder — rename later)
- **Tagline:** *Genuine electronics. Islandwide delivery.*

**Palette (light):** off-white `#FAFAFA`, near-black text `#0A0A0A`, electric violet accent `#6D28D9` (CTAs, prices, active filters), alert red `#DC2626` (discount badges, urgency), amber `#F59E0B` (ratings), neutrals `#E5E5E5` / `#A3A3A3`.

**Palette (dark):** zinc-950 base, zinc-200 text, violet shifts to `#8B5CF6` for contrast, card backgrounds zinc-900.

**Typography:** Inter (body), Inter Display or Manrope (headings). Drop Playfair. Tabular numerals for prices.

**Density:** tight — 220px product cards, 4-6 col grid at desktop, 2 col mobile. Compact line heights. Card content: image, brand tag, name (2 lines max), rating, price (strikethrough original if sale), discount badge, low-stock warning, wishlist heart, quick-add on hover.

**Component vibe:** shadcn defaults with `rounded-md` corners, thin 1px borders, subtle hover shadows, no big blurs/orbs. Product-forward, not decorative.

## 4. Information Architecture

### Public routes

```
/                          Home (flash deals, featured cats, best sellers)
/c/[slug]                  Category page (PLP w/ filters)
/c/[parent]/[child]        Sub-category
/p/[slug]                  Product detail page
/search?q=...              Search results
/brand/[slug]              Brand page
/deals                     Flash deals hub
/compare?ids=...           Comparison view (2-4 product ids)
/cart                      Full cart page (keep sheet for quick view)
/checkout                  Checkout flow
/order/[id]                Order confirmation / tracking
/account                   Nested: orders, wishlist, alerts, addresses, reviews, profile
/login /signup             Auth
/wishlist/[share_token]    Public shared wishlist (stretch)
```

Top-level nav: **Audio · Lighting · Solar · Accessories · Smart Home · Deals**. Mega-menu on hover.

### Category tree (seeded)

```
Audio
 ├─ Headphones (over-ear, on-ear)
 ├─ Earbuds & Earphones
 ├─ Bluetooth Speakers
 └─ Soundbars
Lighting
 ├─ LED Bulbs
 ├─ LED Strips
 ├─ Smart Lights
 └─ Decorative Lighting
Solar
 ├─ Solar Garden Lights
 ├─ Solar Panels
 ├─ Solar Power Banks
 └─ Solar Street Lights
Accessories
 ├─ Cables & Chargers
 ├─ Power Banks
 ├─ Cases & Mounts
 └─ Memory Cards
Smart Home
 ├─ Smart Plugs
 ├─ Security Cameras
 └─ Smart Assistants
```

### User journeys

1. **Browse → buy:** home → category → PLP (filter) → PDP → cart → checkout (guest) → confirmation
2. **Research → compare → buy:** search → PLP → compare 3 → `/compare` → winner PDP → checkout
3. **Discover → save → return:** home (flash deal) → PDP → wishlist (prompts signup) → email alert → return → buy
4. **Direct WhatsApp:** PDP → WhatsApp button → DM → order placed externally (click logged)

## 5. Data Model

Rename route group `(store)` → `(shop)`. Schema is additive only; no destructive migrations.

### Extended `products` columns

```sql
brand           text
slug            text unique not null
specs           jsonb
images          text[]                  -- gallery; primary = images[0]
discount_pct    int default 0
rating_avg      numeric(2,1) default 0  -- denormalized from reviews
rating_count    int default 0
warranty_months int default 0
is_genuine      boolean default true
meta_title      text
meta_desc       text
```

Categories gain `slug`, `icon` (lucide name), `sort_order`. `parent_id` now used for real hierarchy.

### New tables

- **`brands`** — id, name, slug, logo_url, description, is_featured, sort_order, created_at
- **`reviews`** — id, product_id, user_id, rating (1-5), title, body, images[], verified_purchase, helpful_count, status enum('pending','approved','rejected') default 'approved', created_at
- **`wishlists`** — id, user_id, product_id, created_at, unique(user_id, product_id)
- **`recently_viewed`** — id, session_id, user_id nullable, product_id, viewed_at; cap 20 per session/user
- **`flash_deals`** — id, product_id, discount_pct, starts_at, ends_at, max_units nullable, sold_units default 0, is_active
- **`stock_alerts`** — id, product_id, email, user_id nullable, notified_at nullable, unique(product_id, email)
- **`price_alerts`** — id, product_id, email, user_id nullable, target_price nullable, notified_at nullable
- **`addresses`** — id, user_id, full_name, phone, line1, line2, city, district, postal_code, is_default
- **`cart_items`** — id, session_id nullable, user_id nullable, product_id, quantity, added_at
- **`recommendations`** — product_id, related_product_id, score, pk(product_id, related_product_id)
- **`delivery_zones`** — id, city, district, est_min_days, est_max_days, delivery_fee
- **`wa_clicks`** — id, product_id, session_id, user_id nullable, clicked_at
- **`pending_notifications`** — id, type enum('stock','price'), alert_id, email, subject, body, sent_at nullable

### Extended `orders` / `order_items`

```sql
-- orders
payment_method      text enum('cod','bank_transfer','card')
payment_status      text enum('pending','paid','failed')
shipping_address_id fk nullable
guest_email         text nullable
guest_phone         text nullable
delivery_city       text
delivery_fee        numeric
delivery_estimate   text          -- "2-4 days" snapshot
customer_notes      text

-- order_items
discount_pct_snapshot int default 0
serial_number         text nullable
```

### Triggers

- On `reviews` insert/update/delete → recompute `products.rating_avg` and `products.rating_count`.
- On `orders` completion → increment `flash_deals.sold_units` for matching products.
- On `products.quantity_in_stock` transition 0 → >0 → enqueue rows into `pending_notifications` from matching `stock_alerts`.
- On product effective-price drop → enqueue from matching `price_alerts`.

### RLS

- `reviews` — anyone reads approved; authenticated users insert/update their own; admins moderate all.
- `wishlists` / `stock_alerts` / `price_alerts` / `addresses` — users read/write own; admin reads all.
- `flash_deals` / `brands` / `recommendations` / `delivery_zones` — public read, admin write.
- `cart_items` — user reads/writes own by `user_id`; guests by `session_id` (cookie).
- `wa_clicks` / `pending_notifications` — insert public, read admin.

### Seed data

- 8 brands: JBL, Sony, Philips, Anker, Xiaomi, Bose, Sennheiser, one solar brand
- ~50 products across all categories, realistic LKR prices, multi-image galleries (brand press photos or Unsplash), populated specs/brand/warranty
- 6-8 active flash deals
- 25 SL delivery zones (districts + major cities) with realistic fees and ranges
- ~40 seeded reviews spread across popular products
- Recommendation edges by (same category + brand boost + price similarity)

## 6. Page Designs

### Home (`/`)
Announcement bar · sticky header w/ search + account + cart + theme toggle · rotating hero (3-4 slides, compact) · category tiles row · flash deals strip (live countdown) · featured brands row · "Trending in Audio" rail · "Trending in Lighting" rail · "Recently viewed" rail (conditional) · value props strip · footer.

### Category / PLP (`/c/[slug]`, `/search`)
Two-col desktop: sticky left rail (category tree, price range dual-slider, brand multi-select, rating, discount toggle, in-stock toggle, category-specific filters, "Clear all") + right area (breadcrumbs, H1, count, sort dropdown, 4-col grid, infinite scroll). Mobile: filters in bottom-sheet drawer.

### Product Detail (`/p/[slug]`)
Two-col desktop: left gallery (thumbs + zoom) + right info (brand · name · rating link · price block with strikethrough + discount + "You save" · **warranty/genuine badges** · stock status · qty + Add to Cart + **WhatsApp Buy** · **delivery estimator** · stock/price alert links · wishlist/compare icons · highlight bullets).

Below (tabs/sections): Description · Specs (rendered from `specs` JSON) · Reviews (breakdown chart, filters, cards, write a review CTA) · Q&A stub/hidden · **category-specific widget** (solar calculator or LED temp preview) · Frequently bought together (2-3 + bundle price) · You might also like (12-card rail).

### Cart sheet + `/cart`
Keep slide-over sheet. Add `/cart` page with delivery estimator and "Apply coupon" (disabled).

### Checkout (`/checkout`)
Single page: Contact → Shipping address (25 SL districts) → Payment method (COD ✓, Bank Transfer ✓, Card greyed) → Order summary right rail → Place order.

Post-order: `/order/[id]` with confirmation, items, payment instructions (bank transfer), delivery estimate, status.

### Account (`/account`)
Tabs: Orders · Wishlist · Addresses · Alerts · Reviews · Profile.

### Compare (`/compare?ids=`)
Horizontal scroll table; rows auto-derived from common spec keys; best-value highlights (cheapest price, highest rating, longest battery).

## 7. Feature Specs (Standard MVP)

### Reviews & Ratings
Write once per product (logged in); 1-5 stars + title + body + up to 4 images to Supabase Storage (`review-images`); `verified_purchase` if the user has a completed order containing the product; sort by helpful_count; filter chips (With photos, Verified, rating tiers); DB trigger keeps `products.rating_avg/count` in sync; moderation queue exists but default status is approved for MVP.

### Wishlist
Heart on cards + PDP; logged-out click → "sign in to save" modal with inline signup; `/account/wishlist` with remove + move-to-cart; optional share-token public URL (stretch).

### Recently Viewed
On PDP load, upsert `(session_id, product_id, now)`; prune to 20; link `user_id` if logged in; home rail renders when history exists.

### Recommendations
`recommendations(product_id, related_product_id, score)`; seeded by `same_category + brand_boost + price_similarity`; swap for real co-view/co-purchase later; PDP rail top 12; cart FBT top 3.

### Flash Deals
`active_flash_deals` view filters by time + sold_units; home strip queries it; PDP shows countdown when active; order-completion trigger increments `sold_units`.

### Comparison
localStorage array of ids (max 4); floating "Compare (N)" pill; `/compare?ids=` auto-derives shared spec keys; numeric rows highlight best value.

### Search + Autocomplete
`/api/search?q=...` ILIKE over product name, brand, category; autocomplete shows 5 products + 3 cats + 3 brands; full page `/search` reuses PLP. Postgres ILIKE enough for MVP; `pg_trgm` later.

### Persisted Cart
`cart_items` keyed by `session_id` (guests) or `user_id` (logged in); merge guest → user on login; stock revalidated at checkout.

## 8. Differentiating Features

### F1. Warranty / Genuine-Stock Badge
Pill row on PDP: `✓ {N}-month warranty · ✓ Genuine stock, direct from authorized distributor · ✓ Verify authenticity at delivery`. Optional serial number on `order_items` at dispatch time for verification. Small ✓ icon on cards when `is_genuine && warranty_months > 0`.

### F2. WhatsApp Quick-Buy
Secondary green CTA on PDP + icon on cards. Deep link `https://wa.me/{STORE_WA_NUMBER}?text=...` with product + price + link + blank fields for name/city. Click logged to `wa_clicks` for analytics. `STORE_WA_NUMBER` in env (overridable via admin settings).

### F3. Delivery Estimator
`delivery_zones` seeded with 25 SL cities/districts; widget on PDP/cart/checkout: city select → "Arrives {date range} · Rs {fee} delivery". Dates skip Sundays. Free delivery when subtotal ≥ Rs 5,000 (threshold in admin settings).

### F4. Stock & Price Alerts
Out-of-stock PDP → inline "Notify when back in stock" form. In-stock PDP → "Notify when price drops" popover with optional target price. DB triggers enqueue into `pending_notifications`. Sending stubbed to console log / admin "Send alerts" button for MVP; real Resend wiring is a follow-up.

### F5. Solar Savings Calculator
On solar PDPs only. Inputs: daily usage hours, LKR/kWh (default Rs 35 — CEB tier 2), replaced-bulb wattage. Formula:
```
daily_kWh_saved = (replaced_W × hours) / 1000
annual_savings  = daily_kWh_saved × 365 × rate
payback_months  = ceil(product_price / (annual_savings / 12))
```
Displays "You save **Rs {annual}/year** — pays for itself in **{payback} months**." with animated counters. `calculator_meta` in product `specs`.

### F6. LED Color-Temperature Preview
On LED PDPs when `specs.color_temp_min/max` present. Slider 2700K → 6500K with preview box background approximating black-body temp; anchor labels (Warm White, Soft White, Daylight, Cool Daylight). Pure client-side; no API.

### F7. Dark Mode
Header toggle; system-default initial; localStorage override. Tailwind `dark:` variants; CSS vars in `globals.css`. Every new component includes dark equivalents. Logo swaps dark variant; product imagery unchanged.

## 9. Admin / Inventory Changes (minimal)

**Product form:** add brand (select w/ inline add), slug (auto from name), discount_pct, warranty_months, is_genuine, image gallery (drag-drop reorder, stores `images[]`), specs editor (category-driven predefined keys).

**New admin pages:** `/dashboard/brands`, `/dashboard/flash-deals`, `/dashboard/reviews` (moderation), `/dashboard/delivery-zones`.

**Orders:** `payment_method` filter, "Mark as paid" for bank transfer, optional serial number at dispatch.

**Dashboard home:** widgets for top-sellers this week, pending reviews, pending bank transfers, expiring flash deals.

**Settings:** store WA number, free delivery threshold, bank details.

**Not changing:** auth flow, roles, POS, suppliers, audit log, dashboard shell, inventory list/detail (except form additions).

## 10. Implementation Phases

| Phase | Scope | Estimate |
|-------|-------|----------|
| 0 | Foundations — route rename, palette swap, fonts, dark-mode toggle, next-themes | 1 day |
| 1 | Data & seeding — migrations, triggers, RLS, seed scripts, types gen | 1-2 days |
| 2 | Shop shell & home — layout, header/footer, hero, rails, countdowns | 2 days |
| 3 | Browse & discover — PLP, filters, search w/ autocomplete, brand pages | 3 days |
| 4 | PDP — gallery, info, tabs, F1-F4, recently-viewed tracking, recommendations, conditional F5/F6 | 3 days |
| 5 | Cart & checkout — persisted cart, `/cart`, `/checkout`, `/order/[id]` | 2 days |
| 6 | Reviews, wishlist, comparison, account | 3 days |
| 7 | Admin extensions | 1-2 days |
| 8 | Polish & QA — skeletons, errors, SEO, a11y, perf, dark sweep, mobile sweep | 1-2 days |

**Total: ~16-19 working days (~3-4 calendar weeks).**

Each phase is independently shippable — no broken half-done states between phases.

## 11. Out of Scope (Follow-ups)

Explicitly deferred:
- Multi-seller marketplace
- Product variants (color/model/capacity)
- Q&A on PDPs (column reservation only, UI hidden)
- Configurable bundle offers (only simple recommendation triplets)
- Installment payments
- Pickup points / locker delivery
- Real order tracking (courier API integration)
- Price history chart
- Compatibility checker
- Coupons / promo codes
- Phone OTP login (textlk-otp skill)
- Real payment gateway (PayHere/Stripe/Paddle)
- Real email delivery for alerts (Resend wiring)
- ML-based recommendations (heuristic seed for now)
- Admin redesign beyond minimal extensions
- Loyalty points / referrals
- Gift wrapping
- AR preview
- Spec-sheet comparison hardening across brands
