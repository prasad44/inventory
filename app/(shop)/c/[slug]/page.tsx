"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/shop/category-browser";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import type { Category } from "@/lib/types";

interface Payload {
  category: Category;
  children: Pick<Category, "id" | "name" | "slug">[];
  availableBrands: string[];
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/category-page/${encodeURIComponent(slug)}`)
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
      .catch(() => {
        if (!alive) return;
        setNotFoundFlag(true);
      });
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
          { label: data?.category.name ?? "Loading..." },
        ]}
        className="mb-4"
      />
      {data ? (
        <CategoryBrowser
          category={data.category}
          childrenCategories={data.children}
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
