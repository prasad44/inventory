"use client";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatLKR, effectivePrice } from "@/lib/format";
import type { CartLine } from "@/lib/hooks/use-cart";

interface Props {
  line: CartLine;
  onUpdateQty: (productId: string, qty: number) => Promise<unknown>;
  onRemove: (productId: string) => Promise<unknown>;
  /** "drawer" = compact variant, "page" = full variant */
  variant?: "drawer" | "page";
}

export function CartItemRow({ line, onUpdateQty, onRemove, variant = "page" }: Props) {
  const [busy, setBusy] = useState(false);
  const product = line.product;

  if (!product) {
    // Product was deleted — show stub row with remove option
    return (
      <div className="flex items-center justify-between gap-4 py-3 text-sm text-muted-foreground">
        <span>(Unavailable product)</span>
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            try {
              await onRemove(line.product_id);
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          aria-label="Remove item"
          className="text-destructive hover:underline"
        >
          Remove
        </button>
      </div>
    );
  }

  const discount = product.discount_pct ?? 0;
  const unitPrice = effectivePrice(product.price, discount);
  const lineTotal = unitPrice * line.quantity;
  const img = product.images?.[0] ?? product.image_url;

  async function setQty(newQty: number) {
    setBusy(true);
    try {
      if (newQty <= 0) await onRemove(product!.id);
      else await onUpdateQty(product!.id, newQty);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3 py-3">
      <Link
        href={`/p?slug=${product.slug}`}
        className={`shrink-0 rounded-md overflow-hidden bg-muted ${variant === "drawer" ? "w-16 h-16" : "w-24 h-24"}`}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className="h-full w-full object-cover" />
        ) : null}
      </Link>
      <div className="flex-1 min-w-0 flex flex-col">
        {product.brand && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.brand}</div>
        )}
        <Link
          href={`/p?slug=${product.slug}`}
          className={`font-medium text-sm hover:text-primary line-clamp-2 ${variant === "drawer" ? "" : "md:text-base"}`}
        >
          {product.name}
        </Link>
        <div className="mt-1 text-sm tabular-nums">
          {formatLKR(unitPrice)}
          {discount > 0 && (
            <span className="ml-2 text-xs text-muted-foreground line-through">{formatLKR(product.price)}</span>
          )}
        </div>
        <div className="mt-auto pt-2 flex items-center gap-2">
          <div className="inline-flex items-center border border-border rounded-md">
            <button
              type="button"
              onClick={() => setQty(line.quantity - 1)}
              aria-label="Decrease"
              disabled={busy || line.quantity <= 1}
              className="p-1.5 hover:bg-muted disabled:opacity-50"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-3 text-sm tabular-nums min-w-8 text-center">{line.quantity}</span>
            <button
              type="button"
              onClick={() => setQty(line.quantity + 1)}
              aria-label="Increase"
              disabled={busy || line.quantity >= product.quantity_in_stock}
              className="p-1.5 hover:bg-muted disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setQty(0)}
            aria-label="Remove"
            disabled={busy}
            className="ml-auto p-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {variant === "page" && (
        <div className="shrink-0 font-bold tabular-nums self-start text-right">
          {formatLKR(lineTotal)}
        </div>
      )}
    </div>
  );
}
