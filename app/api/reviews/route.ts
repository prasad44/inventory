import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body?.product_id;
  const rating = Number(body?.rating);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 100) : null;
  const bodyText = typeof body?.body === "string" ? body.body.trim().slice(0, 2000) : null;
  const images = Array.isArray(body?.images)
    ? body.images.filter((u: unknown): u is string => typeof u === "string").slice(0, 4)
    : [];

  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Verified purchase: any completed outbound order by this user that contained this product
  const { data: purchaseRows } = await supabase
    .from("order_items")
    .select("id, order:orders!inner(status, type, created_by)")
    .eq("product_id", productId)
    .eq("orders.created_by", user.id)
    .eq("orders.status", "completed")
    .eq("orders.type", "outbound")
    .limit(1);
  const verified_purchase = (purchaseRows ?? []).length > 0;

  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating: Math.round(rating),
    title,
    body: bodyText,
    images,
    verified_purchase,
    status: "approved", // MVP: auto-approve
  });

  if (error) {
    // 23505 = duplicate (user already reviewed this product)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You've already reviewed this product" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, verified_purchase });
}
