"use client";
import { useEffect } from "react";

export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    void fetch("/api/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {
      // Silent — not critical
    });
  }, [productId]);

  return null;
}
