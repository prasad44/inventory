import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Manual fetch for top products: group order_items joined to completed outbound orders
  const { data: items } = await supabase
    .from("order_items")
    .select(
      "quantity, product:products(id, name, slug), order:orders!inner(status, type, completed_at)"
    )
    .eq("orders.status", "completed")
    .eq("orders.type", "outbound")
    .gte("orders.completed_at", sinceWeek);

  type ProductRef = { id: string; name: string; slug: string };
  type ItemRow = {
    quantity: number;
    // Supabase returns embedded relations as arrays in its generated types,
    // even when the relation is effectively one-to-one. Accept both shapes.
    product: ProductRef | ProductRef[] | null;
  };
  const tally = new Map<
    string,
    { id: string; name: string; slug: string; sold: number }
  >();
  for (const row of ((items ?? []) as unknown as ItemRow[])) {
    const product = Array.isArray(row.product) ? row.product[0] : row.product;
    if (!product) continue;
    const existing = tally.get(product.id);
    if (existing) existing.sold += row.quantity;
    else tally.set(product.id, { ...product, sold: row.quantity });
  }
  const topProducts = Array.from(tally.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const [pendingReviews, pendingBankTransfers, expiringDeals] = await Promise.all([
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_method", "bank_transfer")
      .eq("payment_status", "pending"),
    supabase
      .from("flash_deals")
      .select("id, product:products(name, slug), ends_at, discount_pct")
      .eq("is_active", true)
      .gte("ends_at", now)
      .lte("ends_at", in24h)
      .order("ends_at", { ascending: true })
      .limit(5),
  ]);

  return NextResponse.json({
    topProducts,
    pendingReviewsCount: pendingReviews.count ?? 0,
    pendingBankTransfersCount: pendingBankTransfers.count ?? 0,
    expiringDeals: expiringDeals.data ?? [],
  });
}
