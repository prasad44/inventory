"use client";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { FiltersRail } from "@/components/shop/filters-rail";
import { SortDropdown } from "@/components/shop/sort-dropdown";
import { ProductCard } from "@/components/shop/product-card";
import { useInfiniteProducts } from "@/lib/hooks/use-infinite-products";
import { Package } from "lucide-react";
import type { Category } from "@/lib/types";

interface Props {
  category: Category;
  childrenCategories: Pick<Category, "id" | "name" | "slug">[];
  availableBrands: string[];
}

export function CategoryBrowser({ category, childrenCategories, availableBrands }: Props) {
  const searchParams = useSearchParams();

  const queryKey = useMemo(() => {
    // Always include the category slug; copy the other supported params from URL.
    const params = new URLSearchParams();
    params.set("category", category.slug);
    const passthrough = ["brand", "min_price", "max_price", "min_rating", "on_sale", "in_stock", "sort", "q"];
    for (const k of passthrough) {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    }
    return params.toString();
  }, [category.slug, searchParams]);

  const { items, total, loading, hasMore, loadMore, error } = useInfiniteProducts({ queryKey });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="hidden lg:block">
        <FiltersRail
          childrenCategories={childrenCategories}
          availableBrands={availableBrands}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{category.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} product{total !== 1 ? "s" : ""}
            </p>
          </div>
          <SortDropdown />
        </div>

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-3" />
            <h2 className="font-medium">No products match your filters</h2>
            <p className="text-sm text-muted-foreground mt-1">Try removing a filter or two.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-md border border-border bg-card text-sm font-medium hover:border-primary disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 text-sm text-destructive">Error: {error}</div>
        )}
      </div>
    </div>
  );
}
