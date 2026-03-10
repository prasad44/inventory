-- RPC function to complete an order and update stock transactionally
create or replace function complete_order(p_order_id uuid, p_user_id uuid default null)
returns json as $$
declare
  v_order record;
  v_item record;
  v_new_qty integer;
begin
  -- Lock the order row
  select * into v_order from orders where id = p_order_id for update;

  if v_order is null then
    return json_build_object('error', 'Order not found');
  end if;

  if v_order.status != 'pending' then
    return json_build_object('error', 'Order is not in pending status');
  end if;

  -- Process each item
  for v_item in
    select oi.*, p.quantity_in_stock, p.name as product_name
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = p_order_id
    for update of p
  loop
    if v_order.type = 'inbound' then
      v_new_qty := v_item.quantity_in_stock + v_item.quantity;
    elsif v_order.type = 'outbound' then
      v_new_qty := v_item.quantity_in_stock - v_item.quantity;
      if v_new_qty < 0 then
        return json_build_object(
          'error',
          format('Insufficient stock for %s. Available: %s, Requested: %s',
            v_item.product_name, v_item.quantity_in_stock, v_item.quantity)
        );
      end if;
    elsif v_order.type = 'adjustment' then
      -- For adjustments, quantity can be positive (add) or negative (subtract)
      v_new_qty := v_item.quantity_in_stock + v_item.quantity;
      if v_new_qty < 0 then
        return json_build_object(
          'error',
          format('Adjustment would result in negative stock for %s', v_item.product_name)
        );
      end if;
    end if;

    -- Update product stock
    update products
    set quantity_in_stock = v_new_qty, updated_at = now()
    where id = v_item.product_id;

    -- Log audit for each product stock change
    insert into audit_log (user_id, action, entity_type, entity_id, changes)
    values (
      p_user_id,
      'updated',
      'product',
      v_item.product_id,
      json_build_object(
        'field', 'quantity_in_stock',
        'from', v_item.quantity_in_stock,
        'to', v_new_qty,
        'order_id', p_order_id,
        'order_type', v_order.type
      )::jsonb
    );
  end loop;

  -- Mark order as completed
  update orders
  set status = 'completed', completed_at = now()
  where id = p_order_id;

  -- Log audit for order completion
  insert into audit_log (user_id, action, entity_type, entity_id, changes)
  values (
    p_user_id,
    'updated',
    'order',
    p_order_id,
    json_build_object('status', 'completed', 'type', v_order.type)::jsonb
  );

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;
