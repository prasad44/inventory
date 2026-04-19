"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GitCompare, X, Star } from "lucide-react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { formatLKR, effectivePrice } from "@/lib/format";
import {
  SPEC_DIRECTION,
  bestValueMap,
  computeSpecRows,
  formatSpecKey,
  formatSpecValue,
  toComparableNumber,
} from "@/lib/compare";
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
  const router = useRouter();
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
        setProducts(ids.map((id) => byId.get(id)).filter((p): p is Product => !!p));
      })
      .catch(() => alive && setProducts([]));
    return () => {
      alive = false;
    };
  }, [ids]);

  function removeProduct(id: string) {
    const next = ids.filter((x) => x !== id);
    const qs = next.length > 0 ? `?ids=${next.join(",")}` : "";
    router.replace(`/compare${qs}`, { scroll: false });
  }

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
        <Link href="/" className="mt-4 inline-block text-primary hover:underline text-sm">
          Browse products
        </Link>
      </div>
    );
  }

  // Compute row list: fixed rows first (price, rating, discount, stock), then spec union.
  const specRows = computeSpecRows(products);

  // Precompute "best-value" maps for each row where a direction is known.
  const priceBest = bestValueMap(
    products.map((p) => ({
      id: p.id,
      value: effectivePrice(p.price, p.discount_pct ?? 0),
    })),
    "min"
  );
  const ratingBest = bestValueMap(
    products.map((p) => ({ id: p.id, value: p.rating_avg > 0 ? p.rating_avg : null })),
    "max"
  );
  const discountBest = bestValueMap(
    products.map((p) => ({ id: p.id, value: (p.discount_pct ?? 0) > 0 ? p.discount_pct : null })),
    "max"
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className="text-left align-top p-3 w-36 text-xs uppercase tracking-wider text-muted-foreground bg-background sticky left-0 z-10">
              Product
            </th>
            {products.map((p) => (
              <th
                key={p.id}
                className="text-left align-top p-3 border-b border-border min-w-[180px]"
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Link
                      href={`/p?slug=${encodeURIComponent(p.slug)}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="aspect-square rounded-md bg-muted overflow-hidden mb-2">
                        {(p.images?.[0] ?? p.image_url) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images?.[0] ?? p.image_url ?? ""}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      {p.brand && (
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.brand}
                        </div>
                      )}
                      <div className="text-sm font-medium leading-snug line-clamp-2 hover:text-primary">
                        {p.name}
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.id)}
                      aria-label={`Remove ${p.name} from comparison`}
                      className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="Price">
            {products.map((p) => {
              const effective = effectivePrice(p.price, p.discount_pct ?? 0);
              return (
                <Cell key={p.id} best={!!priceBest[p.id]}>
                  <div className="font-semibold tabular-nums">{formatLKR(effective)}</div>
                  {(p.discount_pct ?? 0) > 0 && (
                    <div className="text-xs text-muted-foreground line-through tabular-nums">
                      {formatLKR(p.price)}
                    </div>
                  )}
                </Cell>
              );
            })}
          </Row>

          <Row label="Discount">
            {products.map((p) => {
              const d = p.discount_pct ?? 0;
              return (
                <Cell key={p.id} best={!!discountBest[p.id]}>
                  {d > 0 ? (
                    <span className="text-destructive font-semibold">-{d}%</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Cell>
              );
            })}
          </Row>

          <Row label="Rating">
            {products.map((p) => (
              <Cell key={p.id} best={!!ratingBest[p.id]}>
                {p.rating_count > 0 ? (
                  <div className="inline-flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                    <span className="tabular-nums font-medium">{p.rating_avg.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({p.rating_count})</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No reviews</span>
                )}
              </Cell>
            ))}
          </Row>

          <Row label="Stock">
            {products.map((p) => (
              <Cell key={p.id}>
                {p.quantity_in_stock > 0 ? (
                  <span className="text-success">In stock ({p.quantity_in_stock})</span>
                ) : (
                  <span className="text-destructive">Out of stock</span>
                )}
              </Cell>
            ))}
          </Row>

          <Row label="Warranty">
            {products.map((p) => (
              <Cell key={p.id}>
                {p.warranty_months > 0 ? `${p.warranty_months} months` : "—"}
              </Cell>
            ))}
          </Row>

          {specRows.length > 0 && (
            <tr>
              <td
                colSpan={products.length + 1}
                className="pt-6 pb-1 px-3 text-xs uppercase tracking-wider text-muted-foreground"
              >
                Specifications
              </td>
            </tr>
          )}

          {specRows.map((key) => {
            const direction = SPEC_DIRECTION[key];
            const bestMap = direction
              ? bestValueMap(
                  products.map((p) => ({
                    id: p.id,
                    value: toComparableNumber((p.specs ?? {})[key]),
                  })),
                  direction
                )
              : {};
            return (
              <Row key={key} label={formatSpecKey(key)}>
                {products.map((p) => {
                  const value = (p.specs ?? {})[key];
                  return (
                    <Cell key={p.id} best={!!bestMap[p.id]}>
                      {formatSpecValue(value)}
                    </Cell>
                  );
                })}
              </Row>
            );
          })}

          <Row label="">
            {products.map((p) => (
              <Cell key={p.id}>
                <Link
                  href={`/p?slug=${encodeURIComponent(p.slug)}`}
                  className="inline-block px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
                >
                  View product
                </Link>
              </Cell>
            ))}
          </Row>
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border">
      <th className="text-left align-top p-3 text-xs uppercase tracking-wider text-muted-foreground font-normal bg-background sticky left-0 z-10">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({
  children,
  best,
}: {
  children: React.ReactNode;
  best?: boolean;
}) {
  return (
    <td
      className={`align-top p-3 text-sm ${
        best ? "bg-primary/10 text-primary" : ""
      }`}
    >
      {children}
    </td>
  );
}
