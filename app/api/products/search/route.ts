import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }

  const supabase = await createClient();
  const like = `%${q}%`;

  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, images, image_url, price, discount_pct, rating_avg, brand")
      .eq("status", "active")
      .or(`name.ilike.${like},brand.ilike.${like}`)
      .order("rating_count", { ascending: false })
      .limit(5),
    supabase
      .from("categories")
      .select("id, name, slug, icon")
      .ilike("name", like)
      .limit(3),
    supabase
      .from("brands")
      .select("id, name, slug, logo_url")
      .ilike("name", like)
      .limit(3),
  ]);

  return NextResponse.json({
    products: productsRes.data ?? [],
    categories: categoriesRes.data ?? [],
    brands: brandsRes.data ?? [],
  });
}
