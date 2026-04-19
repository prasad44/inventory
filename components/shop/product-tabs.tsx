"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpecsTable } from "@/components/shop/specs-table";
import { ReviewList } from "@/components/shop/review-list";
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
        <ReviewList productId={product.id} initialReviews={reviews} />
      </TabsContent>
    </Tabs>
  );
}
