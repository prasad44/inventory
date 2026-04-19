"use client";
import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/types";

export interface CartLine {
  id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  product: Product | null;
}

export function useCart() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("Failed to load cart");
      const json = await res.json();
      setItems((json.items ?? []) as CartLine[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();

    function onCartChange() {
      refetch();
    }
    window.addEventListener("cart:change", onCartChange);
    return () => window.removeEventListener("cart:change", onCartChange);
  }, [refetch]);

  const add = useCallback(async (productId: string, quantity = 1) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Could not add to cart");
    }
    window.dispatchEvent(new Event("cart:change"));
    return res.json();
  }, []);

  const updateQty = useCallback(async (productId: string, quantity: number) => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Could not update");
    }
    window.dispatchEvent(new Event("cart:change"));
    return res.json();
  }, []);

  const remove = useCallback(async (productId: string) => {
    const res = await fetch(
      `/api/cart?product_id=${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) throw new Error("Could not remove");
    window.dispatchEvent(new Event("cart:change"));
    return res.json();
  }, []);

  const count = items.reduce((n, it) => n + it.quantity, 0);

  return { items, count, loading, error, add, updateQty, remove, refetch };
}
