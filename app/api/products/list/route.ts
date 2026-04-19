import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, category:categories(id,name,slug)", { count: "exact" })
    .eq("status", "active");

  // Category + children
  const categorySlug = searchParams.get("category");
  if (categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (!cat) {
      return NextResponse.json({ data: [], count: 0, page: 1, pageSize: 24 });
    }
    const { data: children } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", cat.id);
    const ids = [cat.id, ...(children ?? []).map((c) => c.id)];
    query = query.in("category_id", ids);
  }

  // Explicit IDs (used by compare page)
  const idsCsv = searchParams.get("ids");
  if (idsCsv) {
    const idList = idsCsv.split(",").map((s) => s.trim()).filter(Boolean);
    if (idList.length === 0) {
      return NextResponse.json({ data: [], count: 0, page: 1, pageSize: 24 });
    }
    query = query.in("id", idList);
  }

  // Brand multi-select
  const brandCsv = searchParams.get("brand");
  if (brandCsv) {
    const brands = brandCsv.split(",").map((s) => s.trim()).filter(Boolean);
    if (brands.length) query = query.in("brand", brands);
  }

  // Price range
  const minPrice = Number(searchParams.get("min_price") ?? 0);
  const maxPrice = Number(searchParams.get("max_price") ?? 0);
  if (minPrice > 0) query = query.gte("price", minPrice);
  if (maxPrice > 0) query = query.lte("price", maxPrice);

  // Rating floor
  const minRating = Number(searchParams.get("min_rating") ?? 0);
  if (minRating > 0) query = query.gte("rating_avg", minRating);

  // Discount + stock toggles
  if (searchParams.get("on_sale") === "1") query = query.gt("discount_pct", 0);
  if (searchParams.get("in_stock") === "1") query = query.gt("quantity_in_stock", 0);

  // Free-text
  const q = searchParams.get("q")?.trim();
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    query = query.or(`name.ilike.${like},brand.ilike.${like}`);
  }

  // Sort
  const sort = searchParams.get("sort") ?? "popular";
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "discount":
      query = query.order("discount_pct", { ascending: false });
      break;
    default:
      query = query.order("rating_count", { ascending: false }).order("rating_avg", { ascending: false });
  }

  // Pagination
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(48, Math.max(1, Number(searchParams.get("page_size") ?? 24)));
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
  });
}
