# Electronics E-Commerce Transformation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pivot the existing Next.js 16 + Supabase inventory app into a single-seller electronics e-commerce storefront for the Sri Lankan market, with Wildberries-inspired density, modern electronics aesthetic, LKR pricing, COD + Bank Transfer checkout, guest-friendly accounts, and seven local differentiators.

**Architecture:** Additive database migrations extend the current schema (products/orders/categories/suppliers/profiles) with new tables for reviews, wishlists, flash deals, alerts, addresses, cart, recommendations, delivery zones, and WhatsApp click logs. The existing admin dashboard (`(dashboard)` route group) stays functional with minimal form extensions. The customer-facing storefront under `(shop)` (renamed from `(store)`) is rebuilt with a new electronics palette, shadcn/Tailwind components, and feature modules plugged in per phase.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 (config in `globals.css` via `@theme inline`) · shadcn/ui (new-york) · lucide-react · Supabase (Postgres + Auth + Storage + RLS) · next-themes (to add) · Vitest + React Testing Library (to add) · Playwright (Phase 8 only)

**Design source:** `docs/plans/2026-04-19-electronics-ecom-design.md`

---

## Testing Strategy

Current repo has no test runner. We'll add **Vitest** + **@testing-library/react** for unit tests of business logic (delivery calc, solar calc, cart merge, pricing) and for small component logic. UI rendering verified manually via `npm run dev`. End-to-end smoke tests added in Phase 8 via **Playwright**.

**TDD rule per task:** If a task has business logic (formulas, pure functions, reducers), write the failing test first. If a task is pure UI or a Supabase query, skip the test and verify manually.

---

## Conventions (apply to every task)

- Use the `@/` path alias. Never relative paths ladder up more than one `../`.
- Use `cn()` from `lib/utils.ts` for class merging.
- All new DB access goes through `lib/supabase/server.ts` (server) or `lib/supabase/client.ts` (client).
- Commit after every task with the message prefix shown in that task.
- Never use emojis in code or commits unless explicitly asked.
- New pages under `(shop)` — ignore the existing `(store)` group once renamed.
- Keep all LKR formatting in a single `lib/format.ts` helper so currency is consistent.

---

## Phase 0 — Foundations (~1 day)

### Task 0.1: Install new dependencies

**Files:** `package.json`, `package-lock.json`

**Step 1:** Install runtime and dev deps.

```bash
cd "C:/PD/SaaS Class/inventory"
npm install next-themes
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom happy-dom
```

**Step 2:** Add scripts to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 3:** Run `npm install` again to verify lockfile, then `npm run build` to ensure nothing broke.

**Commit:** `chore: add next-themes and vitest toolchain`

---

### Task 0.2: Set up Vitest config

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

**Step 1:** Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

**Step 2:** Create `vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

**Step 3:** Create `lib/__tests__/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("sanity", () => {
  it("runs", () => expect(1 + 1).toBe(2));
});
```

**Step 4:** Run `npm test`. Expected: sanity passes.

**Commit:** `chore: wire vitest with jsdom and testing-library`

---

### Task 0.3: Rename `(store)` route group → `(shop)`

**Files:**
- Rename directory: `app/(store)` → `app/(shop)`
- Modify: `app/(shop)/page.tsx` — will be reworked in Phase 2, for now just leave content
- Modify: `app/(shop)/shop/page.tsx` — redirect to root (keep backwards compat) or remove

**Step 1:** Rename via shell:
```bash
git -C "C:/PD/SaaS Class/inventory" mv "app/(store)" "app/(shop)"
```

**Step 2:** Search for any hardcoded `/shop` references (there is a route at `/shop` per the existing file). Check with Grep and update as needed.

**Step 3:** Run `npm run dev`, hit `http://localhost:3000`. Expected: same content renders.

**Commit:** `refactor: rename (store) route group to (shop)`

---

### Task 0.4: Add `next-themes` provider and theme toggle

**Files:**
- Create: `components/theme-provider.tsx`
- Create: `components/theme-toggle.tsx`
- Modify: `app/layout.tsx`

**Step 1:** `components/theme-provider.tsx`:
```tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

**Step 2:** `components/theme-toggle.tsx`:
```tsx
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
```

**Step 3:** Wrap `app/layout.tsx` body with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.

**Step 4:** Run `npm run dev`. Manually toggle theme from a temp button to verify the `.dark` class flips on `<html>`.

**Commit:** `feat: add next-themes provider and theme toggle component`

---

### Task 0.5: Swap palette in `globals.css` (electronics aesthetic)

**Files:** `app/globals.css`

**Step 1:** Replace `:root { ... }` and `.dark { ... }` blocks with the new electronics palette:
```css
:root {
  --radius: 0.5rem;
  --background: oklch(0.985 0 0);
  --foreground: oklch(0.11 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.11 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.11 0 0);
  --primary: oklch(0.52 0.27 293);       /* electric violet */
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.96 0.01 293);
  --secondary-foreground: oklch(0.25 0.05 293);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.5 0 0);
  --accent: oklch(0.94 0.02 293);
  --accent-foreground: oklch(0.25 0.05 293);
  --destructive: oklch(0.58 0.22 27);     /* alert red */
  --warning: oklch(0.78 0.15 80);         /* amber */
  --success: oklch(0.68 0.18 145);        /* green */
  --border: oklch(0.9 0 0);
  --input: oklch(0.9 0 0);
  --ring: oklch(0.52 0.27 293);
  --chart-1: oklch(0.52 0.27 293);
  --chart-2: oklch(0.7 0.15 170);
  --chart-3: oklch(0.78 0.15 80);
  --chart-4: oklch(0.65 0.2 330);
  --chart-5: oklch(0.58 0.22 27);
}
.dark {
  --background: oklch(0.14 0 0);
  --foreground: oklch(0.95 0 0);
  --card: oklch(0.18 0 0);
  --card-foreground: oklch(0.95 0 0);
  --popover: oklch(0.18 0 0);
  --popover-foreground: oklch(0.95 0 0);
  --primary: oklch(0.64 0.24 293);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.22 0.02 293);
  --secondary-foreground: oklch(0.95 0 0);
  --muted: oklch(0.22 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --accent: oklch(0.28 0.03 293);
  --accent-foreground: oklch(0.95 0 0);
  --destructive: oklch(0.55 0.22 27);
  --warning: oklch(0.78 0.15 80);
  --success: oklch(0.66 0.18 145);
  --border: oklch(0.26 0 0);
  --input: oklch(0.26 0 0);
  --ring: oklch(0.64 0.24 293);
}
```

**Step 2:** Leave the `@theme inline` block mostly intact but add:
```css
  --color-warning: var(--warning);
  --color-success: var(--success);
```

**Step 3:** Delete the boutique-specific font vars: `--font-serif`, `--font-body`. Replace with:
```css
  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-display: var(--font-inter-display), var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono);
```

**Step 4:** Remove the `store-fade-in` keyframe (we'll use Tailwind's animation utilities going forward). Keep `marquee` (reused for announcement bar).

**Step 5:** `npm run dev` — the `(shop)` page will look broken (uses old colors); ignore for now.

**Commit:** `style: replace boutique palette with electronics palette`

---

### Task 0.6: Swap fonts to Inter + Inter Display

**Files:** `app/layout.tsx`, `app/(shop)/layout.tsx`

**Step 1:** In `app/layout.tsx` replace `Geist` / `Geist_Mono` imports with Inter:
```tsx
import { Inter } from "next/font/google";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
```
Update body className to `${inter.variable} antialiased`.

**Step 2:** In `app/(shop)/layout.tsx` remove Playfair + DM Sans imports and their variables from the root div. Replace `font-body` / `font-serif` usage with `font-sans` / `font-display` throughout the layout (we'll refactor this file fully in Phase 2, for now just remove broken references).

**Step 3:** Grep for any remaining `font-serif` / `font-body` uses in `app/(shop)` and strip them.

```bash
grep -rn "font-serif\|font-body\|font-playfair\|font-dm-sans" "app/(shop)"
```

**Step 4:** `npm run dev` — confirm typography is now all Inter. Layout will still look broken; that's expected.

**Commit:** `style: switch fonts to Inter (body and display)`

---

### Task 0.7: Create `lib/format.ts`

**Files:** Create `lib/format.ts`, Create `lib/__tests__/format.test.ts`

**Step 1:** Write the failing test first:
```ts
import { describe, it, expect } from "vitest";
import { formatLKR, formatLKRCompact } from "../format";

describe("formatLKR", () => {
  it("formats whole rupees with thousand separators", () => {
    expect(formatLKR(24990)).toBe("Rs 24,990");
  });
  it("formats small amounts", () => {
    expect(formatLKR(499)).toBe("Rs 499");
  });
  it("accepts decimals and rounds to whole rupees", () => {
    expect(formatLKR(1234.56)).toBe("Rs 1,235");
  });
});

describe("formatLKRCompact", () => {
  it("abbreviates thousands with k", () => {
    expect(formatLKRCompact(24990)).toBe("Rs 25k");
  });
  it("preserves small values", () => {
    expect(formatLKRCompact(499)).toBe("Rs 499");
  });
});
```

**Step 2:** `npm test` → expect FAIL.

**Step 3:** Implement `lib/format.ts`:
```ts
export function formatLKR(value: number): string {
  const n = Math.round(value);
  return `Rs ${n.toLocaleString("en-LK")}`;
}

export function formatLKRCompact(value: number): string {
  if (value < 1000) return `Rs ${Math.round(value)}`;
  const thousands = Math.round(value / 1000);
  return `Rs ${thousands}k`;
}

export function effectivePrice(price: number, discountPct: number): number {
  if (!discountPct || discountPct <= 0) return price;
  return Math.round(price * (1 - discountPct / 100));
}

export function savingsAmount(price: number, discountPct: number): number {
  return price - effectivePrice(price, discountPct);
}
```

**Step 4:** `npm test` → expect PASS. Add tests for `effectivePrice` and `savingsAmount` too:
```ts
describe("effectivePrice", () => {
  it("applies percentage discount", () => {
    expect(effectivePrice(10000, 20)).toBe(8000);
  });
  it("returns original when no discount", () => {
    expect(effectivePrice(10000, 0)).toBe(10000);
  });
});
```

**Commit:** `feat: add LKR formatting and discount math helpers`

---

## Phase 1 — Data & Seeding (~1-2 days)

All migrations go into `supabase/migrations/` with the next sequential number. Apply via `mcp__supabase__apply_migration` (MCP) or `supabase db push`. Include `-- up` only; this project hasn't needed downs.

### Task 1.1: Migration — extend `products`

**Files:** Create `supabase/migrations/010_products_extensions.sql`

```sql
-- Extend products with electronics-specific fields
alter table products
  add column if not exists brand text,
  add column if not exists slug text unique,
  add column if not exists specs jsonb default '{}'::jsonb,
  add column if not exists images text[] default '{}'::text[],
  add column if not exists discount_pct int not null default 0 check (discount_pct between 0 and 95),
  add column if not exists rating_avg numeric(2,1) not null default 0 check (rating_avg between 0 and 5),
  add column if not exists rating_count int not null default 0,
  add column if not exists warranty_months int not null default 0,
  add column if not exists is_genuine boolean not null default true,
  add column if not exists meta_title text,
  add column if not exists meta_desc text;

-- Backfill slugs for any existing rows
update products
set slug = lower(regexp_replace(name || '-' || substr(id::text, 1, 6), '[^a-z0-9]+', '-', 'g'))
where slug is null;

alter table products alter column slug set not null;

create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_brand on products(brand);
create index if not exists idx_products_category_status on products(category_id, status) where status = 'active';
create index if not exists idx_products_discount on products(discount_pct) where discount_pct > 0;
```

**Apply:** Use `mcp__supabase__apply_migration` with name `products_extensions` and the SQL above.

**Verify:** `select column_name from information_schema.columns where table_name = 'products';` should list all new columns.

**Commit:** `feat(db): extend products with brand, slug, specs, ratings, warranty`

---

### Task 1.2: Migration — categories extensions + brands + delivery_zones

**Files:** Create `supabase/migrations/011_brands_categories_zones.sql`

```sql
-- Categories extensions
alter table categories
  add column if not exists slug text unique,
  add column if not exists icon text,
  add column if not exists sort_order int default 0;

update categories set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;
alter table categories alter column slug set not null;

-- Brands
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  description text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_brands_featured on brands(is_featured) where is_featured;

-- Delivery zones (SL districts + major cities)
create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  district text not null,
  est_min_days int not null,
  est_max_days int not null,
  delivery_fee numeric(10,2) not null,
  created_at timestamptz not null default now(),
  unique(city)
);
create index if not exists idx_delivery_zones_city on delivery_zones(city);
```

**Commit:** `feat(db): add brands table, delivery_zones, category slugs`

---

### Task 1.3: Migration — reviews + rating aggregate trigger

**Files:** Create `supabase/migrations/012_reviews.sql`

```sql
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  images text[] not null default '{}'::text[],
  verified_purchase boolean not null default false,
  helpful_count int not null default 0,
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique(product_id, user_id)
);
create index if not exists idx_reviews_product_status on reviews(product_id, status) where status = 'approved';
create index if not exists idx_reviews_user on reviews(user_id);

create or replace function recompute_product_rating(p_product_id uuid) returns void language sql as $$
  update products p
  set rating_avg = coalesce((select round(avg(r.rating)::numeric, 1) from reviews r where r.product_id = p.id and r.status = 'approved'), 0),
      rating_count = coalesce((select count(*) from reviews r where r.product_id = p.id and r.status = 'approved'), 0)
  where p.id = p_product_id;
$$;

create or replace function trg_reviews_rating() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform recompute_product_rating(old.product_id);
    return old;
  else
    perform recompute_product_rating(new.product_id);
    if tg_op = 'UPDATE' and old.product_id <> new.product_id then
      perform recompute_product_rating(old.product_id);
    end if;
    return new;
  end if;
end $$;

drop trigger if exists reviews_rating_trg on reviews;
create trigger reviews_rating_trg
after insert or update or delete on reviews
for each row execute function trg_reviews_rating();
```

**Verify:** Insert a dummy review, select `rating_avg` from the product, confirm it updates. Delete review, confirm it resets.

**Commit:** `feat(db): reviews table with rating aggregate trigger`

---

### Task 1.4: Migration — wishlists + recently_viewed

**Files:** Create `supabase/migrations/013_wishlist_recently_viewed.sql`

```sql
create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
create index if not exists idx_wishlists_user on wishlists(user_id, created_at desc);

create table if not exists recently_viewed (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists idx_recently_viewed_session on recently_viewed(session_id, viewed_at desc);
create index if not exists idx_recently_viewed_user on recently_viewed(user_id, viewed_at desc) where user_id is not null;

-- Prune old entries to keep only 20 most recent per (session, user)
create or replace function prune_recently_viewed() returns trigger language plpgsql as $$
begin
  delete from recently_viewed
  where session_id = new.session_id
    and id not in (
      select id from recently_viewed
      where session_id = new.session_id
      order by viewed_at desc
      limit 20
    );
  return new;
end $$;

drop trigger if exists recently_viewed_prune on recently_viewed;
create trigger recently_viewed_prune
after insert on recently_viewed
for each row execute function prune_recently_viewed();
```

**Commit:** `feat(db): wishlists and recently_viewed with pruning`

---

### Task 1.5: Migration — flash_deals + active view + sold_units trigger

**Files:** Create `supabase/migrations/014_flash_deals.sql`

```sql
create table if not exists flash_deals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  discount_pct int not null check (discount_pct between 1 and 95),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  max_units int check (max_units > 0),
  sold_units int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_flash_deals_active_window on flash_deals(is_active, starts_at, ends_at);

create or replace view active_flash_deals as
select * from flash_deals
where is_active
  and starts_at <= now()
  and ends_at > now()
  and (max_units is null or sold_units < max_units);

-- Increment sold_units when an outbound order completes
create or replace function trg_orders_flash_sold() returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and new.type = 'outbound' and (old.status is null or old.status <> 'completed') then
    update flash_deals f
    set sold_units = sold_units + coalesce((
      select sum(oi.quantity) from order_items oi where oi.order_id = new.id and oi.product_id = f.product_id
    ), 0)
    where f.product_id in (select product_id from order_items where order_id = new.id)
      and f.is_active
      and f.starts_at <= now() and f.ends_at > now();
  end if;
  return new;
end $$;

drop trigger if exists orders_flash_sold_trg on orders;
create trigger orders_flash_sold_trg
after insert or update of status on orders
for each row execute function trg_orders_flash_sold();
```

**Commit:** `feat(db): flash_deals with active view and sold_units trigger`

---

### Task 1.6: Migration — alerts + pending_notifications

**Files:** Create `supabase/migrations/015_alerts_notifications.sql`

```sql
create table if not exists stock_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  email text not null,
  user_id uuid references profiles(id) on delete set null,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(product_id, email)
);

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  email text not null,
  user_id uuid references profiles(id) on delete set null,
  target_price numeric(10,2),
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists pending_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('stock','price')),
  alert_id uuid not null,
  email text not null,
  subject text not null,
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_pending_notifications_unsent on pending_notifications(created_at) where sent_at is null;

-- When stock goes 0 -> >0, enqueue stock alerts
create or replace function trg_products_stock_alerts() returns trigger language plpgsql as $$
begin
  if old.quantity_in_stock = 0 and new.quantity_in_stock > 0 then
    insert into pending_notifications (type, alert_id, email, subject, body)
    select 'stock', sa.id, sa.email,
      'Back in stock: ' || new.name,
      new.name || ' is available again. Order now at /p/' || new.slug
    from stock_alerts sa
    where sa.product_id = new.id and sa.notified_at is null;

    update stock_alerts set notified_at = now()
    where product_id = new.id and notified_at is null;
  end if;
  return new;
end $$;

drop trigger if exists products_stock_alerts_trg on products;
create trigger products_stock_alerts_trg
after update of quantity_in_stock on products
for each row execute function trg_products_stock_alerts();

-- When effective price drops, enqueue price alerts
create or replace function trg_products_price_alerts() returns trigger language plpgsql as $$
declare old_eff numeric;
declare new_eff numeric;
begin
  old_eff := old.price * (1 - coalesce(old.discount_pct,0)/100.0);
  new_eff := new.price * (1 - coalesce(new.discount_pct,0)/100.0);
  if new_eff < old_eff then
    insert into pending_notifications (type, alert_id, email, subject, body)
    select 'price', pa.id, pa.email,
      'Price drop: ' || new.name,
      new.name || ' is now Rs ' || to_char(new_eff, 'FM999,999,999') ||
      case when pa.target_price is not null then ' (your target: Rs ' || pa.target_price::text || ')' else '' end ||
      '. /p/' || new.slug
    from price_alerts pa
    where pa.product_id = new.id
      and pa.notified_at is null
      and (pa.target_price is null or new_eff <= pa.target_price);

    update price_alerts set notified_at = now()
    where product_id = new.id
      and notified_at is null
      and (target_price is null or new_eff <= target_price);
  end if;
  return new;
end $$;

drop trigger if exists products_price_alerts_trg on products;
create trigger products_price_alerts_trg
after update of price, discount_pct on products
for each row execute function trg_products_price_alerts();
```

**Commit:** `feat(db): stock and price alerts with notification queue`

---

### Task 1.7: Migration — addresses, cart_items, recommendations, wa_clicks

**Files:** Create `supabase/migrations/016_addresses_cart_reco_wa.sql`

```sql
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  district text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on addresses(user_id);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  added_at timestamptz not null default now(),
  check (user_id is not null or session_id is not null)
);
create unique index if not exists uniq_cart_user_product on cart_items(user_id, product_id) where user_id is not null;
create unique index if not exists uniq_cart_session_product on cart_items(session_id, product_id) where user_id is null;

create table if not exists recommendations (
  product_id uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  score numeric(6,3) not null,
  primary key (product_id, related_product_id),
  check (product_id <> related_product_id)
);
create index if not exists idx_recommendations_score on recommendations(product_id, score desc);

create table if not exists wa_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  session_id text,
  user_id uuid references profiles(id) on delete set null,
  clicked_at timestamptz not null default now()
);
create index if not exists idx_wa_clicks_product on wa_clicks(product_id, clicked_at desc);
```

**Commit:** `feat(db): addresses, cart_items, recommendations, wa_clicks`

---

### Task 1.8: Migration — extend orders/order_items

**Files:** Create `supabase/migrations/017_orders_ecom.sql`

```sql
alter table orders
  add column if not exists payment_method text check (payment_method in ('cod','bank_transfer','card')),
  add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  add column if not exists shipping_address_id uuid references addresses(id) on delete set null,
  add column if not exists guest_email text,
  add column if not exists guest_phone text,
  add column if not exists delivery_city text,
  add column if not exists delivery_fee numeric(10,2) not null default 0,
  add column if not exists delivery_estimate text,
  add column if not exists customer_notes text;

alter table order_items
  add column if not exists discount_pct_snapshot int not null default 0,
  add column if not exists serial_number text;

create index if not exists idx_orders_payment_method on orders(payment_method);
create index if not exists idx_orders_payment_status on orders(payment_status);
```

**Commit:** `feat(db): extend orders for e-commerce (payment, shipping, guest)`

---

### Task 1.9: RLS policies

**Files:** Create `supabase/migrations/018_ecom_rls.sql`

```sql
-- Enable RLS
alter table brands enable row level security;
alter table reviews enable row level security;
alter table wishlists enable row level security;
alter table recently_viewed enable row level security;
alter table flash_deals enable row level security;
alter table stock_alerts enable row level security;
alter table price_alerts enable row level security;
alter table pending_notifications enable row level security;
alter table addresses enable row level security;
alter table cart_items enable row level security;
alter table recommendations enable row level security;
alter table delivery_zones enable row level security;
alter table wa_clicks enable row level security;

-- Helper: admin?
create or replace function is_admin() returns boolean language sql stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- Brands: public read, admin write
create policy brands_select_public on brands for select using (true);
create policy brands_admin_all on brands for all using (is_admin()) with check (is_admin());

-- Reviews: public reads approved; users write their own; admins moderate
create policy reviews_select_approved on reviews for select using (status = 'approved' or user_id = auth.uid() or is_admin());
create policy reviews_insert_self on reviews for insert with check (user_id = auth.uid());
create policy reviews_update_own on reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_admin_all on reviews for all using (is_admin()) with check (is_admin());

-- Wishlists: owner only
create policy wishlists_self on wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Recently viewed: owner or session (no RLS filter on session_id; rely on app)
create policy recently_viewed_self on recently_viewed for all using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);

-- Flash deals: public read, admin write
create policy flash_deals_select_public on flash_deals for select using (true);
create policy flash_deals_admin_all on flash_deals for all using (is_admin()) with check (is_admin());

-- Alerts: anyone inserts, owner or admin reads
create policy stock_alerts_insert_any on stock_alerts for insert with check (true);
create policy stock_alerts_read_own on stock_alerts for select using (user_id = auth.uid() or is_admin());
create policy price_alerts_insert_any on price_alerts for insert with check (true);
create policy price_alerts_read_own on price_alerts for select using (user_id = auth.uid() or is_admin());

-- Pending notifications: admin only
create policy pending_notifications_admin on pending_notifications for all using (is_admin()) with check (is_admin());

-- Addresses: owner
create policy addresses_self on addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy addresses_admin_read on addresses for select using (is_admin());

-- Cart items: owner by user_id, session items open for app-layer session matching
create policy cart_items_select_self on cart_items for select using (user_id = auth.uid() or user_id is null);
create policy cart_items_insert_any on cart_items for insert with check (user_id = auth.uid() or user_id is null);
create policy cart_items_update_self on cart_items for update using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);
create policy cart_items_delete_self on cart_items for delete using (user_id = auth.uid() or user_id is null);

-- Recommendations: public read, admin write
create policy recommendations_select_public on recommendations for select using (true);
create policy recommendations_admin_all on recommendations for all using (is_admin()) with check (is_admin());

-- Delivery zones: public read
create policy delivery_zones_select_public on delivery_zones for select using (true);
create policy delivery_zones_admin_all on delivery_zones for all using (is_admin()) with check (is_admin());

-- WA clicks: insert any, read admin
create policy wa_clicks_insert_any on wa_clicks for insert with check (true);
create policy wa_clicks_admin_read on wa_clicks for select using (is_admin());
```

**Commit:** `feat(db): RLS policies for all new e-com tables`

---

### Task 1.10: Regenerate TypeScript types

**Files:** Modify `lib/types.ts` (append), Create `lib/supabase/database.types.ts`

**Step 1:** Use `mcp__supabase__generate_typescript_types` tool to regenerate DB types. Save to `lib/supabase/database.types.ts`.

**Step 2:** Append domain interfaces to `lib/types.ts`:
```ts
export interface Brand {
  id: string; name: string; slug: string; logo_url: string | null;
  description: string | null; is_featured: boolean; sort_order: number; created_at: string;
}

export interface Review {
  id: string; product_id: string; user_id: string;
  rating: number; title: string | null; body: string | null;
  images: string[]; verified_purchase: boolean; helpful_count: number;
  status: "pending" | "approved" | "rejected"; created_at: string;
  user?: Profile;
}

export interface FlashDeal {
  id: string; product_id: string; discount_pct: number;
  starts_at: string; ends_at: string; max_units: number | null;
  sold_units: number; is_active: boolean;
  product?: Product;
}

export interface DeliveryZone {
  id: string; city: string; district: string;
  est_min_days: number; est_max_days: number;
  delivery_fee: number;
}

export interface Address {
  id: string; user_id: string; full_name: string; phone: string;
  line1: string; line2: string | null; city: string; district: string;
  postal_code: string | null; is_default: boolean; created_at: string;
}

export interface CartItem {
  id: string; session_id: string | null; user_id: string | null;
  product_id: string; quantity: number; added_at: string;
  product?: Product;
}

// Extend Product type
declare module "./types" {}
```

Then update `Product` interface in `lib/types.ts` with new fields:
```ts
export interface Product {
  // ... existing fields ...
  brand: string | null;
  slug: string;
  specs: Record<string, unknown>;
  images: string[];
  discount_pct: number;
  rating_avg: number;
  rating_count: number;
  warranty_months: number;
  is_genuine: boolean;
  meta_title: string | null;
  meta_desc: string | null;
}
```

**Commit:** `chore: regenerate supabase types and extend domain types`

---

### Task 1.11: Seed delivery zones

**Files:** Create `supabase/migrations/020_seed_delivery_zones.sql`

```sql
insert into delivery_zones (city, district, est_min_days, est_max_days, delivery_fee) values
('Colombo', 'Colombo', 1, 2, 350),
('Dehiwala', 'Colombo', 1, 2, 350),
('Moratuwa', 'Colombo', 1, 2, 350),
('Kaduwela', 'Colombo', 1, 2, 350),
('Gampaha', 'Gampaha', 1, 2, 400),
('Negombo', 'Gampaha', 2, 3, 450),
('Kalutara', 'Kalutara', 2, 3, 450),
('Panadura', 'Kalutara', 2, 3, 450),
('Kandy', 'Kandy', 2, 3, 500),
('Matale', 'Matale', 3, 4, 600),
('Nuwara Eliya', 'Nuwara Eliya', 3, 5, 700),
('Galle', 'Galle', 2, 3, 550),
('Matara', 'Matara', 3, 4, 600),
('Hambantota', 'Hambantota', 3, 5, 700),
('Jaffna', 'Jaffna', 4, 6, 900),
('Kilinochchi', 'Kilinochchi', 4, 6, 900),
('Mannar', 'Mannar', 4, 6, 900),
('Vavuniya', 'Vavuniya', 3, 5, 800),
('Trincomalee', 'Trincomalee', 3, 5, 750),
('Batticaloa', 'Batticaloa', 3, 5, 750),
('Ampara', 'Ampara', 4, 5, 800),
('Anuradhapura', 'Anuradhapura', 2, 4, 650),
('Polonnaruwa', 'Polonnaruwa', 3, 4, 700),
('Kurunegala', 'Kurunegala', 2, 3, 500),
('Puttalam', 'Puttalam', 2, 4, 650),
('Badulla', 'Badulla', 3, 5, 700),
('Monaragala', 'Monaragala', 4, 5, 750),
('Ratnapura', 'Ratnapura', 2, 4, 600),
('Kegalle', 'Kegalle', 2, 3, 550)
on conflict (city) do nothing;
```

**Commit:** `chore(seed): delivery zones for SL districts/cities`

---

### Task 1.12: Seed categories tree + brands

**Files:** Create `supabase/migrations/021_seed_categories_brands.sql`

```sql
-- Remove existing categories from prior boutique seed if any (safe because products.category_id is on delete set null)
-- truncate categories cascade; -- DO NOT RUN in production; use only on fresh dev DB.

-- Top-level categories
insert into categories (name, slug, icon, sort_order) values
('Audio','audio','headphones',1),
('Lighting','lighting','lightbulb',2),
('Solar','solar','sun',3),
('Accessories','accessories','cable',4),
('Smart Home','smart-home','house',5)
on conflict (slug) do nothing;

-- Sub-categories (done with a CTE lookup)
with parent as (select id, slug from categories)
insert into categories (name, slug, parent_id, icon, sort_order)
select c.name, c.slug, p.id, c.icon, c.sort_order
from (values
  ('Headphones','headphones','audio','headphones',1),
  ('Earbuds & Earphones','earbuds','audio','ear',2),
  ('Bluetooth Speakers','bluetooth-speakers','audio','speaker',3),
  ('Soundbars','soundbars','audio','tv',4),
  ('LED Bulbs','led-bulbs','lighting','lightbulb',1),
  ('LED Strips','led-strips','lighting','waves',2),
  ('Smart Lights','smart-lights','lighting','sparkles',3),
  ('Decorative Lighting','decorative-lighting','lighting','stars',4),
  ('Solar Garden Lights','solar-garden-lights','solar','flower',1),
  ('Solar Panels','solar-panels','solar','square',2),
  ('Solar Power Banks','solar-power-banks','solar','battery-full',3),
  ('Solar Street Lights','solar-street-lights','solar','lamp',4),
  ('Cables & Chargers','cables-chargers','accessories','cable',1),
  ('Power Banks','power-banks','accessories','battery',2),
  ('Cases & Mounts','cases-mounts','accessories','shield',3),
  ('Memory Cards','memory-cards','accessories','database',4),
  ('Smart Plugs','smart-plugs','smart-home','plug',1),
  ('Security Cameras','security-cameras','smart-home','camera',2),
  ('Smart Assistants','smart-assistants','smart-home','mic',3)
) as c(name, slug, parent_slug, icon, sort_order)
join parent p on p.slug = c.parent_slug
on conflict (slug) do nothing;

-- Brands
insert into brands (name, slug, description, is_featured, sort_order) values
('JBL','jbl','Premium audio since 1946. Known for powerful speakers and headphones.',true,1),
('Sony','sony','Japanese electronics giant with industry-leading noise-cancellation.',true,2),
('Philips','philips','Dutch brand. Smart lighting, LED, and home electronics.',true,3),
('Anker','anker','Fast chargers, cables, and power banks trusted worldwide.',true,4),
('Xiaomi','xiaomi','Smart home and connected electronics at excellent value.',true,5),
('Bose','bose','Premium audio with focus on clarity and comfort.',true,6),
('Sennheiser','sennheiser','German audio engineering since 1945.',true,7),
('SolarMax LK','solarmax-lk','Locally-distributed solar products for Sri Lankan homes.',true,8)
on conflict (slug) do nothing;
```

**Commit:** `chore(seed): categories tree and 8 brands`

---

### Task 1.13: Seed products (electronics)

**Files:** Create `supabase/migrations/022_seed_products.sql`

Write ~50 realistic product rows. Use this template — you can use Unsplash hot-linked photo URLs or brand press photos. Include `specs` JSONB populated per category. Prices in LKR.

```sql
-- Helper CTEs for category/brand ids in each insert
with cats as (select id, slug from categories),
     brs  as (select id, name from brands)
insert into products (
  name, description, sku, slug, category_id, price, cost_price,
  quantity_in_stock, reorder_point, reorder_quantity,
  brand, specs, images, discount_pct, warranty_months, is_genuine,
  rating_avg, rating_count, status
) values
-- AUDIO
('JBL Flip 6', 'Portable Bluetooth speaker with bold JBL Original Pro Sound.',
  'JBL-FLIP6','jbl-flip-6',
  (select id from cats where slug='bluetooth-speakers'), 34990, 26000,
  25, 5, 20, 'JBL',
  '{"power_w":20,"battery_hours":12,"bluetooth":"5.1","ip_rating":"IP67","weight_g":550}',
  ARRAY['https://images.unsplash.com/photo-1589003077984-894e133dabab','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1'],
  10, 12, true, 4.6, 120, 'active'),

('Sony WH-1000XM5', 'Industry-leading noise-cancellation over-ear headphones.',
  'SNY-WH1000XM5','sony-wh-1000xm5',
  (select id from cats where slug='headphones'), 119000, 92000,
  12, 3, 10, 'Sony',
  '{"driver_mm":30,"freq_hz":"4-40000","battery_hours":30,"bluetooth":"5.2","noise_cancel":true,"weight_g":250}',
  ARRAY['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb','https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
  5, 24, true, 4.8, 95, 'active'),

('Sony WF-1000XM4', 'True wireless earbuds with premium noise-cancellation.',
  'SNY-WF1000XM4','sony-wf-1000xm4',
  (select id from cats where slug='earbuds'), 62990, 48000,
  18, 4, 15, 'Sony',
  '{"driver_mm":6,"battery_hours":8,"case_hours":24,"bluetooth":"5.2","noise_cancel":true,"ip_rating":"IPX4"}',
  ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df'],
  15, 12, true, 4.5, 210, 'active'),

('JBL Tune 510BT', 'Wireless on-ear headphones with Pure Bass sound.',
  'JBL-TUNE510BT','jbl-tune-510bt',
  (select id from cats where slug='headphones'), 14990, 10500,
  40, 8, 30, 'JBL',
  '{"driver_mm":32,"battery_hours":40,"bluetooth":"5.0","weight_g":160}',
  ARRAY['https://images.unsplash.com/photo-1546435770-a3e426bf472b'],
  20, 12, true, 4.4, 340, 'active'),

('Bose QuietComfort 45', 'Iconic comfort, world-class noise-cancellation.',
  'BOSE-QC45','bose-quietcomfort-45',
  (select id from cats where slug='headphones'), 105000, 82000,
  8, 2, 8, 'Bose',
  '{"driver_mm":40,"battery_hours":24,"bluetooth":"5.1","noise_cancel":true,"weight_g":240}',
  ARRAY['https://images.unsplash.com/photo-1484704849700-f032a568e944'],
  0, 12, true, 4.7, 78, 'active'),

('Sennheiser HD 560S', 'Open-back reference headphones for audiophiles.',
  'SNH-HD560S','sennheiser-hd-560s',
  (select id from cats where slug='headphones'), 52990, 41000,
  6, 2, 6, 'Sennheiser',
  '{"driver_mm":38,"freq_hz":"6-38000","impedance_ohm":120,"weight_g":240}',
  ARRAY['https://images.unsplash.com/photo-1545127398-14699f92334b'],
  0, 24, true, 4.6, 45, 'active'),

('JBL Charge 5', 'Portable bluetooth speaker with powerbank function.',
  'JBL-CHARGE5','jbl-charge-5',
  (select id from cats where slug='bluetooth-speakers'), 54990, 42000,
  15, 3, 12, 'JBL',
  '{"power_w":40,"battery_hours":20,"bluetooth":"5.1","ip_rating":"IP67","weight_g":960}',
  ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1'],
  8, 12, true, 4.7, 180, 'active'),

('JBL Bar 5.1 Soundbar', 'Detachable wireless surround soundbar with subwoofer.',
  'JBL-BAR51','jbl-bar-5-1',
  (select id from cats where slug='soundbars'), 189000, 145000,
  4, 1, 4, 'JBL',
  '{"power_w":510,"channels":"5.1","hdmi_in":3,"bluetooth":"5.0","subwoofer":true}',
  ARRAY['https://images.unsplash.com/photo-1545454675-3531b543be5d'],
  12, 24, true, 4.5, 34, 'active'),

-- LIGHTING
('Philips Hue White and Color E27', 'Smart LED bulb with 16M colors.',
  'PHP-HUE-E27','philips-hue-white-color-e27',
  (select id from cats where slug='smart-lights'), 8990, 6800,
  50, 10, 40, 'Philips',
  '{"wattage":9,"lumens":800,"color_temp_min":2000,"color_temp_max":6500,"colors":"16M","fitting":"E27","smart":true,"calculator_meta":{"replaced_bulb_watts":60}}',
  ARRAY['https://images.unsplash.com/photo-1565636192335-0f7a3063e24d'],
  0, 24, true, 4.6, 92, 'active'),

('Xiaomi Mi LED Smart Bulb', 'Dimmable color-changing smart bulb.',
  'XMI-MI-BULB','xiaomi-mi-led-smart-bulb',
  (select id from cats where slug='smart-lights'), 2490, 1700,
  120, 20, 80, 'Xiaomi',
  '{"wattage":10,"lumens":800,"color_temp_min":1700,"color_temp_max":6500,"fitting":"E27","smart":true,"calculator_meta":{"replaced_bulb_watts":60}}',
  ARRAY['https://images.unsplash.com/photo-1621186820654-91d3c8d0d2e6'],
  10, 12, true, 4.3, 260, 'active'),

('Philips Essential LED 9W', 'Everyday LED bulb, cool daylight.',
  'PHP-ESSLED-9W','philips-essential-led-9w',
  (select id from cats where slug='led-bulbs'), 890, 550,
  300, 50, 200, 'Philips',
  '{"wattage":9,"lumens":830,"color_temp_min":6500,"color_temp_max":6500,"fitting":"E27","calculator_meta":{"replaced_bulb_watts":60}}',
  ARRAY['https://images.unsplash.com/photo-1524634126442-357e0eac3c14'],
  0, 24, true, 4.5, 520, 'active'),

('Xiaomi Yeelight LED Strip 2m', 'RGB smart LED strip, 2m extendable.',
  'XMI-YEELIGHT-2M','xiaomi-yeelight-led-strip-2m',
  (select id from cats where slug='led-strips'), 4990, 3600,
  60, 10, 40, 'Xiaomi',
  '{"wattage":10,"length_m":2,"colors":"16M","smart":true,"ip_rating":"IP44"}',
  ARRAY['https://images.unsplash.com/photo-1565636192335-0f7a3063e24d'],
  20, 12, true, 4.4, 145, 'active'),

-- SOLAR
('SolarMax Garden Light 4-Pack', 'Stainless steel pathway lights with auto on/off.',
  'SMX-GDN-4PK','solarmax-garden-light-4-pack',
  (select id from cats where slug='solar-garden-lights'), 5990, 3800,
  80, 15, 60, 'SolarMax LK',
  '{"panel_watts":2,"led_watts":1.5,"battery_wh":3.7,"auto_on_off":true,"ip_rating":"IP65","calculator_meta":{"replaced_bulb_watts":40}}',
  ARRAY['https://images.unsplash.com/photo-1601699628066-8b7e9e97f01a'],
  0, 12, true, 4.2, 88, 'active'),

('SolarMax 20W Panel Kit', 'Polycrystalline 20W panel with charge controller.',
  'SMX-PANEL20W','solarmax-20w-panel-kit',
  (select id from cats where slug='solar-panels'), 12990, 9000,
  20, 5, 15, 'SolarMax LK',
  '{"panel_watts":20,"voltage":12,"controller":true,"dimensions_cm":"35x45"}',
  ARRAY['https://images.unsplash.com/photo-1509391366360-2e959784a276'],
  10, 24, true, 4.3, 42, 'active'),

('Anker Solar Power Bank 25000mAh', 'High-capacity solar-topup power bank.',
  'ANK-SOLAR-25K','anker-solar-power-bank-25000mah',
  (select id from cats where slug='solar-power-banks'), 11990, 8500,
  30, 6, 24, 'Anker',
  '{"capacity_mah":25000,"panel_watts":3,"usb_ports":3,"ip_rating":"IPX5"}',
  ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5'],
  15, 12, true, 4.1, 125, 'active'),

('SolarMax 60W LED Street Light', 'All-in-one solar LED street light with motion sensor.',
  'SMX-STREET60W','solarmax-60w-led-street-light',
  (select id from cats where slug='solar-street-lights'), 22990, 15000,
  12, 3, 10, 'SolarMax LK',
  '{"panel_watts":60,"led_watts":30,"battery_wh":160,"motion_sensor":true,"ip_rating":"IP66","calculator_meta":{"replaced_bulb_watts":150}}',
  ARRAY['https://images.unsplash.com/photo-1594736797933-d0c62a3e2c70'],
  8, 24, true, 4.0, 28, 'active'),

-- ACCESSORIES
('Anker PowerLine III USB-C to USB-C 1m', 'Ultra-durable fast charging cable.',
  'ANK-PL3-USBC1M','anker-powerline-iii-usbc-1m',
  (select id from cats where slug='cables-chargers'), 2490, 1500,
  150, 30, 100, 'Anker',
  '{"length_m":1,"type":"USB-C to USB-C","power_w":100,"data_gbps":10}',
  ARRAY['https://images.unsplash.com/photo-1583863788434-e58a36330cf0'],
  0, 18, true, 4.7, 430, 'active'),

('Anker PowerCore 20000 PD', 'Fast charging 20,000 mAh power bank with USB-C PD.',
  'ANK-PC20K-PD','anker-powercore-20000-pd',
  (select id from cats where slug='power-banks'), 14990, 11000,
  40, 8, 30, 'Anker',
  '{"capacity_mah":20000,"output_w":25,"usb_ports":2,"pd":true}',
  ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5'],
  10, 18, true, 4.6, 215, 'active'),

('SanDisk Ultra 128GB microSD', 'A1 rated for app performance.',
  'SDK-ULTRA-128','sandisk-ultra-128gb-microsd',
  (select id from cats where slug='memory-cards'), 4490, 3100,
  200, 50, 150, 'Anker',
  '{"capacity_gb":128,"class":"A1 UHS-I","read_mbps":120}',
  ARRAY['https://images.unsplash.com/photo-1591488542687-50814bfe2eb9'],
  5, 60, true, 4.8, 890, 'active'),

-- SMART HOME
('Xiaomi Mi Smart Plug', 'Wi-Fi smart plug with energy monitoring.',
  'XMI-SMART-PLUG','xiaomi-mi-smart-plug',
  (select id from cats where slug='smart-plugs'), 2990, 2000,
  80, 15, 60, 'Xiaomi',
  '{"max_load_w":2500,"wifi":"2.4GHz","energy_monitor":true}',
  ARRAY['https://images.unsplash.com/photo-1585771724684-38269d6639fd'],
  10, 12, true, 4.4, 180, 'active'),

('Xiaomi Mi Camera 2K', 'Indoor security camera with AI detection.',
  'XMI-CAM-2K','xiaomi-mi-camera-2k',
  (select id from cats where slug='security-cameras'), 8990, 6200,
  35, 7, 25, 'Xiaomi',
  '{"resolution":"2K","night_vision":true,"ai_detection":true,"two_way_audio":true}',
  ARRAY['https://images.unsplash.com/photo-1558002038-1055907df827'],
  0, 12, true, 4.3, 120, 'active')
on conflict (slug) do nothing;
```

**Note:** Expand this list with 25+ more products so each sub-category has at least 1-2. Target ~50 products total. Follow the same pattern.

**Commit:** `chore(seed): electronics products with realistic LKR prices and specs`

---

### Task 1.14: Seed flash deals and reviews

**Files:** Create `supabase/migrations/023_seed_deals_reviews.sql`

```sql
-- Flash deals for 8 products (active now, ending in 1-7 days)
with p as (select id, slug from products)
insert into flash_deals (product_id, discount_pct, starts_at, ends_at, max_units)
select id, d.discount_pct, now() - interval '6 hours', now() + d.ends_in, d.max_units
from p join (values
  ('jbl-flip-6', 15, interval '2 days', 50),
  ('sony-wf-1000xm4', 20, interval '3 days', 30),
  ('jbl-tune-510bt', 25, interval '1 day', 80),
  ('xiaomi-mi-led-smart-bulb', 15, interval '5 days', 200),
  ('solarmax-garden-light-4-pack', 10, interval '4 days', 100),
  ('anker-powercore-20000-pd', 18, interval '2 days', 60),
  ('xiaomi-yeelight-led-strip-2m', 25, interval '3 days', 100),
  ('xiaomi-mi-smart-plug', 20, interval '1 day', 120)
) as d(slug, discount_pct, ends_in, max_units) on d.slug = p.slug;

-- Seeded reviews (fake users — use a single system profile or insert sample profiles first)
-- For simplicity, insert if at least one admin profile exists
insert into reviews (product_id, user_id, rating, title, body, verified_purchase, helpful_count)
select p.id, (select id from profiles limit 1), r.rating, r.title, r.body, r.verified, r.helpful
from products p join (values
  ('jbl-flip-6', 5, 'Excellent sound!', 'Bass is punchy and battery lasts all day.', true, 14),
  ('jbl-flip-6', 4, 'Solid speaker', 'Great for outdoor use; IP67 is a plus.', false, 6),
  ('sony-wh-1000xm5', 5, 'Industry-leading ANC', 'Noise cancellation is truly next-level.', true, 22),
  ('sony-wh-1000xm5', 5, 'Comfortable for hours', 'Ear cushions are soft; no fatigue.', true, 11),
  ('philips-hue-white-color-e27', 5, 'Just works', 'Hue app is reliable; colors look great.', true, 8),
  ('anker-powercore-20000-pd', 4, 'Chargers my laptop', 'Good for travel. Heavy though.', true, 9),
  ('solarmax-garden-light-4-pack', 4, 'Perfect pathway lights', 'Dim at first but brighten nicely at dusk.', true, 5),
  ('xiaomi-mi-camera-2k', 5, 'Great value', '2K feed is crystal clear.', true, 12),
  ('jbl-charge-5', 5, 'Load loud loud', 'JBL delivered. Stays charged for a weekend.', true, 17),
  ('sandisk-ultra-128gb-microsd', 5, 'Fast and reliable', 'No dropped frames recording 4K phone video.', false, 4)
) as r(slug, rating, title, body, verified, helpful) on r.slug = p.slug
where exists (select 1 from profiles limit 1);
```

**Commit:** `chore(seed): flash deals and seeded reviews`

---

### Task 1.15: Seed recommendations

**Files:** Create `supabase/migrations/024_seed_recommendations.sql`

```sql
-- Seed recommendations by category + brand + price-band similarity
insert into recommendations (product_id, related_product_id, score)
select a.id as product_id, b.id as related_product_id,
       (case when a.category_id = b.category_id then 0.5 else 0 end
        + case when a.brand is not distinct from b.brand then 0.3 else 0 end
        + greatest(0, 0.2 - abs(a.price - b.price) / nullif(greatest(a.price, b.price),0)))::numeric(6,3) as score
from products a
cross join products b
where a.id <> b.id
  and a.status = 'active' and b.status = 'active'
  and (a.category_id = b.category_id or a.brand = b.brand)
on conflict do nothing;

-- Prune to top 12 per product
delete from recommendations r
where r.related_product_id in (
  select related_product_id
  from recommendations r2
  where r2.product_id = r.product_id
  order by r2.score desc
  offset 12
);
```

**Commit:** `chore(seed): recommendation edges via category+brand+price similarity`

---

### Task 1.16: Verify migrations end-to-end

**Step 1:** Run `mcp__supabase__list_tables` — confirm all new tables exist.

**Step 2:** Hit `/shop` — should return products (existing API still works because new columns are additive).

**Step 3:** Run verification SQL:
```sql
select count(*) from products where slug is not null;  -- ~50
select count(*) from categories;                         -- ~24
select count(*) from brands;                             -- 8
select count(*) from flash_deals where is_active;        -- 8
select count(*) from delivery_zones;                     -- 29
select count(*) from reviews;                            -- 10+
select count(*) from recommendations;                    -- up to 12 * 50
```

No commit needed (just verification).

---

## Phase 2 — Shop Shell & Home (~2 days)

### Task 2.1: New shop layout shell

**Files:** Modify `app/(shop)/layout.tsx`

**Step 1:** Replace the file with a new layout: announcement bar + sticky header + footer. No search logic yet (stubbed input); cart/account icons link to stubs. Full rewrite — the boutique file no longer applies.

Key structure:
```tsx
// app/(shop)/layout.tsx
import Link from "next/link";
import { ShoppingBag, Heart, User, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnnouncementBar } from "@/components/shop/announcement-bar";
import { CategoryMegaMenu } from "@/components/shop/category-mega-menu";
import { ShopFooter } from "@/components/shop/shop-footer";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AnnouncementBar />
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="font-display font-bold text-lg tracking-tight">VoltHub</Link>
          <CategoryMegaMenu />
          <div className="flex-1 max-w-xl">
            <SearchBar />
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/account/wishlist" aria-label="Wishlist" className="p-2 rounded-md hover:bg-muted">
              <Heart className="h-4 w-4" />
            </Link>
            <Link href="/account" aria-label="Account" className="p-2 rounded-md hover:bg-muted">
              <User className="h-4 w-4" />
            </Link>
            <Link href="/cart" aria-label="Cart" className="p-2 rounded-md hover:bg-muted">
              <ShoppingBag className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <ShopFooter />
    </div>
  );
}
```

**Step 2:** Create `components/shop/announcement-bar.tsx` — single line dark strip: "Free delivery over Rs 5,000 · Islandwide · COD available".

**Step 3:** Create `components/shop/category-mega-menu.tsx` — for now, a dropdown with hard-coded top-level categories; we'll wire it to the DB in Task 2.4.

**Step 4:** Create `components/shop/search-bar.tsx` — stub input with the `/` hotkey. Autocomplete logic in Phase 3.

**Step 5:** Create `components/shop/shop-footer.tsx` — three-column grid (Shop / Help / Connect), dark background.

**Commit:** `feat(shop): new shop layout shell with header and footer`

---

### Task 2.2: Home page — hero + category tiles

**Files:** Replace `app/(shop)/page.tsx`, Create `components/shop/hero-carousel.tsx`, Create `components/shop/category-tiles.tsx`

**Step 1:** Rewrite `app/(shop)/page.tsx` to a server component that fetches: active flash deals, featured brands, trending-in-audio, trending-in-lighting, top categories. Compose sections in order.

```tsx
// app/(shop)/page.tsx
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { FlashDealsStrip } from "@/components/shop/flash-deals-strip";
import { FeaturedBrandsRow } from "@/components/shop/featured-brands-row";
import { ProductRail } from "@/components/shop/product-rail";
import { ValuePropsStrip } from "@/components/shop/value-props-strip";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: topCategories }, { data: featuredBrands }] = await Promise.all([
    supabase.from("categories").select("*").is("parent_id", null).order("sort_order"),
    supabase.from("brands").select("*").eq("is_featured", true).order("sort_order"),
  ]);
  return (
    <>
      <HeroCarousel />
      <CategoryTiles categories={topCategories ?? []} />
      <FlashDealsStrip />
      <FeaturedBrandsRow brands={featuredBrands ?? []} />
      <ProductRail title="Trending in Audio" categorySlug="audio" />
      <ProductRail title="Trending in Lighting" categorySlug="lighting" />
      <ValuePropsStrip />
    </>
  );
}
```

**Step 2:** `HeroCarousel` — a simple 4-slide horizontal scroller using CSS scroll-snap. No third-party carousel lib needed. Hard-coded slides for MVP: "Flash deal of the week", "New in solar", "Best sellers", "Free islandwide delivery".

**Step 3:** `CategoryTiles` — 5-6 square tiles linking to `/c/[slug]`, with lucide icon + category name. Grid 2 cols mobile, 5 cols desktop.

**Commit:** `feat(home): hero carousel and category tiles`

---

### Task 2.3: Flash deals strip with countdown

**Files:** Create `components/shop/flash-deals-strip.tsx`, Create `components/shop/countdown-timer.tsx`, Create `components/shop/product-card.tsx`, Create `lib/__tests__/countdown.test.ts`, Create `lib/countdown.ts`

**Step 1 (TDD):** Write countdown test first:
```ts
// lib/__tests__/countdown.test.ts
import { describe, it, expect } from "vitest";
import { formatCountdown } from "../countdown";
describe("formatCountdown", () => {
  it("formats days/hours/mins/secs", () => {
    expect(formatCountdown(90061000)).toEqual({ d: 1, h: 1, m: 1, s: 1 });
  });
  it("caps at 0 when past", () => {
    expect(formatCountdown(-1)).toEqual({ d: 0, h: 0, m: 0, s: 0 });
  });
});
```

**Step 2:** `lib/countdown.ts`:
```ts
export function formatCountdown(ms: number): { d: number; h: number; m: number; s: number } {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return { d, h, m, s };
}
```

Run tests → pass.

**Step 3:** `components/shop/countdown-timer.tsx` — client component with `useEffect` ticking every 1s, displaying `{d}d : {h}h : {m}m : {s}s`.

**Step 4:** `components/shop/flash-deals-strip.tsx` — server component fetches `active_flash_deals` view joined with products, renders horizontal scroll of product cards each with a countdown to `ends_at` and discount badge.

**Step 5:** `components/shop/product-card.tsx` — reusable card used across home and PLP:
```tsx
// Props: product: Product; compact?: boolean
// Renders: image, brand tag, name (2 lines), stars, price + strikethrough + discount badge,
// low-stock warning, wishlist heart icon, quick-add button on hover.
```
Use `formatLKR` + `effectivePrice` from `lib/format.ts`. Link wraps the whole card to `/p/${product.slug}`.

**Commit:** `feat(home): flash deals strip with live countdown`

---

### Task 2.4: Featured brands row + product rail + value props

**Files:** Create `components/shop/featured-brands-row.tsx`, Create `components/shop/product-rail.tsx`, Create `components/shop/value-props-strip.tsx`

**Step 1:** `FeaturedBrandsRow` — 6-8 brand logos in a horizontal row, linking to `/brand/[slug]`.

**Step 2:** `ProductRail` — server component, fetches up to 12 products from a category, renders horizontal scroll of product cards.

**Step 3:** `ValuePropsStrip` — 4 icons: Genuine stock · Islandwide delivery · 12-month warranty · COD available. Lucide icons.

**Commit:** `feat(home): featured brands, product rails, value props strip`

---

### Task 2.5: Recently viewed rail (conditional)

**Files:** Create `components/shop/recently-viewed-rail.tsx`, Create `app/api/recently-viewed/route.ts`, Modify `app/(shop)/page.tsx`

**Step 1:** `/api/recently-viewed`:
- `GET` — reads `session_id` cookie, returns up to 20 products ordered by `viewed_at desc`.
- `POST` with `{product_id}` — upserts `(session_id, user_id, product_id, now())`.

Cookie: http-only, `rv_sid`, generate UUID if missing.

**Step 2:** `RecentlyViewedRail` — client component fetching `/api/recently-viewed`, renders only if >0 items. Appears between ValuePropsStrip and Footer.

**Step 3:** Add to `app/(shop)/page.tsx` above `<ValuePropsStrip />`.

**Commit:** `feat(home): recently viewed rail with session-based tracking`

---

## Phase 3 — Browse & Discover (~3 days)

### Task 3.1: API — `/api/products/list` with filters

**Files:** Create `app/api/products/list/route.ts`

**Step 1:** Support query params: `category`, `brand` (CSV), `min_price`, `max_price`, `min_rating`, `on_sale`, `in_stock`, `sort` (`popular|price_asc|price_desc|rating|newest|discount`), `page`, `page_size`. Default `page_size=24`.

```ts
// app/api/products/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supabase = await createClient();
  let q = supabase.from("products").select("*, category:categories(*)", { count: "exact" }).eq("status", "active");

  const category = searchParams.get("category");
  if (category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", category).single();
    if (cat) {
      const { data: children } = await supabase.from("categories").select("id").eq("parent_id", cat.id);
      const ids = [cat.id, ...(children ?? []).map((c) => c.id)];
      q = q.in("category_id", ids);
    }
  }

  const brands = searchParams.get("brand")?.split(",").filter(Boolean) ?? [];
  if (brands.length) q = q.in("brand", brands);

  const minPrice = Number(searchParams.get("min_price") ?? 0);
  const maxPrice = Number(searchParams.get("max_price") ?? 0);
  if (minPrice > 0) q = q.gte("price", minPrice);
  if (maxPrice > 0) q = q.lte("price", maxPrice);

  const minRating = Number(searchParams.get("min_rating") ?? 0);
  if (minRating > 0) q = q.gte("rating_avg", minRating);

  if (searchParams.get("on_sale") === "1") q = q.gt("discount_pct", 0);
  if (searchParams.get("in_stock") === "1") q = q.gt("quantity_in_stock", 0);

  const sort = searchParams.get("sort") ?? "popular";
  switch (sort) {
    case "price_asc": q = q.order("price", { ascending: true }); break;
    case "price_desc": q = q.order("price", { ascending: false }); break;
    case "rating": q = q.order("rating_avg", { ascending: false }); break;
    case "newest": q = q.order("created_at", { ascending: false }); break;
    case "discount": q = q.order("discount_pct", { ascending: false }); break;
    default: q = q.order("rating_count", { ascending: false });
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(48, Number(searchParams.get("page_size") ?? 24));
  const from = (page - 1) * pageSize;
  q = q.range(from, from + pageSize - 1);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count, page, pageSize });
}
```

**Step 2:** Manual test via curl/browser: `/api/products/list?category=audio&sort=price_asc`.

**Commit:** `feat(api): products/list with faceted filters and sort`

---

### Task 3.2: API — `/api/products/search` (autocomplete)

**Files:** Create `app/api/products/search/route.ts`

**Step 1:** `GET /api/products/search?q=...` — returns `{ products: [...5], categories: [...3], brands: [...3] }`. Use ILIKE on name/brand/categories.

```ts
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [], categories: [], brands: [] });
  const supabase = await createClient();
  const like = `%${q}%`;
  const [products, categories, brands] = await Promise.all([
    supabase.from("products").select("id,name,slug,images,price,discount_pct,rating_avg").eq("status","active").or(`name.ilike.${like},brand.ilike.${like}`).limit(5),
    supabase.from("categories").select("id,name,slug").ilike("name", like).limit(3),
    supabase.from("brands").select("id,name,slug,logo_url").ilike("name", like).limit(3),
  ]);
  return NextResponse.json({ products: products.data ?? [], categories: categories.data ?? [], brands: brands.data ?? [] });
}
```

**Commit:** `feat(api): products/search autocomplete endpoint`

---

### Task 3.3: Header search with autocomplete dropdown

**Files:** Modify `components/shop/search-bar.tsx`

**Step 1:** Debounced query (200ms) using a tiny custom hook. On change, fetch `/api/products/search`. Show dropdown listbox with products (thumb + name + price), categories, brands. Click = navigate. Enter = go to `/search?q=...`.

**Step 2:** Keyboard shortcut `/` focuses input globally.

**Commit:** `feat(shop): search autocomplete in header`

---

### Task 3.4: Category page shell — `/c/[slug]`

**Files:** Create `app/(shop)/c/[slug]/page.tsx`, Create `app/(shop)/c/[parent]/[child]/page.tsx` (reuses same component)

**Step 1:** Server component fetches category by slug (with parent lookup for sub-cats), renders breadcrumbs, H1, count, and a client `CategoryBrowser` component that takes initial products + filter options.

```tsx
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("*, parent:categories!categories_parent_id_fkey(*)").eq("slug", slug).single();
  if (!category) notFound();
  // initial fetch uses the list API logic inline
  return <CategoryBrowser category={category} />;
}
```

**Commit:** `feat(shop): /c/[slug] category page shell`

---

### Task 3.5: Left rail filters

**Files:** Create `components/shop/filters-rail.tsx`, Create `components/shop/price-range-slider.tsx`

**Step 1:** Filter sections (accordion):
- Price range (dual slider, client state)
- Brand (checkbox list populated from DB)
- Rating (4★+ / 3★+ / 2★+ radio)
- Discount (toggle: On sale only)
- Availability (toggle: In stock only)
- Category-specific: if category slug ∈ audio → wireless/ANC/type; if lighting → color temp range; if solar → panel watts/battery.

**Step 2:** Each filter change updates a URL search param; `CategoryBrowser` listens to `useSearchParams` and refetches `/api/products/list`.

**Step 3:** "Clear all" link resets the URL (preserves category).

**Commit:** `feat(shop): left-rail faceted filters with URL state`

---

### Task 3.6: Product grid + infinite scroll + sort

**Files:** Create `components/shop/category-browser.tsx`, Create `components/shop/sort-dropdown.tsx`, Create `lib/hooks/use-infinite-products.ts`

**Step 1:** `useInfiniteProducts` — hook wrapping `/api/products/list`, tracks pages, accumulates. `loadMore()` function.

**Step 2:** `CategoryBrowser` composes: breadcrumbs + H1 + total count + sort dropdown + `FiltersRail` + grid of `ProductCard` + `LoadMoreButton` at end (or IntersectionObserver for auto-load).

**Step 3:** Grid: 2 col mobile, 3 md, 4 lg. `gap-4`.

**Commit:** `feat(shop): category browser with sort and infinite scroll`

---

### Task 3.7: Mobile filter drawer

**Files:** Modify `components/shop/category-browser.tsx`, Modify `components/shop/filters-rail.tsx`

**Step 1:** On mobile (< md breakpoint), hide sidebar. Add fixed bottom "Filters (N)" button showing active filter count. Clicking opens a `Sheet` (already in shadcn) from bottom with the same `FiltersRail` content. Apply button closes sheet.

**Commit:** `feat(shop): mobile filter drawer with active count`

---

### Task 3.8: Brand pages — `/brand/[slug]`

**Files:** Create `app/(shop)/brand/[slug]/page.tsx`

**Step 1:** Brand hero (logo + description) + `CategoryBrowser` pre-filtered by `brand=${brand.name}`.

**Commit:** `feat(shop): brand page with brand-filtered browser`

---

### Task 3.9: Search results page — `/search`

**Files:** Create `app/(shop)/search/page.tsx`, Modify `app/api/products/list/route.ts` (accept `q` param)

**Step 1:** Add `q` param to list API. Reuses ILIKE like autocomplete.

**Step 2:** `/search?q=...` page mirrors category browser layout but without a category pre-filter; breadcrumb "Search › {q}"; H1 "{count} results for '{q}'".

**Commit:** `feat(shop): /search results page`

---

### Task 3.10: Breadcrumbs component

**Files:** Create `components/shop/breadcrumbs.tsx`

**Step 1:** Simple ordered list `Home › Audio › Headphones › JBL Tune 510BT` with links.

**Commit:** `feat(shop): breadcrumbs component`

---

## Phase 4 — Product Detail Page (~3 days)

### Task 4.1: API — `/api/products/[slug]`

**Files:** Create `app/api/products/[slug]/route.ts`

**Step 1:** Fetch product by slug + category + flash deal override + top 12 recommendations + latest 20 approved reviews. Return all in one response to avoid waterfall on page.

```ts
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product, error } = await supabase.from("products")
    .select("*, category:categories(id,name,slug,parent_id)")
    .eq("slug", slug).single();
  if (error || !product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: deal }, { data: recs }, { data: reviews }] = await Promise.all([
    supabase.from("active_flash_deals").select("*").eq("product_id", product.id).maybeSingle(),
    supabase.from("recommendations")
      .select("related_product_id, score, product:products!recommendations_related_product_id_fkey(id,name,slug,images,price,discount_pct,rating_avg,rating_count)")
      .eq("product_id", product.id).order("score",{ascending:false}).limit(12),
    supabase.from("reviews")
      .select("*, user:profiles(full_name, avatar_url)")
      .eq("product_id", product.id).eq("status","approved").order("helpful_count",{ascending:false}).limit(20),
  ]);

  return NextResponse.json({ product, deal, recommendations: recs ?? [], reviews: reviews ?? [] });
}
```

**Commit:** `feat(api): product detail endpoint with deal + recs + reviews`

---

### Task 4.2: PDP shell + gallery

**Files:** Create `app/(shop)/p/[slug]/page.tsx`, Create `components/shop/product-gallery.tsx`

**Step 1:** Server component fetches via the API route's handler directly (import and call) or re-fetches the product server-side.

**Step 2:** `ProductGallery` — main image + thumbnail strip below (or on side at lg+). Click thumb to swap main. Zoom on hover (CSS transform).

**Commit:** `feat(shop): /p/[slug] PDP shell with image gallery`

---

### Task 4.3: PDP info panel — price, stock, qty, Add to Cart

**Files:** Create `components/shop/product-info-panel.tsx`

**Step 1:** Render brand link, product name H1, star rating row (links to #reviews), price block:
- If flash deal active → show deal discount; else use `product.discount_pct`.
- Show effective price (large), strikethrough original, `{discount}% OFF` badge, "You save {formatLKR(savings)}".

**Step 2:** Stock status — `In stock` green, `Only N left` amber if < 5, `Out of stock` red.

**Step 3:** Quantity selector (+/− buttons, min 1 max stock) + primary CTA "Add to Cart" (calls cart API — stub for now, real in Phase 5).

**Commit:** `feat(pdp): info panel with price, stock, quantity, add to cart`

---

### Task 4.4: F1 — Warranty / genuine-stock badges

**Files:** Create `components/shop/warranty-badges.tsx`

**Step 1:** Pill row shown when `warranty_months > 0` or `is_genuine`:
```
[Check icon] 12-month warranty
[Check icon] Genuine stock, direct from authorized distributor
[Check icon] Verify authenticity at delivery
```

Last pill clickable → opens a small dialog explaining the serial-verification process.

**Commit:** `feat(pdp): warranty and genuine-stock badges (F1)`

---

### Task 4.5: F2 — WhatsApp quick-buy button

**Files:** Create `components/shop/whatsapp-buy-button.tsx`, Create `app/api/wa-click/route.ts`, Modify `.env.example`

**Step 1:** `app/api/wa-click/route.ts` — POST logs `{product_id, session_id, user_id}` to `wa_clicks`.

**Step 2:** `WhatsAppBuyButton` — client component. On click: POST the log, then `window.open(url, "_blank")`.

```ts
const msg = `Hi, I'd like to order:\n\n${product.name} (Qty ${qty})\nRs ${formatLKR(effective)}\nLink: ${origin}/p/${product.slug}\n\nMy details:\nName: \nCity: `;
const url = `https://wa.me/${process.env.NEXT_PUBLIC_STORE_WA_NUMBER}?text=${encodeURIComponent(msg)}`;
```

**Step 3:** Add `NEXT_PUBLIC_STORE_WA_NUMBER` to `.env.example` (value `94771234567` or placeholder).

**Commit:** `feat(pdp): WhatsApp quick-buy button (F2) with click logging`

---

### Task 4.6: F3 — Delivery estimator

**Files:** Create `components/shop/delivery-estimator.tsx`, Create `app/api/delivery-zones/route.ts`, Create `lib/delivery.ts`, Create `lib/__tests__/delivery.test.ts`

**Step 1 (TDD):** test first:
```ts
import { computeDeliveryDates, computeDeliveryFee } from "../delivery";
describe("computeDeliveryDates", () => {
  it("skips sundays when counting days", () => {
    // assume today is Mon 2026-04-20
    const dates = computeDeliveryDates(new Date("2026-04-20"), 1, 2);
    expect(dates.min.toISOString().slice(0,10)).toBe("2026-04-21");
    expect(dates.max.toISOString().slice(0,10)).toBe("2026-04-22");
  });
});
describe("computeDeliveryFee", () => {
  it("returns zero when subtotal >= threshold", () => {
    expect(computeDeliveryFee(500, 5000)).toBe(0);
    expect(computeDeliveryFee(500, 4999)).toBe(500);
  });
});
```

**Step 2:** `lib/delivery.ts`:
```ts
export function computeDeliveryDates(from: Date, minDays: number, maxDays: number) {
  const advance = (d: Date, days: number) => {
    const r = new Date(d);
    let added = 0;
    while (added < days) {
      r.setDate(r.getDate() + 1);
      if (r.getDay() !== 0) added++;   // skip Sundays
    }
    return r;
  };
  return { min: advance(from, minDays), max: advance(from, maxDays) };
}

export function computeDeliveryFee(fee: number, subtotal: number, threshold = 5000): number {
  return subtotal >= threshold ? 0 : fee;
}
```

**Step 3:** `/api/delivery-zones` — GET returns all zones.

**Step 4:** `DeliveryEstimator` component — city select populated from zones; once picked, shows date range + fee. City choice persisted to cookie `dz_city` for session reuse.

**Commit:** `feat(pdp): delivery estimator (F3) with date + fee calculation`

---

### Task 4.7: F4 — Stock and price alerts

**Files:** Create `components/shop/stock-alert-form.tsx`, Create `components/shop/price-alert-popover.tsx`, Create `app/api/alerts/stock/route.ts`, Create `app/api/alerts/price/route.ts`

**Step 1:** `/api/alerts/stock` POST `{product_id, email}` → insert into `stock_alerts` (unique(product_id,email)).

**Step 2:** `/api/alerts/price` POST `{product_id, email, target_price?}` → insert into `price_alerts`.

**Step 3:** `StockAlertForm` — inline email form; shown only when out of stock. Success toast.

**Step 4:** `PriceAlertPopover` — trigger "Notify me when price drops" opens popover with optional target price + email. Success toast.

**Commit:** `feat(pdp): stock and price alert signups (F4)`

---

### Task 4.8: F5 — Solar savings calculator (conditional)

**Files:** Create `components/shop/solar-calculator.tsx`, Create `lib/solar.ts`, Create `lib/__tests__/solar.test.ts`

**Step 1 (TDD):**
```ts
import { computeSolarSavings } from "../solar";
describe("computeSolarSavings", () => {
  it("computes annual savings and payback months", () => {
    const r = computeSolarSavings({ hoursPerDay: 6, replacedWatts: 60, rateLKR: 35, productPriceLKR: 5990 });
    // daily kWh = 60*6/1000 = 0.36; annual = 0.36*365*35 = 4599; monthly = 383.25; payback = 16
    expect(r.annualSavings).toBeCloseTo(4599, 0);
    expect(r.paybackMonths).toBe(16);
  });
  it("returns Infinity payback when annual savings is zero", () => {
    const r = computeSolarSavings({ hoursPerDay: 0, replacedWatts: 60, rateLKR: 35, productPriceLKR: 5990 });
    expect(r.paybackMonths).toBe(Infinity);
  });
});
```

**Step 2:** `lib/solar.ts`:
```ts
export function computeSolarSavings({ hoursPerDay, replacedWatts, rateLKR, productPriceLKR }: {
  hoursPerDay: number; replacedWatts: number; rateLKR: number; productPriceLKR: number;
}) {
  const dailyKWh = (replacedWatts * hoursPerDay) / 1000;
  const annualSavings = Math.round(dailyKWh * 365 * rateLKR);
  const monthly = annualSavings / 12;
  const paybackMonths = monthly > 0 ? Math.ceil(productPriceLKR / monthly) : Infinity;
  return { dailyKWh, annualSavings, paybackMonths };
}
```

**Step 3:** `SolarCalculator` — renders only if `product.category.parent_slug === "solar"` or slug in solar sub-cats. Inputs: hours/day (slider 0-24, default 6), LKR/kWh (input, default 35), replaced W (input, default `specs.calculator_meta.replaced_bulb_watts || 40`). Outputs: "You save **Rs X/year** — pays for itself in **Y months**." Animated counter on change.

**Commit:** `feat(pdp): solar savings calculator (F5)`

---

### Task 4.9: F6 — LED color-temperature preview (conditional)

**Files:** Create `components/shop/led-temp-preview.tsx`, Create `lib/kelvin-to-rgb.ts`, Create `lib/__tests__/kelvin.test.ts`

**Step 1 (TDD):**
```ts
import { kelvinToRGB } from "../kelvin-to-rgb";
describe("kelvinToRGB", () => {
  it("returns warm color for 2700K", () => {
    const { r, g, b } = kelvinToRGB(2700);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });
  it("returns near-white balanced for 6500K", () => {
    const { r, g, b } = kelvinToRGB(6500);
    expect(Math.abs(r - g)).toBeLessThan(50);
  });
});
```

**Step 2:** `lib/kelvin-to-rgb.ts` — standard black-body approximation (Neil Bartlett formula).

**Step 3:** `LedTempPreview` — renders only when `specs.color_temp_min && specs.color_temp_max && specs.color_temp_max - specs.color_temp_min > 0`. Slider from min→max; preview box background color set to `rgb(r,g,b)` from `kelvinToRGB(value)`. Anchor labels at 2700K, 3500K, 5000K, 6500K.

**Commit:** `feat(pdp): LED color-temp preview (F6)`

---

### Task 4.10: PDP tabs — Description, Specs, Reviews placeholder

**Files:** Create `components/shop/product-tabs.tsx`, Create `components/shop/specs-table.tsx`

**Step 1:** `ProductTabs` using shadcn `Tabs`: Description / Specifications / Reviews. Reviews content is a placeholder — actual UI lands in Phase 6.

**Step 2:** `SpecsTable` — iterates `Object.entries(product.specs)`, pretty-prints keys (`battery_hours` → `Battery hours`), formats values (arrays join w/ commas, booleans as Yes/No).

**Commit:** `feat(pdp): description/specs/reviews tabs`

---

### Task 4.11: Recently viewed tracking on PDP

**Files:** Modify `app/(shop)/p/[slug]/page.tsx`, Create `components/shop/recently-viewed-tracker.tsx`

**Step 1:** `RecentlyViewedTracker` — client component, on mount POSTs `{product_id}` to `/api/recently-viewed`.

**Step 2:** Include `<RecentlyViewedTracker productId={product.id} />` in PDP.

**Commit:** `feat(pdp): track recently viewed on page load`

---

### Task 4.12: Recommendations — "You might also like"

**Files:** Create `components/shop/recommendations-rail.tsx`

**Step 1:** Takes `recommendations` array from the PDP fetch. Renders horizontal scroll of product cards. 12 max.

**Step 2:** Include in PDP page below the tabs.

**Commit:** `feat(pdp): "you might also like" rail from recommendations`

---

### Task 4.13: Wishlist + Compare icons on PDP

**Files:** Create `components/shop/wishlist-icon-button.tsx`, Create `components/shop/compare-icon-button.tsx`, Create `lib/hooks/use-compare.ts`

**Step 1:** `WishlistIconButton` — client component:
- If not logged in → opens "Sign in to save" dialog.
- If logged in → toggle via `/api/wishlist` POST (add) / DELETE (remove). Heart fills when in wishlist.

**Step 2:** `/api/wishlist/route.ts` — GET lists user's wishlist; POST inserts; DELETE removes.

**Step 3:** `useCompare` hook reads/writes `compareIds` in localStorage (cap 4).

**Step 4:** `CompareIconButton` toggles id in localStorage + shows floating "Compare (N)" pill component globally.

**Step 5:** Create `components/shop/compare-floating-pill.tsx` rendered in shop layout.

**Commit:** `feat(pdp): wishlist and compare toggles`

---

## Phase 5 — Cart & Checkout (~2 days)

### Task 5.1: Cart API with persistence (session or user)

**Files:** Create `app/api/cart/route.ts`, Create `lib/cart.ts`

**Step 1:** Cookie `cart_sid` (http-only, persistent). If user logged in, use `user_id`; else `session_id`.

**Step 2:** `lib/cart.ts` — helper to resolve identifier:
```ts
export async function getCartOwner(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { user_id: user.id, session_id: null };
  const cookieStore = await cookies();
  let sid = cookieStore.get("cart_sid")?.value;
  if (!sid) { sid = crypto.randomUUID(); cookieStore.set("cart_sid", sid, { httpOnly: true, maxAge: 60*60*24*90 }); }
  return { user_id: null, session_id: sid };
}
```

**Step 3:** `/api/cart`:
- GET → list cart items w/ product join.
- POST `{product_id, quantity}` → upsert.
- PATCH `{product_id, quantity}` → update.
- DELETE `?product_id=` → remove.

**Step 4 (TDD):** Write a test for cart merge logic (`lib/__tests__/cart.test.ts`):
```ts
import { mergeCarts } from "../cart";
describe("mergeCarts", () => {
  it("sums quantities for same product, capped at stock", () => {
    const guest = [{ product_id: "a", quantity: 2 }];
    const user  = [{ product_id: "a", quantity: 3 }];
    const stock = { a: 10 };
    expect(mergeCarts(guest, user, stock)).toEqual([{ product_id: "a", quantity: 5 }]);
  });
  it("caps at stock", () => {
    const guest = [{ product_id: "a", quantity: 8 }];
    const user  = [{ product_id: "a", quantity: 5 }];
    const stock = { a: 10 };
    expect(mergeCarts(guest, user, stock)).toEqual([{ product_id: "a", quantity: 10 }]);
  });
});
```

Implement `mergeCarts` in `lib/cart.ts`.

**Step 5:** On user login (webhook or on first authenticated request), call merge and delete guest items.

**Commit:** `feat(cart): persisted cart with guest→user merge`

---

### Task 5.2: `/cart` page

**Files:** Create `app/(shop)/cart/page.tsx`, Create `components/shop/cart-item-row.tsx`

**Step 1:** Full page view — table of items (image, name, qty stepper, unit price, line total, remove). Right rail: subtotal, delivery estimator, "Proceed to checkout" CTA. Empty state links back to shop.

**Commit:** `feat(cart): /cart full page with subtotal and CTA`

---

### Task 5.3: Cart drawer update

**Files:** Modify the existing quick-view cart sheet (previously in old shop page; since that page is being rewritten, lift the sheet into a layout-level component)

**Step 1:** Create `components/shop/cart-drawer.tsx` — triggered by cart icon in header. Quick view of items + "View cart" (goes to `/cart`) + "Checkout".

**Step 2:** Mount in `(shop)/layout.tsx`.

**Commit:** `feat(cart): quick-view drawer in shop layout`

---

### Task 5.4: Checkout page shell

**Files:** Create `app/(shop)/checkout/page.tsx`, Create `components/shop/checkout-form.tsx`, Create `components/shop/payment-method-select.tsx`

**Step 1:** Three sections stacked:
1. Contact — email + phone (prefilled from profile if logged in). Logged-out users: "Create account" checkbox (opt-in).
2. Shipping — full name, phone, line1, line2, city (select from delivery_zones), district (auto-populated from city), postal code, notes.
3. Payment method — 3 radio cards:
   - Cash on Delivery (default)
   - Bank Transfer (shows bank account info + reference format preview)
   - Card (disabled, "Coming soon" label)

**Step 2:** Right rail: line items, subtotal, delivery fee (from chosen city), total, "Place order" button.

**Step 3:** Form validation (client-side): required fields, phone = digits-only 9-10 chars, email valid.

**Commit:** `feat(checkout): checkout page with contact/shipping/payment`

---

### Task 5.5: Checkout submit API

**Files:** Modify `app/api/store/checkout/route.ts` (likely exists — rewrite to support new schema)

**Step 1:** Accept body:
```ts
{
  contact: { email, phone, full_name },
  shipping: { line1, line2, city, district, postal_code, notes },
  payment_method: "cod" | "bank_transfer",
  items: [{product_id, quantity, unit_price}],
  save_address?: boolean
}
```

**Step 2:** Validate all items have stock ≥ qty. Return 409 with insufficient items if not.

**Step 3:** Use a Postgres RPC (or transaction via Supabase) to:
- Insert order (`type=outbound`, `status=pending`, payment_method, delivery_*, guest or user fields).
- Insert order_items with price + discount_pct snapshots.
- Decrement `products.quantity_in_stock`.
- If `save_address && user` → insert address.
- If payment_method = bank_transfer → `payment_status=pending`; if cod → `pending`.

**Step 4:** Extend existing RPC `002_complete_order_rpc.sql` if useful, or add a new one.

**Step 5:** Return `{order_id}`. Client redirects to `/order/[id]`.

**Commit:** `feat(checkout): submit order with stock reservation`

---

### Task 5.6: `/order/[id]` confirmation page

**Files:** Create `app/(shop)/order/[id]/page.tsx`

**Step 1:** Fetch order + items + address. Show:
- Confirmation heading ("Thanks, {name}!")
- Order number (uuid short form or reference_number)
- Items summary
- If bank_transfer → "How to pay" section: account details (from settings), reference to include (`ORDER-{short_id}`), "Mark order awaiting bank payment" note.
- Delivery estimate + address
- "Track order" stub (shows current status)

**Step 2:** Store bank details in `settings` table or env. For MVP, hardcode in a `lib/settings.ts` object:
```ts
export const STORE_SETTINGS = {
  bank_name: "Commercial Bank PLC",
  account_name: "VoltHub (Pvt) Ltd",
  account_number: "1234567890",
  branch: "Colombo 03",
  wa_number: process.env.NEXT_PUBLIC_STORE_WA_NUMBER,
  free_delivery_threshold: 5000,
};
```
(Admin settings UI lands in Phase 7.)

**Commit:** `feat(order): confirmation page with bank transfer instructions`

---

## Phase 6 — Reviews, Wishlist, Comparison, Account (~3 days)

### Task 6.1: Reviews write form

**Files:** Create `components/shop/review-form.tsx`, Create `app/api/reviews/route.ts`, Create a Supabase storage bucket `review-images`

**Step 1:** Storage bucket (run once via SQL or dashboard):
```sql
insert into storage.buckets (id, name, public) values ('review-images','review-images',true)
on conflict (id) do nothing;

-- Storage policy: authenticated users upload to their user_id subfolder
create policy "upload own review images" on storage.objects
for insert to authenticated
with check (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

**Step 2:** `/api/reviews`:
- POST `{product_id, rating, title?, body?, images?[]}` — insert review. Compute `verified_purchase = exists(orders join order_items for this user+product completed)`.
- DELETE `?id=` — owner only.

**Step 3:** `ReviewForm` — modal/inline form on PDP reviews tab. Rating stars, title, body, up to 4 image uploads to storage.

**Commit:** `feat(reviews): write form with photo uploads`

---

### Task 6.2: Reviews display + breakdown + helpful

**Files:** Create `components/shop/review-list.tsx`, Create `components/shop/rating-breakdown.tsx`, Create `app/api/reviews/[id]/helpful/route.ts`

**Step 1:** `RatingBreakdown` — horizontal bar chart for 1-5 stars showing % of reviews at each rating.

**Step 2:** `ReviewList` — cards w/ stars, title, body, photos (lightbox), author, date, verified badge, "Helpful" button.

**Step 3:** Filter chips: All / With photos / Verified / 5★ / 4★ / 3★ / 2★ / 1★.

**Step 4:** `/api/reviews/[id]/helpful` POST — increments `helpful_count` (session-based anti-dupe via cookie set with review ids).

**Step 5:** Wire reviews into PDP tabs replacing placeholder.

**Commit:** `feat(reviews): list with breakdown, filters, helpful voting`

---

### Task 6.3: Comparison — `/compare` page

**Files:** Create `app/(shop)/compare/page.tsx`, Create `components/shop/comparison-table.tsx`, Create `lib/compare.ts`, Create `lib/__tests__/compare.test.ts`

**Step 1 (TDD):**
```ts
import { computeSpecRows, bestValueMap } from "../compare";
describe("computeSpecRows", () => {
  it("returns union of keys across products", () => {
    const p = [{ specs: { a: 1, b: 2 } }, { specs: { b: 3, c: 4 } }];
    expect(computeSpecRows(p as any).sort()).toEqual(["a","b","c"]);
  });
});
describe("bestValueMap", () => {
  it("marks highest numeric value for max-desired keys", () => {
    const rows = [{ id: "x", v: 10 }, { id: "y", v: 20 }];
    expect(bestValueMap(rows, "max")).toEqual({ y: true });
  });
});
```

**Step 2:** `lib/compare.ts` with both helpers.

**Step 3:** `/compare?ids=a,b,c` — fetches products, passes to `ComparisonTable`. Table rows: Price, Rating, Reviews count, then dynamic spec rows. Best-value highlight per row using a per-key direction config:
```ts
const SPEC_DIRECTION: Record<string, "max"|"min"> = {
  battery_hours: "max", battery_wh: "max", lumens: "max", wattage: "max",
  power_w: "max", ip_rating: "max", // string-compared
  weight_g: "min", price: "min",
};
```

**Step 4:** Add "Remove" button per column; updates URL `ids=`.

**Commit:** `feat(compare): /compare page with best-value highlights`

---

### Task 6.4: Account shell — `/account`

**Files:** Create `app/(shop)/account/layout.tsx`, Create `app/(shop)/account/page.tsx` (redirects to orders)

**Step 1:** Layout with left-rail tabs: Orders / Wishlist / Addresses / Alerts / Reviews / Profile. Requires auth — redirect to `/login?next=/account` if not logged in.

**Commit:** `feat(account): account layout with tabs and auth gate`

---

### Task 6.5-6.10: Account sub-pages

**Combined task to keep plan tractable. Each sub-page ~30-60 min.**

- **`/account/orders`** — list user's orders with status chips; click opens detail.
- **`/account/wishlist`** — grid of saved products; "Remove" and "Move to cart" per card.
- **`/account/addresses`** — list + add/edit/delete + set default.
- **`/account/alerts`** — two tables: stock alerts and price alerts; "Cancel alert" button per row.
- **`/account/reviews`** — list user's own reviews; edit / delete.
- **`/account/profile`** — full name, avatar upload, password change.

Each uses existing shadcn table/form patterns.

**Commits (six separate):**
- `feat(account): orders list and detail`
- `feat(account): wishlist page`
- `feat(account): addresses CRUD`
- `feat(account): alerts management`
- `feat(account): user reviews list with edit/delete`
- `feat(account): profile edit`

---

## Phase 7 — Admin Extensions (~1-2 days)

### Task 7.1: Product form additions

**Files:** Modify existing product form (find via `components/products/product-form.tsx` or similar — likely in `components/products/`)

Add fields: brand (select w/ inline create), slug (auto from name, editable), discount_pct, warranty_months, is_genuine, images (gallery uploader), specs (key-value editor driven by category).

**Commit:** `feat(admin): product form fields for brand/slug/specs/images/warranty`

---

### Task 7.2: Image gallery uploader

**Files:** Create `components/admin/image-gallery-uploader.tsx`

Drag-drop (use HTML5 drag events, no external lib needed), reorder, delete. Uploads to Supabase storage bucket `product-images`.

**Commit:** `feat(admin): image gallery uploader for products`

---

### Task 7.3: Specs editor per category

**Files:** Create `components/admin/specs-editor.tsx`, Create `lib/specs-schema.ts`

`lib/specs-schema.ts`:
```ts
export const SPECS_SCHEMA: Record<string, { key: string; label: string; type: "number"|"text"|"boolean" }[]> = {
  "headphones": [
    { key: "driver_mm", label: "Driver size (mm)", type: "number" },
    { key: "freq_hz", label: "Frequency range", type: "text" },
    { key: "impedance_ohm", label: "Impedance (Ω)", type: "number" },
    { key: "battery_hours", label: "Battery life (hrs)", type: "number" },
    { key: "bluetooth", label: "Bluetooth", type: "text" },
    { key: "noise_cancel", label: "Noise cancelling", type: "boolean" },
    { key: "weight_g", label: "Weight (g)", type: "number" },
  ],
  "solar-garden-lights": [
    { key: "panel_watts", label: "Panel wattage (W)", type: "number" },
    { key: "led_watts", label: "LED wattage (W)", type: "number" },
    { key: "battery_wh", label: "Battery capacity (Wh)", type: "number" },
    { key: "auto_on_off", label: "Auto on/off", type: "boolean" },
    { key: "ip_rating", label: "IP rating", type: "text" },
  ],
  // ... add for every sub-category used in seeds
};
```

`SpecsEditor` — picks the schema for the selected category's slug and renders the matching inputs. Stores as JSONB.

**Commit:** `feat(admin): category-driven specs editor`

---

### Task 7.4: Admin pages (brands, flash-deals, reviews moderation, delivery-zones)

**Files:** Create under `app/(dashboard)/`:
- `app/(dashboard)/brands/page.tsx`
- `app/(dashboard)/flash-deals/page.tsx`
- `app/(dashboard)/reviews/page.tsx`
- `app/(dashboard)/delivery-zones/page.tsx`

Each reuses existing `data-table` component pattern. CRUD with dialogs.

**Commits (four):**
- `feat(admin): brands CRUD page`
- `feat(admin): flash deals CRUD with live countdown`
- `feat(admin): reviews moderation queue`
- `feat(admin): delivery zones CRUD`

---

### Task 7.5: Orders — payment method filter + mark as paid

**Files:** Modify `app/(dashboard)/orders/page.tsx`

**Step 1:** Add a filter chip for `payment_method`.

**Step 2:** For orders with `payment_method = 'bank_transfer' && payment_status = 'pending'` → show "Mark as paid" button that updates `payment_status = 'paid'` + `status = 'completed'`.

**Commit:** `feat(admin): orders filter by payment method and mark as paid`

---

### Task 7.6: Dashboard home new widgets

**Files:** Modify `app/(dashboard)/dashboard/page.tsx`

Add widgets:
- Top-selling products this week
- Pending reviews count (links to /dashboard/reviews)
- Pending bank-transfer orders
- Flash deals ending in < 24h

**Commit:** `feat(admin): dashboard widgets for e-com operations`

---

### Task 7.7: Store settings page

**Files:** Modify `app/(dashboard)/settings/page.tsx`, Create `supabase/migrations/030_store_settings.sql`

**Step 1:** Migration for a singleton settings table:
```sql
create table if not exists store_settings (
  id int primary key default 1 check (id = 1),
  wa_number text,
  free_delivery_threshold numeric(10,2) not null default 5000,
  bank_name text, bank_account_name text, bank_account_number text, bank_branch text,
  updated_at timestamptz not null default now()
);
insert into store_settings (id) values (1) on conflict do nothing;
alter table store_settings enable row level security;
create policy store_settings_read_public on store_settings for select using (true);
create policy store_settings_admin_write on store_settings for all using (is_admin()) with check (is_admin());
```

**Step 2:** Admin UI to edit fields.

**Step 3:** Replace `STORE_SETTINGS` hardcoded object in `lib/settings.ts` with a server-side fetch from this table (cached).

**Commit:** `feat(admin): store settings for WA, delivery threshold, bank details`

---

## Phase 8 — Polish & QA (~1-2 days)

### Task 8.1: Skeleton states audit

Go through each page/component that loads data. Add shadcn `Skeleton` placeholders to:
- Home rails
- PLP grid
- PDP
- Account pages

**Commit:** `chore(ui): add skeleton loading states across shop`

---

### Task 8.2: Error boundaries

Add `error.tsx` to each `(shop)` route group segment. Reuse existing `app/(dashboard)/error.tsx` pattern.

**Commit:** `chore(ui): error boundaries for shop route segments`

---

### Task 8.3: SEO metadata for PDP and category pages

**Files:** Modify PDP and category page components to export Next.js `generateMetadata`.

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("name, meta_title, meta_desc, images, price").eq("slug", slug).single();
  return {
    title: data?.meta_title ?? `${data?.name} | VoltHub`,
    description: data?.meta_desc ?? `Buy ${data?.name} at VoltHub. Genuine stock, islandwide delivery, COD available.`,
    openGraph: { images: data?.images?.slice(0,1) ?? [] },
  };
}
```

**Commit:** `feat(seo): dynamic metadata for PDP and categories`

---

### Task 8.4: A11y audit pass

- All interactive elements have `aria-label` where icon-only.
- Focus rings visible (Tailwind `focus-visible:ring-2 ring-ring`).
- Filter drawer traps focus.
- Compare table navigable by keyboard.
- Review photos have `alt` text from review body first 40 chars.

**Commit:** `chore(a11y): focus management and labels across shop`

---

### Task 8.5: Performance pass

- Use `next/image` for all product images with explicit `sizes`.
- Lazy-load below-the-fold rails (`loading="lazy"`).
- Confirm `font-display: swap` via next/font (already in place).
- Check Lighthouse — aim for 90+ on home and PDP.

**Commit:** `perf: image sizing and lazy-load below-fold rails`

---

### Task 8.6: Dark mode sweep

Walk every shop route with theme toggled → fix any hardcoded `bg-white` / `text-black` etc. Everything must use semantic tokens (`bg-background`, `text-foreground`, `border-border`).

**Commit:** `style(dark): sweep hardcoded colors to semantic tokens`

---

### Task 8.7: Mobile sweep

Each page at 375px width — fix overflow, squished grids, unreachable CTAs. Mobile cart drawer, mobile filter drawer, mobile search dropdown.

**Commit:** `style(mobile): responsive fixes across shop pages`

---

### Task 8.8: Playwright smoke E2E (happy path)

**Files:** Install Playwright, create `e2e/shop-happy-path.spec.ts`

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

Add script: `"e2e": "playwright test"` to package.json.

**Test:**
```ts
import { test, expect } from "@playwright/test";

test("browse to checkout happy path", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/VoltHub|flash deals/i).first()).toBeVisible();
  await page.click("text=Audio");
  await page.click(".product-card >> nth=0");
  await page.click("text=Add to Cart");
  await page.goto("/cart");
  await page.click("text=Proceed to checkout");
  await page.fill("[name=email]", "test@example.com");
  await page.fill("[name=phone]", "0771234567");
  await page.fill("[name=full_name]", "Test User");
  await page.fill("[name=line1]", "123 Test St");
  await page.selectOption("[name=city]", "Colombo");
  await page.click("text=Cash on Delivery");
  await page.click("text=Place order");
  await expect(page).toHaveURL(/\/order\//);
  await expect(page.getByText(/Thanks/i)).toBeVisible();
});
```

Run: `npm run e2e`. Expect pass.

**Commit:** `test: playwright smoke test for browse→checkout happy path`

---

### Task 8.9: Final cleanup + README

- Update `README.md` with: project overview, env vars needed, seed instructions, dev commands, deployment notes.
- Add `.env.example` covering: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_STORE_WA_NUMBER`.
- Remove unused deps from `package.json` (audit old boutique-specific deps).
- Run `npm run lint` → fix warnings.
- Run `npm run build` → ensure clean build.

**Commit:** `docs: update README and env example; lint clean`

---

## Execution Order Summary

```
Phase 0 (1d)  → Phase 1 (1-2d) → Phase 2 (2d) → Phase 3 (3d)
              → Phase 4 (3d)   → Phase 5 (2d) → Phase 6 (3d)
              → Phase 7 (1-2d) → Phase 8 (1-2d)
```

Each phase is **independently demo-able**. After Phase 2 you have a stylish home; after Phase 3 a browsable catalog; after Phase 4 shoppable PDPs with all 7 differentiators; after Phase 5 end-to-end checkout; after Phase 6 a full customer experience; after Phase 7 an admin that can manage it; after Phase 8 it's ready to ship.

**Total estimated effort: ~16-19 working days.**
