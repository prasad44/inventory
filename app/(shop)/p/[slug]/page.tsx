"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfoPanel } from "@/components/shop/product-info-panel";
import { ProductTabs } from "@/components/shop/product-tabs";
import { SolarCalculator } from "@/components/shop/solar-calculator";
import { LedTempPreview } from "@/components/shop/led-temp-preview";
import { RecentlyViewedTracker } from "@/components/shop/recently-viewed-tracker";
import { ProductCard } from "@/components/shop/product-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product, Category, FlashDeal, Review } from "@/lib/types";

interface Payload {
  product: Product & { category?: Category };
  parent: { name: string; slug: string } | null;
  deal: FlashDeal | null;
  reviews: Review[];
  recommendations: Product[];
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/product-page/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (alive) setNotFoundFlag(true);
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!alive || !j) return;
        setData(j as Payload);
        // Update document title for SEO/UX (basic client-side)
        const title = (j.product as Product).meta_title ?? `${(j.product as Product).name} | VoltHub`;
        document.title = title;
      })
      .catch(() => alive && setNotFoundFlag(true));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (notFoundFlag) notFound();

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          <div className="aspect-square bg-muted rounded-lg animate-pulse" />
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
            <div className="h-12 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-24 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const { product, parent, deal, reviews, recommendations } = data;
  const category = product.category ?? null;

  const crumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];
  if (category) {
    if (category.parent_id && parent) {
      crumbs.push({ label: parent.name, href: `/c/${parent.slug}` });
      crumbs.push({
        label: category.name,
        href: `/c/${parent.slug}/${category.slug}`,
      });
    } else {
      crumbs.push({ label: category.name, href: `/c/${category.slug}` });
    }
  }
  crumbs.push({ label: product.name });

  const isSolarCategory =
    category?.slug === "solar" || parent?.slug === "solar";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <RecentlyViewedTracker productId={product.id} />
      <Breadcrumbs items={crumbs} className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        <ProductGallery product={product} />
        <ProductInfoPanel product={product} deal={deal} />
      </div>
      <ProductTabs product={product} reviews={reviews} />
      {isSolarCategory && <SolarCalculator product={product} />}
      <LedTempPreview product={product} />
      {recommendations.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-display text-xl md:text-2xl font-bold">You might also like</h2>
            <Link
              href="/"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              See more
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none">
            {recommendations.map((p) => (
              <div key={p.id} className="shrink-0 w-[200px] sm:w-[220px] snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
