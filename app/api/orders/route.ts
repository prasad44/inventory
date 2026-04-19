import { withAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { validateOrder } from "@/lib/validators";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const paymentMethod = searchParams.get("payment_method");
  const paymentStatus = searchParams.get("payment_status");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  let query = supabase
    .from("orders")
    .select(
      "*, supplier:suppliers(id, name), creator:profiles!created_by(id, full_name), order_items(*, product:products(id, name, sku))",
      { count: "exact" }
    );

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (paymentMethod && ["cod", "bank_transfer", "card"].includes(paymentMethod)) {
    query = query.eq("payment_method", paymentMethod);
  }
  if (paymentStatus && ["pending", "paid", "failed"].includes(paymentStatus)) {
    query = query.eq("payment_status", paymentStatus);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, pageSize });
});

export const POST = withAuth(async (request, { user, supabase }) => {
  const body = await request.json();
  const errors = validateOrder(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      type: body.type,
      reference_number: body.reference_number || null,
      supplier_id: body.supplier_id || null,
      notes: body.notes || null,
      created_by: user.id,
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
    // Rollback: delete the order
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "created",
    entityType: "order",
    entityId: order.id,
    changes: { type: body.type, items_count: items.length },
  });

  return NextResponse.json({ data: order }, { status: 201 });
}, "manager");
