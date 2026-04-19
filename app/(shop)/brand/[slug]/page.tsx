"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { GenericProductsBrowser } from "@/components/shop/generic-products-browser";
import type { Brand } from "@/lib/types";

export default function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/brand-page/${encodeURIComponent(slug)}`)
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
        setBrand(j.brand as Brand);
      })
      .catch(() => alive && setNotFoundFlag(true));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (notFoundFlag) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Brands", href: "/" },
          { label: brand?.name ?? "Loading..." },
        ]}
        className="mb-4"
      />
      {brand ? (
        <>
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
        </>
      ) : (
        <div className="h-64 grid place-items-center text-muted-foreground text-sm">
          Loading...
        </div>
      )}
    </div>
  );
}
