"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, History } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types";

interface RvItem {
  product_id: string;
  viewed_at: string;
  product: Product | null;
}

export function RecentlyViewedRail() {
  const [items, setItems] = useState<RvItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/recently-viewed")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => {
        if (!alive) return;
        setItems(j.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return null; // Silent until we know if there's anything
  if (!items || items.length === 0) return null;

  const withProduct = items.filter(
    (i): i is RvItem & { product: Product } => i.product !== null
  );
  if (withProduct.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-10">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-display text-xl md:text-2xl font-bold">Recently viewed</h2>
        </div>
        <Link
          href="/account/recently-viewed"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          See all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-thin">
        {withProduct.map((i) => (
          <div key={i.product_id} className="shrink-0 w-[200px] sm:w-[220px] snap-start">
            <ProductCard product={i.product} />
          </div>
        ))}
      </div>
    </section>
  );
}
