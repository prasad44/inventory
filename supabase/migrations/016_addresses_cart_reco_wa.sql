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
