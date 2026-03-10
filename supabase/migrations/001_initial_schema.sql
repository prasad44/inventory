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
