import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { FlashDealsStrip } from "@/components/shop/flash-deals-strip";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

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
    </div>
  );
}
