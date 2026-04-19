"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/shop/category-browser";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import type { Category } from "@/lib/types";

interface Payload {
  category: Category;
  parent: Pick<Category, "name" | "slug"> | null;
  availableBrands: string[];
}

export default function SubCategoryPage({
  params,
}: {
  params: Promise<{ parent: string; child: string }>;
}) {
  const { parent: parentSlug, child: childSlug } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(
      `/api/category-page/${encodeURIComponent(childSlug)}?parent=${encodeURIComponent(parentSlug)}`
    )
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
      })
      .catch(() => alive && setNotFoundFlag(true));
    return () => {
      alive = false;
    };
  }, [parentSlug, childSlug]);

  if (notFoundFlag) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          data?.parent
            ? { label: data.parent.name, href: `/c/${data.parent.slug}` }
            : { label: parentSlug, href: `/c/${parentSlug}` },
          { label: data?.category.name ?? "Loading..." },
        ]}
        className="mb-4"
      />
      {data ? (
        <CategoryBrowser
          category={data.category}
          childrenCategories={[]}
          availableBrands={data.availableBrands}
        />
      ) : (
        <div className="h-64 grid place-items-center text-muted-foreground text-sm">
          Loading...
        </div>
      )}
    </div>
  );
}
