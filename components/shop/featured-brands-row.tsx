import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";

export async function FeaturedBrandsRow() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("is_featured", true)
    .order("sort_order");

  const brands = (data ?? []) as Pick<Brand, "id" | "name" | "slug" | "logo_url">[];
  if (!brands.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold">Shop by brand</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brand/${b.slug}`}
            className="group shrink-0 min-w-[140px] h-16 px-6 flex items-center justify-center rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
          >
            {b.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logo_url} alt={b.name} className="max-h-8 max-w-full object-contain" />
            ) : (
              <span className="font-display font-bold text-base tracking-tight group-hover:text-primary transition-colors">
                {b.name}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
