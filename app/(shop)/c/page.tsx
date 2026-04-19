"use client";

import { Suspense, useEffect, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { CategoryBrowser } from "@/components/shop/category-browser";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import type { Category } from "@/lib/types";

interface Payload {
  category: Category;
  parent: Pick<Category, "name" | "slug"> | null;
  children: Pick<Category, "id" | "name" | "slug">[];
  availableBrands: string[];
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CategoryInner />
    </Suspense>
  );
}

function CategoryInner() {
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat") ?? "";
  const parent = searchParams.get("parent") ?? "";
  const [data, setData] = useState<Payload | null>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    if (!cat) {
      setNotFoundFlag(true);
      return;
    }
    let alive = true;
    const url = parent
      ? `/api/category-page/${encodeURIComponent(cat)}?parent=${encodeURIComponent(parent)}`
      : `/api/category-page/${encodeURIComponent(cat)}`;
    fetch(url)
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
  }, [cat, parent]);

  if (notFoundFlag) notFound();
  if (!data) return <Loading />;

  const crumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];
  if (data.parent) {
    crumbs.push({ label: data.parent.name, href: `/c?cat=${data.parent.slug}` });
  }
  crumbs.push({ label: data.category.name });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumbs items={crumbs} className="mb-4" />
      <CategoryBrowser
        category={data.category}
        childrenCategories={data.children}
        availableBrands={data.availableBrands}
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="h-6 w-48 bg-muted rounded animate-pulse mb-4" />
      <div className="h-64 grid place-items-center text-muted-foreground text-sm">
        Loading...
      </div>
    </div>
  );
}
