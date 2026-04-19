import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfoPanel } from "@/components/shop/product-info-panel";
import { ProductTabs } from "@/components/shop/product-tabs";
import { SolarCalculator } from "@/components/shop/solar-calculator";
import { LedTempPreview } from "@/components/shop/led-temp-preview";
import { RecentlyViewedTracker } from "@/components/shop/recently-viewed-tracker";
import { RecommendationsRail } from "@/components/shop/recommendations-rail";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
import type { Product, Category, FlashDeal, Review } from "@/lib/types";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug,parent_id)")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) notFound();

  const [dealRes, reviewsRes] = await Promise.all([
    supabase
      .from("active_flash_deals")
      .select("*")
      .eq("product_id", product.id)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("*, user:profiles(full_name, avatar_url)")
      .eq("product_id", product.id)
      .eq("status", "approved")
      .order("helpful_count", { ascending: false })
      .limit(20),
  ]);

  // Build breadcrumbs: Home / <parent cat> / <this cat> / product name
  const crumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];
  const category = (product.category ?? null) as (Category & { parent_id: string | null }) | null;

  // Fetch parent category once — used for both breadcrumbs and solar detection
  let parentCategory: { name: string; slug: string } | null = null;
  if (category?.parent_id) {
    const { data } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", category.parent_id)
      .maybeSingle();
    parentCategory = data;
  }

  if (category) {
    if (category.parent_id) {
      if (parentCategory) {
        crumbs.push({ label: parentCategory.name, href: `/c/${parentCategory.slug}` });
        crumbs.push({ label: category.name, href: `/c/${parentCategory.slug}/${category.slug}` });
      } else {
        crumbs.push({ label: category.name, href: `/c/${category.slug}` });
      }
    } else {
      crumbs.push({ label: category.name, href: `/c/${category.slug}` });
    }
  }
  crumbs.push({ label: product.name });

  const isSolarCategory = category?.slug === "solar" || parentCategory?.slug === "solar";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <RecentlyViewedTracker productId={product.id} />
      <Breadcrumbs items={crumbs} className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        <ProductGallery product={product as Product} />
        <ProductInfoPanel
          product={product as Product}
          deal={(dealRes.data ?? null) as FlashDeal | null}
        />
      </div>
      <ProductTabs product={product as Product} reviews={(reviewsRes.data ?? []) as Review[]} />
      {isSolarCategory && <SolarCalculator product={product as Product} />}
      <LedTempPreview product={product as Product} />
      <RecommendationsRail productId={product.id} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, meta_title, meta_desc, images, image_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return { title: "Product not found" };
  return {
    title: data.meta_title ?? `${data.name} | VoltHub`,
    description:
      data.meta_desc ?? `Buy ${data.name} at VoltHub. Genuine stock, islandwide delivery, COD available.`,
    openGraph: {
      images: [data.images?.[0] ?? data.image_url].filter(Boolean) as string[],
    },
  };
}
