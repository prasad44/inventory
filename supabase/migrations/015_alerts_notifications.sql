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
