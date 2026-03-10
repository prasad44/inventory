import { createClient } from "@/lib/supabase/server";
import { validateOrder } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  // Basic validation
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: "No items in cart" }, { status: 400 });
  }

  // Use a system profile or a 'public-customer' ID if you have one, 
  // or just leave created_by as null for public orders if allowed by schema.
  // For this demo, we'll try to find an admin to 'own' the public order 
  // or just omit it if the DB allows.
  
  // Create order as "pending" so the complete_order RPC can process it
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      type: "outbound",
      reference_number: `STORE-${Date.now().toString().slice(-6)}`,
      notes: "Public Storefront Order",
      status: "pending",
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Create order items
  const items = (body.items as Array<{ product_id: string; quantity: number; unit_price: number }>).map(
    (item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
    })
  );

  const { error: itemsError } = await supabase.from("order_items").insert(items);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Call RPC to complete the order and reduce stock transactionally
  const { data: rpcResult, error: rpcError } = await supabase.rpc("complete_order", {
    p_order_id: order.id,
  });

  if (rpcError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  if (rpcResult?.error) {
    // Stock insufficient or other validation error — cancel the order
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: rpcResult.error }, { status: 400 });
  }

  return NextResponse.json({ data: { ...order, status: "completed" }, success: true }, { status: 201 });
}
