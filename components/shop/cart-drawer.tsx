"use client";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatLKR, effectivePrice } from "@/lib/format";
import { CartItemRow } from "@/components/shop/cart-item-row";
import type { CartLine } from "@/lib/hooks/use-cart";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartLine[];
  loading: boolean;
  onUpdateQty: (productId: string, qty: number) => Promise<unknown>;
  onRemove: (productId: string) => Promise<unknown>;
}

export function CartDrawer({ open, onOpenChange, items, loading, onUpdateQty, onRemove }: Props) {
  const subtotal = items.reduce((sum, line) => {
    const p = line.product;
    if (!p) return sum;
    return sum + effectivePrice(p.price, p.discount_pct ?? 0) * line.quantity;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {loading && items.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add products to see them here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((line) => (
                <CartItemRow
                  key={line.id}
                  line={line}
                  onUpdateQty={onUpdateQty}
                  onRemove={onRemove}
                  variant="drawer"
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold tabular-nums">{formatLKR(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-md border border-border text-sm font-medium"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium"
              >
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
