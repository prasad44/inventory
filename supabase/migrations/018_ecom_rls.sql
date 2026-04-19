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
