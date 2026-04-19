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
