import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug,parent_id)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [dealRes, recsRes, reviewsRes] = await Promise.all([
    supabase
      .from("active_flash_deals")
      .select("*")
      .eq("product_id", product.id)
      .maybeSingle(),
    supabase
      .from("recommendations")
      .select(
        "related_product_id, score, related:products!recommendations_related_product_id_fkey(id,name,slug,brand,price,discount_pct,rating_avg,rating_count,images,image_url,quantity_in_stock)"
      )
      .eq("product_id", product.id)
      .order("score", { ascending: false })
      .limit(12),
    supabase
      .from("reviews")
      .select("*, user:profiles(full_name, avatar_url)")
      .eq("product_id", product.id)
      .eq("status", "approved")
      .order("helpful_count", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    product,
    deal: dealRes.data ?? null,
    recommendations: recsRes.data ?? [],
    reviews: reviewsRes.data ?? [],
  });
}
