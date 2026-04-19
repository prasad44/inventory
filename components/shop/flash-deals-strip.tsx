import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { CountdownTimer } from "@/components/shop/countdown-timer";
import type { Product } from "@/lib/types";

interface DealRow {
  id: string;
  product_id: string;
  discount_pct: number;
  ends_at: string;
  product: Product | null;
}

export async function FlashDealsStrip() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("active_flash_deals")
    .select("id, product_id, discount_pct, ends_at, product:products(*)")
    .order("ends_at", { ascending: true })
    .limit(12);

  const deals = (data ?? []) as unknown as DealRow[];
  if (!deals.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-10">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" aria-hidden="true" />
          <h2 className="font-display text-xl md:text-2xl font-bold">Flash deals</h2>
          <span className="text-xs text-muted-foreground ml-1">Limited time</span>
        </div>
        <Link href="/deals" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          See all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none">
        {deals.map((d) =>
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
  );
}
