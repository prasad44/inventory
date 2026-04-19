import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { FlashDealsStrip } from "@/components/shop/flash-deals-strip";
import { FeaturedBrandsRow } from "@/components/shop/featured-brands-row";
import { ProductRail } from "@/components/shop/product-rail";
import { RecentlyViewedRail } from "@/components/shop/recently-viewed-rail";
import { ValuePropsStrip } from "@/components/shop/value-props-strip";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: topCategories } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .order("sort_order");

  return (
    <div className="pb-16">
      <HeroCarousel />
      <CategoryTiles categories={(topCategories ?? []) as Category[]} />
      <FlashDealsStrip />
      <FeaturedBrandsRow />
      <ProductRail title="Trending in Audio" categorySlug="audio" />
      <ProductRail title="Trending in Lighting" categorySlug="lighting" />
      <ProductRail title="Shop solar" categorySlug="solar" />
      <RecentlyViewedRail />
      <ValuePropsStrip />
    </div>
  );
}
