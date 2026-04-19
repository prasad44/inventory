"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { GenericProductsBrowser } from "@/components/shop/generic-products-browser";

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Suspense
        fallback={
          <div className="h-64 grid place-items-center text-muted-foreground text-sm">
            Loading...
          </div>
        }
      >
        <SearchInner />
      </Suspense>
    </div>
  );
}

function SearchInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  useEffect(() => {
    if (q.length < 2) {
      setAvailableBrands([]);
      return;
    }
    let alive = true;
    fetch(`/api/search-page?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : { availableBrands: [] }))
      .then((j) => {
        if (!alive) return;
        setAvailableBrands((j.availableBrands ?? []) as string[]);
      })
      .catch(() => alive && setAvailableBrands([]));
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Search" },
          ...(q ? [{ label: q }] : []),
        ]}
        className="mb-4"
      />
      {q ? (
        <GenericProductsBrowser
          heading={`Search: "${q}"`}
          baseQuery={{ q }}
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
    </>
  );
}
