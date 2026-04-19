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
set slug = lower(regexp_replace(name || '-' || substr(id::text, 1, 6), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

alter table products alter column slug set not null;

create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_brand on products(brand);
create index if not exists idx_products_category_status on products(category_id, status) where status = 'active';
create index if not exists idx_products_discount on products(discount_pct) where discount_pct > 0;
