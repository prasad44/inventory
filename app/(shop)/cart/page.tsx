"use client";
import Link from "next/link";
import { useCart } from "@/lib/hooks/use-cart";
import { CartItemRow } from "@/components/shop/cart-item-row";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { formatLKR, effectivePrice } from "@/lib/format";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, loading, updateQty, remove } = useCart();

  const subtotal = items.reduce((sum, line) => {
    const p = line.product;
    if (!p) return sum;
    return sum + effectivePrice(p.price, p.discount_pct ?? 0) * line.quantity;
  }, 0);

  const count = items.reduce((n, line) => n + line.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} className="mb-4" />
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">
        Your cart{count > 0 ? ` (${count})` : ""}
      </h1>

      {loading && items.length === 0 ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-medium">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse products and add them here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-primary hover:underline text-sm"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8">
          <div className="divide-y divide-border border border-border rounded-lg px-4">
            {items.map((line) => (
              <CartItemRow
                key={line.id}
                line={line}
                onUpdateQty={updateQty}
                onRemove={remove}
                variant="page"
              />
            ))}
          </div>
          <aside className="rounded-lg border border-border bg-card p-5 h-fit sticky top-20">
            <h2 className="font-display text-lg font-bold mb-4">Order summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatLKR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-muted-foreground text-xs">Calculated at checkout</dd>
              </div>
            </dl>
            <div className="h-px bg-border my-4" />
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold tabular-nums">{formatLKR(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Proceed to checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Free delivery on orders over Rs 5,000.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
