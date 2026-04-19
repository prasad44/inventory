import { notFound } from "next/navigation";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { CategoryBrowser } from "@/components/shop/category-browser";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function SubCategoryPage({
  params,
}: {
  params: Promise<{ parent: string; child: string }>;
}) {
  const { parent: parentSlug, child: childSlug } = await params;
  const supabase = createPublicServerClient();

  const { data: parent } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", parentSlug)
    .is("parent_id", null)
    .maybeSingle();

  if (!parent) notFound();

  const { data: child } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", childSlug)
    .eq("parent_id", parent.id)
    .maybeSingle();

  if (!child) notFound();

  // Sub-categories generally have no children; pass empty.
  const crumbs = [
    { label: "Home", href: "/" },
    { label: parent.name, href: `/c/${parent.slug}` },
    { label: child.name },
  ];

  // For sub-categories, show available brands from the sub-category only
  const { data: productsForBrandScan } = await supabase
    .from("products")
    .select("brand")
    .eq("status", "active")
    .eq("category_id", child.id)
    .not("brand", "is", null);
  const availableBrands = Array.from(
    new Set((productsForBrandScan ?? []).map((r) => r.brand as string).filter(Boolean))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={crumbs} className="mb-4" />
      <CategoryBrowser
        category={child as Category}
        childrenCategories={[]}
        availableBrands={availableBrands}
      />
    </div>
  );
}
