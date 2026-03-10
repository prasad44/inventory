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