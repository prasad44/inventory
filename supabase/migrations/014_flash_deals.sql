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
