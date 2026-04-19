alter table orders
  add column if not exists payment_method text check (payment_method in ('cod','bank_transfer','card')),
  add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  add column if not exists shipping_address_id uuid references addresses(id) on delete set null,
  add column if not exists guest_email text,
  add column if not exists guest_phone text,
  add column if not exists delivery_city text,
  add column if not exists delivery_fee numeric(10,2) not null default 0,
  add column if not exists delivery_estimate text,
  add column if not exists customer_notes text;

alter table order_items
  add column if not exists discount_pct_snapshot int not null default 0,
  add column if not exists serial_number text;

create index if not exists idx_orders_payment_method on orders(payment_method);
create index if not exists idx_orders_payment_status on orders(payment_status);
