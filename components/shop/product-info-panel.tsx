"use client";
import Link from "next/link";
import { Star, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatLKR, effectivePrice, savingsAmount } from "@/lib/format";
import type { Product, FlashDeal } from "@/lib/types";
import { WarrantyBadges } from "@/components/shop/warranty-badges";
import { WhatsAppBuyButton } from "@/components/shop/whatsapp-buy-button";
import { DeliveryEstimator } from "@/components/shop/delivery-estimator";
import { StockPriceAlerts } from "@/components/shop/stock-price-alerts";
import { WishlistIconButton } from "@/components/shop/wishlist-icon-button";
import { CompareIconButton } from "@/components/shop/compare-icon-button";

interface Props {
  product: Product;
  deal: FlashDeal | null;
}

export function ProductInfoPanel({ product, deal }: Props) {
  const discount = deal?.discount_pct ?? product.discount_pct ?? 0;
  const priceNow = effectivePrice(product.price, discount);
  const savings = savingsAmount(product.price, discount);
  const hasDiscount = discount > 0;
  const outOfStock = product.quantity_in_stock <= 0;
  const lowStock = !outOfStock && product.quantity_in_stock < 5;

  const [qty, setQty] = useState(1);

  function adjust(delta: number) {
    setQty((q) => Math.max(1, Math.min(product.quantity_in_stock, q + delta)));
  }

  function addToCart() {
    // Phase 5 wires persistence. For now, just confirm the action.
    toast.success(`${product.name} added to cart (cart coming soon)`);
  }

  return (
    <div className="flex flex-col gap-4">
      {product.brand && (
        <Link
          href={`/brand/${product.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary w-fit"
        >
          {product.brand}
        </Link>
      )}

      <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">{product.name}</h1>

      {product.rating_count > 0 && (
        <a href="#reviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground w-fit">
          <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
          <span className="tabular-nums font-medium text-foreground">{product.rating_avg.toFixed(1)}</span>
          <span>({product.rating_count} reviews)</span>
        </a>
      )}

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums">{formatLKR(priceNow)}</span>
        {hasDiscount && (
          <>
            <span className="text-lg text-muted-foreground line-through tabular-nums">
              {formatLKR(product.price)}
            </span>
            <span className="text-sm font-bold text-destructive">-{discount}%</span>
          </>
        )}
      </div>
      {hasDiscount && (
        <span className="text-sm text-success -mt-2">You save {formatLKR(savings)}</span>
      )}

      <div className="h-px bg-border" />

      <WarrantyBadges product={product} />
      <DeliveryEstimator subtotal={priceNow * qty} />

      <div className="text-sm">
        {outOfStock ? (
          <span className="text-destructive font-medium">Out of stock</span>
        ) : lowStock ? (
          <span className="text-warning font-medium">
            Only {product.quantity_in_stock} left in stock
          </span>
        ) : (
          <span className="text-success">In stock — ships in 24 hours</span>
        )}
      </div>

      {!outOfStock && (
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center border border-border rounded-md">
            <button
              type="button"
              onClick={() => adjust(-1)}
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              className="p-2 hover:bg-muted disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-medium tabular-nums min-w-8 text-center">{qty}</span>
            <button
              type="button"
              onClick={() => adjust(1)}
              aria-label="Increase quantity"
              disabled={qty >= product.quantity_in_stock}
              className="p-2 hover:bg-muted disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={addToCart}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </button>
        </div>
      )}

      {!outOfStock && (
        <WhatsAppBuyButton product={product} qty={qty} dealDiscountPct={deal?.discount_pct} />
      )}

      <StockPriceAlerts product={product} />
      <div className="flex items-center gap-2">
        <WishlistIconButton productId={product.id} />
        <CompareIconButton productId={product.id} />
      </div>
    </div>
  );
}
