import { withAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_request, { supabase, params }) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, supplier:suppliers(id, name), creator:profiles!created_by(id, full_name), order_items(*, product:products(id, name, sku, quantity_in_stock))"
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
});

export const PUT = withAuth(async (request, { user, supabase, params }) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const body = await request.json();

  // Only allow updating pending orders
  const { data: existing } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Only pending orders can be updated" }, { status: 400 });
  }

  // Handle cancel
  if (body.status === "cancelled") {
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit(supabase, {
      userId: user.id,
      action: "updated",
      entityType: "order",
      entityId: id,
      changes: { status: "cancelled" },
    });

    return NextResponse.json({ data });
  }

  // Update order details
  const { data, error } = await supabase
    .from("orders")
    .update({
      reference_number: body.reference_number ?? existing.reference_number,
      supplier_id: body.supplier_id ?? existing.supplier_id,
      notes: body.notes ?? existing.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "updated",
    entityType: "order",
    entityId: id,
    changes: { before: existing, after: data },
  });

  return NextResponse.json({ data });
}, "manager");
