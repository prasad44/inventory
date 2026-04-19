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
