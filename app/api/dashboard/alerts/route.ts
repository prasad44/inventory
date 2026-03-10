import { withAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_request, { supabase }) => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, quantity_in_stock, reorder_point, reorder_quantity, supplier:suppliers(id, name)")
    .eq("status", "active")
    .order("quantity_in_stock", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to low-stock items (stock <= reorder_point)
  const alerts = data?.filter(
    (p) => p.quantity_in_stock <= p.reorder_point
  ) ?? [];

  // Sort by urgency: out of stock first, then by how far below reorder point
  alerts.sort((a, b) => {
    const urgencyA = a.reorder_point - a.quantity_in_stock;
    const urgencyB = b.reorder_point - b.quantity_in_stock;
    return urgencyB - urgencyA;
  });

  return NextResponse.json({ data: alerts });
});
