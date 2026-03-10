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

-- 3. Insert profile for existing admin user (skip if already exists)
insert into public.profiles (id, full_name, role)
values (
  '0549e42b-eef3-48f6-91ce-2f25ea36d341',
  'Admin',
  'admin'
)
on conflict (id) do update set role = 'admin';
