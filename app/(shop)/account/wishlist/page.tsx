"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { ProductCard } from "@/components/shop/product-card";

export default function WishlistPage() {
  const { items, loading, remove } = useWishlist();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-medium">Your wishlist is empty</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Save items you love for later by tapping the heart on a product.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-primary hover:underline text-sm"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((i) =>
        i.product ? (
          <div key={i.id} className="relative">
            <ProductCard product={i.product} />
            <button
              type="button"
              onClick={() => remove(i.product_id)}
              aria-label="Remove from wishlist"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border border-border grid place-items-center hover:bg-background"
            >
              <Heart className="h-4 w-4 fill-destructive text-destructive" />
            </button>
          </div>
        ) : null
      )}
    </div>
  );
}
