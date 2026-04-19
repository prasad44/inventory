import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Returns everything the home page needs in one request.
 * Uses a plain anon client (no cookies) and runs all queries in parallel.
 */
function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET() {
  const supabase = client();

  try {
    const [topCatsRes, brandsRes, dealsRes, audioTrendRes, lightingTrendRes, solarTrendRes] =
      await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .is("parent_id", null)
          .order("sort_order"),
        supabase
          .from("brands")
          .select("id, name, slug, logo_url, is_featured, sort_order")
          .eq("is_featured", true)
          .order("sort_order"),
        supabase
          .from("active_flash_deals")
          .select("id, product_id, discount_pct, ends_at, product:products(*)")
          .order("ends_at", { ascending: true })
          .limit(12),
        fetchTrending(supabase, "audio"),
        fetchTrending(supabase, "lighting"),
        fetchTrending(supabase, "solar"),
      ]);

    return NextResponse.json({
      topCategories: topCatsRes.data ?? [],
      brands: brandsRes.data ?? [],
      deals: dealsRes.data ?? [],
      trendingAudio: audioTrendRes,
      trendingLighting: lightingTrendRes,
      trendingSolar: solarTrendRes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "home feed failed" },
      { status: 500 }
    );
  }
}

async function fetchTrending(
  supabase: ReturnType<typeof client>,
  slug: string
) {
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!cat) return [];
  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", cat.id);
  const ids = [cat.id, ...(children ?? []).map((c) => c.id)];
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .in("category_id", ids)
    .order("rating_count", { ascending: false })
    .limit(12);
  return products ?? [];
}
