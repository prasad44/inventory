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
