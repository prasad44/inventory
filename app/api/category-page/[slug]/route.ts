import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * /api/category-page/[slug]?parent=<parentSlug>
 *
 * - Top-level category: omit `parent`. Returns category (parent_id null), its children,
 *   available brands across cat+children.
 * - Sub-category: pass `parent=<parentSlug>`. Returns sub-category (parent matches),
 *   empty children, available brands from sub-category only.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const parentSlug = new URL(req.url).searchParams.get("parent");
  const supabase = client();

  if (parentSlug) {
    const { data: parent } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("slug", parentSlug)
      .is("parent_id", null)
      .maybeSingle();
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const { data: child } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("parent_id", parent.id)
      .maybeSingle();
    if (!child) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const { data: productsForBrandScan } = await supabase
      .from("products")
      .select("brand")
      .eq("status", "active")
      .eq("category_id", child.id)
      .not("brand", "is", null);
    const availableBrands = Array.from(
      new Set(
        (productsForBrandScan ?? [])
          .map((r) => (r as { brand: string | null }).brand)
          .filter((b): b is string => !!b)
      )
    ).sort();

    return NextResponse.json({
      category: child,
      parent,
      children: [],
      availableBrands,
    });
  }

  // Top-level
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .is("parent_id", null)
    .maybeSingle();
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: children } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("parent_id", category.id)
    .order("sort_order");

  const ids = [category.id, ...(children ?? []).map((c) => c.id)];
  const { data: productsForBrandScan } = await supabase
    .from("products")
    .select("brand")
    .eq("status", "active")
    .in("category_id", ids)
    .not("brand", "is", null);
  const availableBrands = Array.from(
    new Set(
      (productsForBrandScan ?? [])
        .map((r) => (r as { brand: string | null }).brand)
        .filter((b): b is string => !!b)
    )
  ).sort();

  return NextResponse.json({
    category,
    parent: null,
    children: children ?? [],
    availableBrands,
  });
}
