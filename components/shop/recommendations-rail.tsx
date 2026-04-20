import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types";

interface Props {
  productId: string;
  title?: string;
}

export async function RecommendationsRail({
  productId,
  title = "You might also like",
}: Props) {
  const supabase = createPublicServerClient();

  // Two-step fetch: avoids Supabase FK hint pitfalls (recommendations has TWO FKs to products)
  const { data: edges } = await supabase
    .from("recommendations")
    .select("related_product_id, score")
    .eq("product_id", productId)
    .order("score", { ascending: false })
    .limit(12);

  const ids = (edges ?? []).map((e) => e.related_product_id);
  if (ids.length === 0) return null;

  const { data: productsData } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .in("id", ids);

  // Preserve score-order
  const byId = new Map(
    (productsData ?? []).map((p) => [p.id, p as Product])
  );
  const items = (edges ?? [])
    .map((e) => byId.get(e.related_product_id))
    .filter((p): p is Product => !!p);

  if (items.length === 0) return null;

  return (
    <section className="mt-10 max-w-7xl">
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold">{title}</h2>
        <Link
          href="/"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          See more
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-thin">
        {items.map((p) => (
          <div
            key={p.id}
            className="shrink-0 w-[200px] sm:w-[220px] snap-start"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
