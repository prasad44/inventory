import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { GenericProductsBrowser } from "@/components/shop/generic-products-browser";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!brand) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Brands", href: "/" },
          { label: brand.name },
        ]}
        className="mb-4"
      />
      <div className="mb-6 rounded-lg border border-border bg-gradient-to-br from-primary/10 to-transparent px-6 py-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold">{brand.name}</h1>
        {brand.description && (
          <p className="mt-2 text-muted-foreground max-w-2xl">{brand.description}</p>
        )}
      </div>
      <GenericProductsBrowser
        heading={`Shop ${brand.name}`}
        baseQuery={{ brand: brand.name }}
        availableBrands={[]}
      />
    </div>
  );
}
