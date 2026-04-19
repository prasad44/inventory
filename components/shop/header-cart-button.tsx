"use client";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/hooks/use-cart";
import { CartDrawer } from "@/components/shop/cart-drawer";

export function HeaderCartButton() {
  const [open, setOpen] = useState(false);
  const { items, count, loading, updateQty, remove } = useCart();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cart (${count} items)`}
        className="relative p-2 rounded-md hover:bg-muted"
      >
        <ShoppingBag className="h-4 w-4" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tabular-nums"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      <CartDrawer
        open={open}
        onOpenChange={setOpen}
        items={items}
        loading={loading}
        onUpdateQty={updateQty}
        onRemove={remove}
      />
    </>
  );
}
