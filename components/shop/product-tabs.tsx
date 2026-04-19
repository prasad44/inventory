"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpecsTable } from "@/components/shop/specs-table";
import type { Product, Review } from "@/lib/types";

interface Props {
  product: Product;
  reviews: Review[];
}

export function ProductTabs({ product, reviews }: Props) {
  const hasSpecs = product.specs && Object.keys(product.specs).length > 0;
  return (
    <Tabs defaultValue="description" className="mt-10">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        {hasSpecs && <TabsTrigger value="specs">Specifications</TabsTrigger>}
        <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="pt-4">
        <div className="prose dark:prose-invert max-w-3xl text-sm leading-relaxed">
          {product.description ? (
            <p className="whitespace-pre-line">{product.description}</p>
          ) : (
            <p className="text-muted-foreground">No description available.</p>
          )}
        </div>
      </TabsContent>
      {hasSpecs && (
        <TabsContent value="specs" className="pt-4">
          <SpecsTable specs={product.specs} />
        </TabsContent>
      )}
      <TabsContent value="reviews" id="reviews" className="pt-4">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No reviews yet. Be the first to review this product.
          </p>
        ) : (
          <ul className="space-y-6 max-w-3xl">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-border pb-4 last:border-b-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{r.user?.full_name ?? "Customer"}</span>
                  {r.verified_purchase && (
                    <span className="text-[10px] uppercase tracking-wider text-success">
                      Verified purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < r.rating ? "text-warning" : "text-muted-foreground/30"}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  ))}
                </div>
                {r.title && <h3 className="mt-1 font-semibold text-sm">{r.title}</h3>}
                {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}
