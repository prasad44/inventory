import { withAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_request, { supabase }) => {
  // Get total products
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  // Get active products
  const { count: activeProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get low stock count
  const { data: allProducts } = await supabase
    .from("products")
    .select("quantity_in_stock, reorder_point")
    .eq("status", "active");

  const lowStockCount = allProducts?.filter(
    (p) => p.quantity_in_stock <= p.reorder_point && p.quantity_in_stock > 0
  ).length ?? 0;

  const outOfStockCount = allProducts?.filter(
    (p) => p.quantity_in_stock === 0
  ).length ?? 0;

  // Calculate total inventory value
  const { data: valueData } = await supabase
    .from("products")
    .select("quantity_in_stock, cost_price");

  const totalValue = valueData?.reduce(
    (sum, p) => sum + p.quantity_in_stock * Number(p.cost_price),
    0
  ) ?? 0;

  // Get total suppliers
  const { count: totalSuppliers } = await supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true });

  // Get pending orders
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return NextResponse.json({
    data: {
      totalProducts: totalProducts ?? 0,
      activeProducts: activeProducts ?? 0,
      lowStockCount,
      outOfStockCount,
      totalValue,
      totalSuppliers: totalSuppliers ?? 0,
      pendingOrders: pendingOrders ?? 0,
    },
  });
});
