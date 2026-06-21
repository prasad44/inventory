-- ============================================================
-- Bootstrap: full schema + seed for a fresh Supabase project
-- Generated 2026-06-21. Paste into Supabase SQL Editor and Run.
-- Files concatenated in dependency order (NOT filename order).
-- NOTE: create a PUBLIC 'product-images' storage bucket separately.
-- ============================================================


-- ============================================================
-- 001_initial_schema.sql
-- ============================================================
-- Categories (self-referencing for subcategories)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamptz default now()
);

-- Suppliers
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text unique not null,
  barcode text unique,
  category_id uuid references categories(id) on delete set null,
  price numeric(10,2) not null default 0,
  cost_price numeric(10,2) not null default 0,
  quantity_in_stock integer not null default 0,
  reorder_point integer not null default 0,
  reorder_quantity integer not null default 0,
  supplier_id uuid references suppliers(id) on delete set null,
  image_url text,
  status text not null default 'active' check (status in ('active', 'discontinued')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiles (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'viewer' check (role in ('admin', 'manager', 'viewer')),
  created_at timestamptz default now()
);

-- Orders (stock movements)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('inbound', 'outbound', 'adjustment')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  reference_number text,
  supplier_id uuid references suppliers(id) on delete set null,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Order Items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null,
  unit_price numeric(10,2) not null default 0
);

-- Audit Log
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  entity_type text not null,
  entity_id uuid not null,
  changes jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_products_sku on products(sku);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_supplier on products(supplier_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_orders_type on orders(type);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_by on orders(created_by);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);
create index if not exists idx_audit_log_entity on audit_log(entity_type, entity_id);
create index if not exists idx_audit_log_user on audit_log(user_id);
create index if not exists idx_categories_parent on categories(parent_id);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS on all tables
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table audit_log enable row level security;

-- RLS Policies: authenticated users can read all, write handled by API
create policy "Authenticated users can read categories" on categories for select to authenticated using (true);
create policy "Authenticated users can all categories" on categories for all to authenticated using (true) with check (true);

create policy "Authenticated users can read suppliers" on suppliers for select to authenticated using (true);
create policy "Authenticated users can all suppliers" on suppliers for all to authenticated using (true) with check (true);

create policy "Authenticated users can read products" on products for select to authenticated using (true);
create policy "Authenticated users can all products" on products for all to authenticated using (true) with check (true);

create policy "Users can read own profile" on profiles for select to authenticated using (true);
create policy "Users can update own profile" on profiles for all to authenticated using (true) with check (true);

create policy "Authenticated users can read orders" on orders for select to authenticated using (true);
create policy "Authenticated users can all orders" on orders for all to authenticated using (true) with check (true);

create policy "Authenticated users can read order_items" on order_items for select to authenticated using (true);
create policy "Authenticated users can all order_items" on order_items for all to authenticated using (true) with check (true);

create policy "Authenticated users can read audit_log" on audit_log for select to authenticated using (true);
create policy "Authenticated users can insert audit_log" on audit_log for insert to authenticated with check (true);


-- ============================================================
-- 001_B_trigger.sql
-- ============================================================
  -- 1. Re-create the trigger function
  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, full_name, avatar_url, role)     
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name',
  new.raw_user_meta_data->>'name', ''),
      coalesce(new.raw_user_meta_data->>'avatar_url',
  new.raw_user_meta_data->>'picture', ''),
      'viewer'
    );
    return new;
  end;
  $$ language plpgsql security definer;

  -- 2. Re-create the trigger
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

  -- 3. Backfill your existing user as admin
  insert into public.profiles (id, full_name, role)
  select id, coalesce(raw_user_meta_data->>'full_name', email),       
  'admin'
  from auth.users
  on conflict (id) do update set role = 'admin';

-- ============================================================
-- 002_complete_order_rpc.sql
-- ============================================================
-- RPC function to complete an order and update stock transactionally
create or replace function complete_order(p_order_id uuid, p_user_id uuid default null)
returns json as $$
declare
  v_order record;
  v_item record;
  v_new_qty integer;
begin
  -- Lock the order row
  select * into v_order from orders where id = p_order_id for update;

  if v_order is null then
    return json_build_object('error', 'Order not found');
  end if;

  if v_order.status != 'pending' then
    return json_build_object('error', 'Order is not in pending status');
  end if;

  -- Process each item
  for v_item in
    select oi.*, p.quantity_in_stock, p.name as product_name
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = p_order_id
    for update of p
  loop
    if v_order.type = 'inbound' then
      v_new_qty := v_item.quantity_in_stock + v_item.quantity;
    elsif v_order.type = 'outbound' then
      v_new_qty := v_item.quantity_in_stock - v_item.quantity;
      if v_new_qty < 0 then
        return json_build_object(
          'error',
          format('Insufficient stock for %s. Available: %s, Requested: %s',
            v_item.product_name, v_item.quantity_in_stock, v_item.quantity)
        );
      end if;
    elsif v_order.type = 'adjustment' then
      -- For adjustments, quantity can be positive (add) or negative (subtract)
      v_new_qty := v_item.quantity_in_stock + v_item.quantity;
      if v_new_qty < 0 then
        return json_build_object(
          'error',
          format('Adjustment would result in negative stock for %s', v_item.product_name)
        );
      end if;
    end if;

    -- Update product stock
    update products
    set quantity_in_stock = v_new_qty, updated_at = now()
    where id = v_item.product_id;

    -- Log audit for each product stock change
    insert into audit_log (user_id, action, entity_type, entity_id, changes)
    values (
      p_user_id,
      'updated',
      'product',
      v_item.product_id,
      json_build_object(
        'field', 'quantity_in_stock',
        'from', v_item.quantity_in_stock,
        'to', v_new_qty,
        'order_id', p_order_id,
        'order_type', v_order.type
      )::jsonb
    );
  end loop;

  -- Mark order as completed
  update orders
  set status = 'completed', completed_at = now()
  where id = p_order_id;

  -- Log audit for order completion
  insert into audit_log (user_id, action, entity_type, entity_id, changes)
  values (
    p_user_id,
    'updated',
    'order',
    p_order_id,
    json_build_object('status', 'completed', 'type', v_order.type)::jsonb
  );

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;


-- ============================================================
-- 003_admin_access.sql
-- ============================================================
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id =
      'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-image'
      AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-image'
      AND auth.role() = 'authenticated');

-- ============================================================
-- 004_signup_role_trigger.sql
-- ============================================================
-- 004: Update trigger to read role from signup metadata + fix admin profile

-- 1. Update the trigger function to read role from user_metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _role text;
begin
  -- Read role from signup metadata, default to 'viewer' if missing or invalid
  _role := coalesce(new.raw_user_meta_data->>'role', 'viewer');
  if _role not in ('admin', 'manager', 'viewer') then
    _role := 'viewer';
  end if;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    _role
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Re-create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Promote the original admin user to 'admin' — but only if that auth
--    user actually exists (guarded so this is a no-op on a fresh project
--    where the old user id is absent, avoiding a profiles_id_fkey violation).
insert into public.profiles (id, full_name, role)
select '0549e42b-eef3-48f6-91ce-2f25ea36d341', 'Admin', 'admin'
where exists (
  select 1 from auth.users where id = '0549e42b-eef3-48f6-91ce-2f25ea36d341'
)
on conflict (id) do update set role = 'admin';


-- ============================================================
-- 010_products_extensions.sql
-- ============================================================
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


-- ============================================================
-- 011_brands_categories_zones.sql
-- ============================================================
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


-- ============================================================
-- 012_reviews.sql
-- ============================================================
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


-- ============================================================
-- 013_wishlist_recently_viewed.sql
-- ============================================================
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


-- ============================================================
-- 014_flash_deals.sql
-- ============================================================
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


-- ============================================================
-- 015_alerts_notifications.sql
-- ============================================================
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


-- ============================================================
-- 016_addresses_cart_reco_wa.sql
-- ============================================================
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


-- ============================================================
-- 017_orders_ecom.sql
-- ============================================================
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


-- ============================================================
-- 018_ecom_rls.sql
-- ============================================================
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


-- ============================================================
-- 020_seed_delivery_zones.sql
-- ============================================================
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


-- ============================================================
-- 021_seed_categories_brands.sql
-- ============================================================
-- Top-level categories
insert into categories (name, slug, icon, sort_order) values
('Audio','audio','headphones',1),
('Lighting','lighting','lightbulb',2),
('Solar','solar','sun',3),
('Accessories','accessories','cable',4),
('Smart Home','smart-home','house',5)
on conflict (slug) do nothing;

-- Sub-categories
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


-- ============================================================
-- 022_seed_products.sql
-- ============================================================
-- Template CTE lookup pattern
with cats as (select id, slug from categories)
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
  '{"power_w":20,"battery_hours":12,"bluetooth":"5.1","ip_rating":"IP67","weight_g":550}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1589003077984-894e133dabab','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1'],
  10, 12, true, 4.6, 120, 'active'),

('Sony WH-1000XM5', 'Industry-leading noise-cancellation over-ear headphones.',
  'SNY-WH1000XM5','sony-wh-1000xm5',
  (select id from cats where slug='headphones'), 119000, 92000,
  12, 3, 10, 'Sony',
  '{"driver_mm":30,"freq_hz":"4-40000","battery_hours":30,"bluetooth":"5.2","noise_cancel":true,"weight_g":250}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb','https://images.unsplash.com/photo-1505740420928-5e560c06d30e'],
  5, 24, true, 4.8, 95, 'active'),

('Sony WF-1000XM4', 'True wireless earbuds with premium noise-cancellation.',
  'SNY-WF1000XM4','sony-wf-1000xm4',
  (select id from cats where slug='earbuds'), 62990, 48000,
  18, 4, 15, 'Sony',
  '{"driver_mm":6,"battery_hours":8,"case_hours":24,"bluetooth":"5.2","noise_cancel":true,"ip_rating":"IPX4"}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df'],
  15, 12, true, 4.5, 210, 'active'),

('JBL Tune 510BT', 'Wireless on-ear headphones with Pure Bass sound.',
  'JBL-TUNE510BT','jbl-tune-510bt',
  (select id from cats where slug='headphones'), 14990, 10500,
  40, 8, 30, 'JBL',
  '{"driver_mm":32,"battery_hours":40,"bluetooth":"5.0","weight_g":160}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1546435770-a3e426bf472b'],
  20, 12, true, 4.4, 340, 'active'),

('Bose QuietComfort 45', 'Iconic comfort, world-class noise-cancellation.',
  'BOSE-QC45','bose-quietcomfort-45',
  (select id from cats where slug='headphones'), 105000, 82000,
  8, 2, 8, 'Bose',
  '{"driver_mm":40,"battery_hours":24,"bluetooth":"5.1","noise_cancel":true,"weight_g":240}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1484704849700-f032a568e944'],
  0, 12, true, 4.7, 78, 'active'),

('Sennheiser HD 560S', 'Open-back reference headphones for audiophiles.',
  'SNH-HD560S','sennheiser-hd-560s',
  (select id from cats where slug='headphones'), 52990, 41000,
  6, 2, 6, 'Sennheiser',
  '{"driver_mm":38,"freq_hz":"6-38000","impedance_ohm":120,"weight_g":240}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1545127398-14699f92334b'],
  0, 24, true, 4.6, 45, 'active'),

('JBL Charge 5', 'Portable bluetooth speaker with powerbank function.',
  'JBL-CHARGE5','jbl-charge-5',
  (select id from cats where slug='bluetooth-speakers'), 54990, 42000,
  15, 3, 12, 'JBL',
  '{"power_w":40,"battery_hours":20,"bluetooth":"5.1","ip_rating":"IP67","weight_g":960}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1'],
  8, 12, true, 4.7, 180, 'active'),

('JBL Bar 5.1 Soundbar', 'Detachable wireless surround soundbar with subwoofer.',
  'JBL-BAR51','jbl-bar-5-1',
  (select id from cats where slug='soundbars'), 189000, 145000,
  4, 1, 4, 'JBL',
  '{"power_w":510,"channels":"5.1","hdmi_in":3,"bluetooth":"5.0","subwoofer":true}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1545454675-3531b543be5d'],
  12, 24, true, 4.5, 34, 'active'),

-- LIGHTING
('Philips Hue White and Color E27', 'Smart LED bulb with 16M colors.',
  'PHP-HUE-E27','philips-hue-white-color-e27',
  (select id from cats where slug='smart-lights'), 8990, 6800,
  50, 10, 40, 'Philips',
  '{"wattage":9,"lumens":800,"color_temp_min":2000,"color_temp_max":6500,"colors":"16M","fitting":"E27","smart":true,"calculator_meta":{"replaced_bulb_watts":60}}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1565636192335-0f7a3063e24d'],
  0, 24, true, 4.6, 92, 'active'),

('Xiaomi Mi LED Smart Bulb', 'Dimmable color-changing smart bulb.',
  'XMI-MI-BULB','xiaomi-mi-led-smart-bulb',
  (select id from cats where slug='smart-lights'), 2490, 1700,
  120, 20, 80, 'Xiaomi',
  '{"wattage":10,"lumens":800,"color_temp_min":1700,"color_temp_max":6500,"fitting":"E27","smart":true,"calculator_meta":{"replaced_bulb_watts":60}}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1621186820654-91d3c8d0d2e6'],
  10, 12, true, 4.3, 260, 'active'),

('Philips Essential LED 9W', 'Everyday LED bulb, cool daylight.',
  'PHP-ESSLED-9W','philips-essential-led-9w',
  (select id from cats where slug='led-bulbs'), 890, 550,
  300, 50, 200, 'Philips',
  '{"wattage":9,"lumens":830,"color_temp_min":6500,"color_temp_max":6500,"fitting":"E27","calculator_meta":{"replaced_bulb_watts":60}}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1524634126442-357e0eac3c14'],
  0, 24, true, 4.5, 520, 'active'),

('Xiaomi Yeelight LED Strip 2m', 'RGB smart LED strip, 2m extendable.',
  'XMI-YEELIGHT-2M','xiaomi-yeelight-led-strip-2m',
  (select id from cats where slug='led-strips'), 4990, 3600,
  60, 10, 40, 'Xiaomi',
  '{"wattage":10,"length_m":2,"colors":"16M","smart":true,"ip_rating":"IP44"}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1565636192335-0f7a3063e24d'],
  20, 12, true, 4.4, 145, 'active'),

-- SOLAR
('SolarMax Garden Light 4-Pack', 'Stainless steel pathway lights with auto on/off.',
  'SMX-GDN-4PK','solarmax-garden-light-4-pack',
  (select id from cats where slug='solar-garden-lights'), 5990, 3800,
  80, 15, 60, 'SolarMax LK',
  '{"panel_watts":2,"led_watts":1.5,"battery_wh":3.7,"auto_on_off":true,"ip_rating":"IP65","calculator_meta":{"replaced_bulb_watts":40}}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1601699628066-8b7e9e97f01a'],
  0, 12, true, 4.2, 88, 'active'),

('SolarMax 20W Panel Kit', 'Polycrystalline 20W panel with charge controller.',
  'SMX-PANEL20W','solarmax-20w-panel-kit',
  (select id from cats where slug='solar-panels'), 12990, 9000,
  20, 5, 15, 'SolarMax LK',
  '{"panel_watts":20,"voltage":12,"controller":true,"dimensions_cm":"35x45"}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1509391366360-2e959784a276'],
  10, 24, true, 4.3, 42, 'active'),

('Anker Solar Power Bank 25000mAh', 'High-capacity solar-topup power bank.',
  'ANK-SOLAR-25K','anker-solar-power-bank-25000mah',
  (select id from cats where slug='solar-power-banks'), 11990, 8500,
  30, 6, 24, 'Anker',
  '{"capacity_mah":25000,"panel_watts":3,"usb_ports":3,"ip_rating":"IPX5"}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5'],
  15, 12, true, 4.1, 125, 'active'),

('SolarMax 60W LED Street Light', 'All-in-one solar LED street light with motion sensor.',
  'SMX-STREET60W','solarmax-60w-led-street-light',
  (select id from cats where slug='solar-street-lights'), 22990, 15000,
  12, 3, 10, 'SolarMax LK',
  '{"panel_watts":60,"led_watts":30,"battery_wh":160,"motion_sensor":true,"ip_rating":"IP66","calculator_meta":{"replaced_bulb_watts":150}}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1594736797933-d0c62a3e2c70'],
  8, 24, true, 4.0, 28, 'active'),

-- ACCESSORIES
('Anker PowerLine III USB-C to USB-C 1m', 'Ultra-durable fast charging cable.',
  'ANK-PL3-USBC1M','anker-powerline-iii-usbc-1m',
  (select id from cats where slug='cables-chargers'), 2490, 1500,
  150, 30, 100, 'Anker',
  '{"length_m":1,"type":"USB-C to USB-C","power_w":100,"data_gbps":10}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1583863788434-e58a36330cf0'],
  0, 18, true, 4.7, 430, 'active'),

('Anker PowerCore 20000 PD', 'Fast charging 20,000 mAh power bank with USB-C PD.',
  'ANK-PC20K-PD','anker-powercore-20000-pd',
  (select id from cats where slug='power-banks'), 14990, 11000,
  40, 8, 30, 'Anker',
  '{"capacity_mah":20000,"output_w":25,"usb_ports":2,"pd":true}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5'],
  10, 18, true, 4.6, 215, 'active'),

('SanDisk Ultra 128GB microSD', 'A1 rated for app performance.',
  'SDK-ULTRA-128','sandisk-ultra-128gb-microsd',
  (select id from cats where slug='memory-cards'), 4490, 3100,
  200, 50, 150, 'Anker',
  '{"capacity_gb":128,"class":"A1 UHS-I","read_mbps":120}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1591488542687-50814bfe2eb9'],
  5, 60, true, 4.8, 890, 'active'),

-- SMART HOME
('Xiaomi Mi Smart Plug', 'Wi-Fi smart plug with energy monitoring.',
  'XMI-SMART-PLUG','xiaomi-mi-smart-plug',
  (select id from cats where slug='smart-plugs'), 2990, 2000,
  80, 15, 60, 'Xiaomi',
  '{"max_load_w":2500,"wifi":"2.4GHz","energy_monitor":true}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1585771724684-38269d6639fd'],
  10, 12, true, 4.4, 180, 'active'),

('Xiaomi Mi Camera 2K', 'Indoor security camera with AI detection.',
  'XMI-CAM-2K','xiaomi-mi-camera-2k',
  (select id from cats where slug='security-cameras'), 8990, 6200,
  35, 7, 25, 'Xiaomi',
  '{"resolution":"2K","night_vision":true,"ai_detection":true,"two_way_audio":true}'::jsonb,
  ARRAY['https://images.unsplash.com/photo-1558002038-1055907df827'],
  0, 12, true, 4.3, 120, 'active')
on conflict (slug) do nothing;


-- ============================================================
-- 023_seed_deals_reviews.sql
-- ============================================================
-- Flash deals for 8 products (active now, ending in 1-7 days)
with p as (select id, slug from products)
insert into flash_deals (product_id, discount_pct, starts_at, ends_at, max_units)
select p.id, d.discount_pct, now() - interval '6 hours', now() + d.ends_in, d.max_units
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

-- Seeded reviews (requires at least one profile to exist)
-- If no admin profile exists yet (fresh DB), inserts will skip
insert into reviews (product_id, user_id, rating, title, body, verified_purchase, helpful_count)
select p.id, pr.id, r.rating, r.title, r.body, r.verified, r.helpful
from products p
cross join (select id from profiles order by created_at asc limit 1) pr
join (values
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
on conflict (product_id, user_id) do nothing;


-- ============================================================
-- 024_seed_recommendations.sql
-- ============================================================
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
where exists (
  select 1 from (
    select related_product_id, row_number() over (partition by product_id order by score desc) as rn
    from recommendations
    where product_id = r.product_id
  ) t
  where t.related_product_id = r.related_product_id and t.rn > 12
);


-- ============================================================
-- 031_review_images_bucket.sql
-- ============================================================
-- Create the review-images storage bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do nothing;

-- Policies: authenticated users upload into their own user-id folder
drop policy if exists "review_images_read" on storage.objects;
drop policy if exists "review_images_insert_self" on storage.objects;
drop policy if exists "review_images_update_self" on storage.objects;
drop policy if exists "review_images_delete_self" on storage.objects;

create policy review_images_read on storage.objects
for select using (bucket_id = 'review-images');

create policy review_images_insert_self on storage.objects
for insert to authenticated
with check (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy review_images_update_self on storage.objects
for update to authenticated
using (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy review_images_delete_self on storage.objects
for delete to authenticated
using (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================
-- 032_alert_delete_policies.sql
-- ============================================================
-- Allow authenticated users to cancel their own stock/price alerts.
-- Migration 018 set up `insert_any` + `read_own` but no delete policies.
-- Without a DELETE policy, RLS denies the row and the mutation silently
-- no-ops, leaving the cancel button in /account/alerts non-functional.

drop policy if exists stock_alerts_delete_own on stock_alerts;
create policy stock_alerts_delete_own on stock_alerts
for delete
using (user_id = auth.uid());

drop policy if exists price_alerts_delete_own on price_alerts;
create policy price_alerts_delete_own on price_alerts
for delete
using (user_id = auth.uid());


-- ============================================================
-- 033_store_settings.sql
-- ============================================================
-- Singleton store settings (at most one row, id=1 enforced by check)
create table if not exists store_settings (
  id int primary key default 1 check (id = 1),
  wa_number text,
  free_delivery_threshold numeric(10,2) not null default 5000,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_branch text,
  updated_at timestamptz not null default now()
);

-- Ensure the one row exists (idempotent)
insert into store_settings (id) values (1) on conflict do nothing;

alter table store_settings enable row level security;

-- Public read so the shop can show bank info on order confirmation without auth
drop policy if exists store_settings_read_public on store_settings;
create policy store_settings_read_public on store_settings for select using (true);

-- Admin/manager write only
drop policy if exists store_settings_admin_write on store_settings;
create policy store_settings_admin_write on store_settings
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','manager'))
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','manager'))
  );

