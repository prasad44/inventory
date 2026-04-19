import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = client();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug,parent_id)")
    .eq("slug", slug)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let parentCategory: { name: string; slug: string } | null = null;
  const cat = (product.category ?? null) as { parent_id: string | null } | null;
  if (cat?.parent_id) {
    const { data } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", cat.parent_id)
      .maybeSingle();
    parentCategory = data;
  }

  const [dealRes, reviewsRes, recsEdgesRes] = await Promise.all([
    supabase
      .from("active_flash_deals")
      .select("*")
      .eq("product_id", product.id)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("*, user:profiles(full_name, avatar_url)")
      .eq("product_id", product.id)
      .eq("status", "approved")
      .order("helpful_count", { ascending: false })
      .limit(20),
    supabase
      .from("recommendations")
      .select("related_product_id, score")
      .eq("product_id", product.id)
      .order("score", { ascending: false })
      .limit(12),
  ]);

  const relatedIds = (recsEdgesRes.data ?? []).map((r) => r.related_product_id);
  let recommendations: Record<string, unknown>[] = [];
  if (relatedIds.length > 0) {
    const { data: recsData } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .in("id", relatedIds);
    const byId = new Map((recsData ?? []).map((p) => [p.id, p]));
    recommendations = relatedIds
      .map((id) => byId.get(id))
      .filter((p): p is Record<string, unknown> => !!p);
  }

  return NextResponse.json({
    product,
    parent: parentCategory,
    deal: dealRes.data ?? null,
    reviews: reviewsRes.data ?? [],
    recommendations,
  });
}
