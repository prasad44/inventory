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
