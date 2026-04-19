import { createPublicServerClient } from "@/lib/supabase/public-server";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { GenericProductsBrowser } from "@/components/shop/generic-products-browser";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = createPublicServerClient();

  // Build brand list from products that match the current q (best-effort;
  // keeps the filter rail useful when refining a search).
  let availableBrands: string[] = [];
  if (q && q.trim().length >= 2) {
    const like = `%${q.trim()}%`;
    const { data } = await supabase
      .from("products")
      .select("brand")
      .eq("status", "active")
      .or(`name.ilike.${like},brand.ilike.${like}`)
      .not("brand", "is", null)
      .limit(200);
    const set = new Set<string>();
    for (const r of data ?? []) {
      const b = (r as { brand: string | null }).brand;
      if (b) set.add(b);
    }
    availableBrands = Array.from(set).sort();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Search" },
          ...(q ? [{ label: q }] : []),
        ]}
        className="mb-4"
      />
      {q && q.trim() ? (
        <GenericProductsBrowser
          heading={`Search: "${q.trim()}"`}
          baseQuery={{ q: q.trim() }}
          availableBrands={availableBrands}
        />
      ) : (
        <div className="grid place-items-center py-16 text-center">
          <h1 className="font-medium">Search</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Type in the search bar above to find products.
          </p>
        </div>
      )}
    </div>
  );
}
