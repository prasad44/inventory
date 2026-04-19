import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types";

interface Props {
  title: string;
  categorySlug: string;
  /** How many products to fetch. Default 12. */
  limit?: number;
  /** Link to the "See all" destination. Defaults to /c/{slug}. */
  seeAllHref?: string;
}

export async function ProductRail({ title, categorySlug, limit = 12, seeAllHref }: Props) {
  const supabase = await createClient();

  // Resolve top-level category + direct children so we pull products from the whole sub-tree.
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!cat) return null;

  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", cat.id);

  const categoryIds = [cat.id, ...(children ?? []).map((c) => c.id)];

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .in("category_id", categoryIds)
    .order("rating_count", { ascending: false })
    .limit(limit);

  const items = (products ?? []) as Product[];
  if (!items.length) return null;

  const href = seeAllHref ?? `/c/${categorySlug}`;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold">{title}</h2>
        <Link href={href} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          See all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none">
        {items.map((p) => (
          <div key={p.id} className="shrink-0 w-[200px] sm:w-[220px] snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
