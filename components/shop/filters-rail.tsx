"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";
import type { Category } from "@/lib/types";

interface Props {
  childrenCategories: Pick<Category, "id" | "name" | "slug">[];
  availableBrands: string[];
}

export function FiltersRail({ childrenCategories, availableBrands }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlMin = searchParams.get("min_price") ?? "";
  const urlMax = searchParams.get("max_price") ?? "";

  // Typing buffer for price inputs — sync to URL on blur/enter. When the URL
  // changes externally (e.g., "Clear all"), React 19's "storing info from
  // previous renders" pattern resets the inputs without an effect.
  const [lastUrl, setLastUrl] = useState({ min: urlMin, max: urlMax });
  const [minPrice, setMinPrice] = useState(urlMin);
  const [maxPrice, setMaxPrice] = useState(urlMax);
  if (lastUrl.min !== urlMin || lastUrl.max !== urlMax) {
    setLastUrl({ min: urlMin, max: urlMax });
    setMinPrice(urlMin);
    setMaxPrice(urlMax);
  }

  function replaceQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const brandCsv = searchParams.get("brand");
  const selectedBrands = new Set(
    (brandCsv ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  );

  function toggleBrand(b: string) {
    const next = new Set(selectedBrands);
    if (next.has(b)) next.delete(b);
    else next.add(b);
    const csv = Array.from(next).join(",");
    replaceQuery({ brand: csv || null });
  }

  function setRating(r: string | null) {
    replaceQuery({ min_rating: r });
  }

  function applyPriceRange() {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    replaceQuery({
      min_price: min && min > 0 ? String(min) : null,
      max_price: max && max > 0 ? String(max) : null,
    });
  }

  function clearAll() {
    const params = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const onSale = searchParams.get("on_sale") === "1";
  const inStock = searchParams.get("in_stock") === "1";
  const minRating = searchParams.get("min_rating") ?? "";

  const hasAny =
    brandCsv ||
    urlMin ||
    urlMax ||
    onSale ||
    inStock ||
    minRating;

  const parentSlug = getParentSlug(pathname);

  return (
    <aside className="w-full lg:w-60 shrink-0 space-y-6 text-sm">
      {childrenCategories.length > 0 && (
        <Section title="Categories">
          <ul className="space-y-1.5">
            {childrenCategories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/c?cat=${c.slug}&parent=${parentSlug}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Price (Rs)">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
            placeholder="Min"
            className="w-full h-8 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
            placeholder="Max"
            className="w-full h-8 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </Section>

      {availableBrands.length > 0 && (
        <Section title="Brand">
          <ul className="space-y-1.5 max-h-60 overflow-y-auto">
            {availableBrands.map((b) => (
              <li key={b}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.has(b)}
                    onChange={() => toggleBrand(b)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span>{b}</span>
                </label>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Rating">
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="min_rating"
                checked={minRating === String(r)}
                onChange={() => setRating(String(r))}
                className="h-4 w-4 accent-primary"
              />
              <span className="inline-flex items-center">
                {Array.from({ length: r }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                ))}
                <span className="ml-1 text-muted-foreground">&amp; up</span>
              </span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="min_rating"
              checked={minRating === ""}
              onChange={() => setRating(null)}
              className="h-4 w-4 accent-primary"
            />
            <span>Any rating</span>
          </label>
        </div>
      </Section>

      <Section title="Other">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onSale}
              onChange={(e) => replaceQuery({ on_sale: e.target.checked ? "1" : null })}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            On sale only
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => replaceQuery({ in_stock: e.target.checked ? "1" : null })}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            In stock only
          </label>
        </div>
      </Section>

      {hasAny && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Helper: when inside a sub-category URL like /c/audio/headphones, extract parent slug.
// When at /c/audio, this returns "audio". Used only for sub-category child links.
function getParentSlug(pathname: string): string {
  // pathname starts with /c/{parent}... or /c/{parent}/{child}
  const parts = pathname.split("/").filter(Boolean);
  // parts[0] === "c", parts[1] === parent
  return parts[1] ?? "";
}
