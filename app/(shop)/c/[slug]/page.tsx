import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryBrowser } from "@/components/shop/category-browser";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .is("parent_id", null)
    .maybeSingle();

  if (!category) notFound();

  const { data: children } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("parent_id", category.id)
    .order("sort_order");

  const crumbs = [
    { label: "Home", href: "/" },
    { label: category.name },
  ];

  const availableBrands = await fetchBrandsForCategory(supabase, category.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={crumbs} className="mb-4" />
      <CategoryBrowser
        category={category as Category}
        childrenCategories={(children ?? []) as Pick<Category, "id" | "name" | "slug">[]}
        availableBrands={availableBrands}
      />
    </div>
  );
}

async function fetchBrandsForCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string
): Promise<string[]> {
  // Pull brands that actually appear in this category (or its children) for the filter list
  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", categoryId);
  const ids = [categoryId, ...(children ?? []).map((c) => c.id)];

  const { data } = await supabase
    .from("products")
    .select("brand")
    .eq("status", "active")
    .in("category_id", ids)
    .not("brand", "is", null);

  const unique = Array.from(new Set((data ?? []).map((r) => r.brand as string).filter(Boolean)));
  unique.sort();
  return unique;
}
