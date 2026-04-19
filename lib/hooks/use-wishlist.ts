"use client";
import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/types";

export interface WishlistLine {
  id: string;
  product_id: string;
  created_at: string;
  product: Product | null;
}

const CHANGE_EVENT = "wishlist:change";

export function useWishlist() {
  const [items, setItems] = useState<WishlistLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist");
      if (res.status === 401) {
        setIsAuthed(false);
        setItems([]);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setItems((j.items ?? []) as WishlistLine[]);
      setIsAuthed(true);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    function onChange() {
      refetch();
    }
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, [refetch]);

  const has = useCallback(
    (productId: string) => items.some((i) => i.product_id === productId),
    [items]
  );

  const add = useCallback(async (productId: string) => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });
    if (res.status === 401) {
      const err = new Error("Not signed in");
      // @ts-expect-error augment Error with a custom code for caller string-checks
      err.code = "UNAUTH";
      throw err;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Could not add to wishlist");
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const remove = useCallback(async (productId: string) => {
    const res = await fetch(
      `/api/wishlist?product_id=${encodeURIComponent(productId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Could not remove from wishlist");
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { items, count: items.length, loading, isAuthed, has, add, remove, refetch };
}
