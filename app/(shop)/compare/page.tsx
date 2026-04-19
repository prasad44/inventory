"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GitCompare } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types";

export default function ComparePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Compare" }]}
        className="mb-4"
      />
      <div className="flex items-center gap-2 mb-6">
        <GitCompare className="h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl md:text-3xl font-bold">Compare</h1>
      </div>
      <Suspense
        fallback={
          <div className="h-32 grid place-items-center text-muted-foreground text-sm">
            Loading...
          </div>
        }
      >
        <CompareInner />
      </Suspense>
    </div>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const ids = useMemo(() => {
    const raw = searchParams.get("ids") ?? "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
  }, [searchParams]);

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    let alive = true;
    fetch(`/api/products/list?ids=${encodeURIComponent(ids.join(","))}&page_size=4`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => {
        if (!alive) return;
        const data = (j.data ?? []) as Product[];
        const byId = new Map(data.map((p) => [p.id, p]));
        const ordered = ids.map((id) => byId.get(id)).filter((p): p is Product => !!p);
        setProducts(ordered);
      })
      .catch(() => alive && setProducts([]));
    return () => {
      alive = false;
    };
  }, [ids]);

  if (products === null) {
    return (
      <div className="h-32 grid place-items-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No products to compare. Add products by clicking the{" "}
          <span className="font-medium">Compare</span> button on any product page.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-primary hover:underline text-sm"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Comparing {products.length} product{products.length !== 1 ? "s" : ""}. Full side-by-side
        spec comparison is coming soon — for now you can review each product&apos;s details below.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
