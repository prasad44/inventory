# E-commerce Inventory Control System — Design

## Overview

A full-featured inventory management system for e-commerce, built with Next.js 16, Supabase (Postgres + Auth), and a ribbon-style UI. Supports role-based access (Admin/Manager/Viewer) with Google OAuth.

## Architecture

- **Frontend:** Next.js App Router, React 19, Tailwind CSS v4, shadcn/ui, ribbon-style navigation
- **Backend:** Next.js API Routes (`/api/*`) with JSON request/response
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth with Google OAuth, cookie-based sessions via `@supabase/ssr`
- **Storage:** Supabase Storage for product images

Client components fetch data from API routes. API routes use a shared `withAuth(handler, requiredRole)` middleware that validates the Supabase session and checks the user's role.

## Data Model

### Products
`id` (UUID PK), `name`, `description`, `sku` (unique), `barcode` (optional unique), `category_id` (FK), `price`, `cost_price`, `quantity_in_stock`, `reorder_point`, `reorder_quantity`, `supplier_id` (FK), `image_url`, `status` (active/discontinued), `created_at`, `updated_at`

### Categories
`id`, `name`, `description`, `parent_id` (self-referencing FK for subcategories)

### Suppliers
`id`, `name`, `contact_name`, `email`, `phone`, `address`, `notes`, `created_at`

### Orders (Stock Movements)
`id`, `type` (inbound/outbound/adjustment), `status` (pending/completed/cancelled), `reference_number`, `supplier_id` (FK nullable), `notes`, `created_by` (FK to user), `created_at`, `completed_at`

### Order Items
`id`, `order_id` (FK), `product_id` (FK), `quantity`, `unit_price`

### Profiles
`id` (FK to auth.users), `full_name`, `avatar_url`, `role` (admin/manager/viewer)

### Audit Log
`id`, `user_id`, `action` (created/updated/deleted), `entity_type`, `entity_id`, `changes` (JSONB), `created_at`

## API Routes

| Route | Methods | Min Role | Purpose |
|---|---|---|---|
| `/api/auth/callback` | GET | Public | Google OAuth callback |
| `/api/products` | GET, POST | Viewer, Manager | List/search, create |
| `/api/products/[id]` | GET, PUT, DELETE | Viewer, Manager, Admin | Get, update, delete |
| `/api/categories` | GET, POST, PUT, DELETE | Viewer, Manager | CRUD |
| `/api/suppliers` | GET, POST, PUT, DELETE | Viewer, Manager | CRUD |
| `/api/orders` | GET, POST | Viewer, Manager | List, create |
| `/api/orders/[id]` | GET, PUT | Viewer, Manager | Get, update |
| `/api/orders/[id]/complete` | POST | Manager | Complete (adjusts stock) |
| `/api/dashboard/stats` | GET | Viewer | Summary stats |
| `/api/dashboard/alerts` | GET | Viewer | Low-stock alerts |
| `/api/users` | GET, PUT | Admin | Manage roles |
| `/api/audit-log` | GET | Admin | Audit trail |

## UI Layout

Ribbon-style navigation with tabs:
- **Home** — Dashboard (summary cards, low-stock alerts, recent activity chart)
- **Inventory** — Products table (search, filter, bulk actions), product forms
- **Orders** — Stock movements table, order creation wizard
- **Suppliers** — Supplier list and details
- **Settings** — Categories, user management (Admin), audit log (Admin)

Left sidebar icon bar for quick access. Right-side persistent area with user info and logout.

## Auth Flow

1. Landing page with "Sign in with Google"
2. Supabase handles OAuth → `/api/auth/callback`
3. DB trigger creates `profiles` row with default `viewer` role on first login
4. Admin promotes users via Settings > Users
5. `middleware.ts` redirects unauthenticated users to login
6. API middleware checks session + role per route
7. UI conditionally renders controls based on role

## Business Logic

- Stock updates only on order **completion** (not creation)
- Inbound increases stock, outbound decreases, adjustments do either
- Outbound completion blocked if it would cause negative stock
- Low-stock alerts: products where `quantity_in_stock <= reorder_point`, sorted by urgency
- Audit log captures JSONB diffs for all entity mutations, admin-viewable
- Search: full-text on product name/SKU/barcode; filters by category, supplier, status, stock level, date range
