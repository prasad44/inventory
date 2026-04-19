-- Allow authenticated users to cancel their own stock/price alerts.
-- Migration 018 set up `insert_any` + `read_own` but no delete policies.
-- Without a DELETE policy, RLS denies the row and the mutation silently
-- no-ops, leaving the cancel button in /account/alerts non-functional.

drop policy if exists stock_alerts_delete_own on stock_alerts;
create policy stock_alerts_delete_own on stock_alerts
for delete
using (user_id = auth.uid());

drop policy if exists price_alerts_delete_own on price_alerts;
create policy price_alerts_delete_own on price_alerts
for delete
using (user_id = auth.uid());
