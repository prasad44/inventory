import Link from "next/link";
import { Star } from "lucide-react";
import { formatLKR, effectivePrice, savingsAmount } from "@/lib/format";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  /** Override the product's discount_pct with an active flash-deal discount */
  dealDiscountPct?: number;
  /** Optional slot rendered at the top-right (e.g., countdown timer) */
  topRight?: React.ReactNode;
}

export function ProductCard({ product, dealDiscountPct, topRight }: Props) {
  const discount = dealDiscountPct ?? product.discount_pct ?? 0;
  const priceNow = effectivePrice(product.price, discount);
  const savings = savingsAmount(product.price, discount);
  const hasDiscount = discount > 0;
  const outOfStock = (product.quantity_in_stock ?? 0) <= 0;
  const lowStock = !outOfStock && (product.quantity_in_stock ?? 0) < 5;
  const img = product.images?.[0] ?? product.image_url;

  return (
    <Link
      href={`/p?slug=${product.slug}`}
      className="group relative flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-square bg-muted/40 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground text-xs">No image</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-destructive text-background text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] grid place-items-center">
            <span className="text-xs font-semibold uppercase tracking-wide">Out of stock</span>
          </div>
        )}
        {topRight && (
          <div className="absolute top-2 right-2">{topRight}</div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {product.brand && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.brand}</span>
        )}
        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.rating_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" aria-hidden="true" />
            <span className="tabular-nums">{product.rating_avg.toFixed(1)}</span>
            <span className="text-muted-foreground/70">({product.rating_count})</span>
          </div>
        )}
        <div className="mt-auto pt-1 flex items-baseline gap-2">
          <span className="text-base font-bold tabular-nums text-foreground">{formatLKR(priceNow)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {formatLKR(product.price)}
            </span>
          )}
        </div>
        {hasDiscount && (
          <span className="text-[11px] text-success">Save {formatLKR(savings)}</span>
        )}
        {lowStock && (
          <span className="text-[11px] text-destructive">Only {product.quantity_in_stock} left</span>
        )}
      </div>
    </Link>
  );
}
