"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { ProductCard } from "@/components/shop/product-card";
import { CountdownTimer } from "@/components/shop/countdown-timer";
import { FeaturedBrandsRow } from "@/components/shop/featured-brands-row";
import { RecentlyViewedRail } from "@/components/shop/recently-viewed-rail";
import { ValuePropsStrip } from "@/components/shop/value-props-strip";
import type { Brand, Category, Product } from "@/lib/types";

interface DealRow {
  id: string;
  product_id: string;
  discount_pct: number;
  ends_at: string;
  product: Product | null;
}

interface Feed {
  topCategories: Category[];
  brands: Brand[];
  deals: DealRow[];
  trendingAudio: Product[];
  trendingLighting: Product[];
  trendingSolar: Product[];
}

export default function HomePage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/home-feed")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        if (!alive) return;
        setFeed(j as Feed);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load home");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="pb-16">
      <HeroCarousel />

      {feed ? (
        <CategoryTiles categories={feed.topCategories} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {feed && feed.deals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-10">
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" aria-hidden="true" />
              <h2 className="font-display text-xl md:text-2xl font-bold">Flash deals</h2>
              <span className="text-xs text-muted-foreground ml-1">Limited time</span>
            </div>
            <Link
              href="/deals"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none">
            {feed.deals.map((d) =>
              d.product ? (
                <div key={d.id} className="shrink-0 w-[200px] sm:w-[220px] snap-start">
                  <ProductCard
                    product={d.product}
                    dealDiscountPct={d.discount_pct}
                    topRight={
                      <div className="bg-background/95 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-medium border border-border">
                        <CountdownTimer endsAt={d.ends_at} hideEmptyDays />
                      </div>
                    }
                  />
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      <FeaturedBrandsRow brands={feed?.brands ?? []} />

      <Rail title="Trending in Audio" href="/c?cat=audio" items={feed?.trendingAudio ?? null} />
      <Rail title="Trending in Lighting" href="/c?cat=lighting" items={feed?.trendingLighting ?? null} />
      <Rail title="Shop solar" href="/c?cat=solar" items={feed?.trendingSolar ?? null} />

      <RecentlyViewedRail />
      <ValuePropsStrip />

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-6 text-sm text-destructive">
          Could not load some home content: {error}
        </div>
      )}
    </div>
  );
}

function Rail({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: Product[] | null;
}) {
  if (items && items.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold">{title}</h2>
        <Link
          href={href}
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          See all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none">
        {items === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[200px] sm:w-[220px] aspect-[3/4] rounded-lg bg-muted animate-pulse"
              />
            ))
          : items.map((p) => (
              <div key={p.id} className="shrink-0 w-[200px] sm:w-[220px] snap-start">
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}
