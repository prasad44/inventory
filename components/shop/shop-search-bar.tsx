"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatLKR, effectivePrice } from "@/lib/format";

interface ProductHit {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  image_url: string | null;
  price: number;
  discount_pct: number;
  rating_avg: number;
  brand: string | null;
}

interface CategoryHit {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface BrandHit {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface SearchResults {
  products: ProductHit[];
  categories: CategoryHit[];
  brands: BrandHit[];
}

export function ShopSearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // `/` hotkey
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Outside click closes dropdown
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    let alive = true;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q.trim())}`);
        if (!alive) return;
        if (!res.ok) throw new Error("search failed");
        const json = (await res.json()) as SearchResults;
        setResults(json);
      } catch {
        if (alive) setResults(null);
      } finally {
        if (alive) setLoading(false);
      }
    }, 200);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [q]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length === 0) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const hasAny =
    !!results &&
    (results.products.length > 0 ||
      results.categories.length > 0 ||
      results.brands.length > 0);

  return (
    <div ref={rootRef} className="relative">
      <form onSubmit={onSubmit} role="search">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => q.length >= 2 && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search electronics, brands, categories..."
            aria-label="Search"
            className="w-full h-9 pl-9 pr-10 rounded-md border border-input bg-muted/40 text-sm placeholder:text-muted-foreground focus:bg-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQ("");
                setResults(null);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!q && (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
              /
            </kbd>
          )}
        </div>
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg max-h-[70vh] overflow-y-auto">
          {loading && !results ? (
            <div className="p-4 text-sm text-muted-foreground">Searching...</div>
          ) : !hasAny ? (
            <div className="p-4 text-sm text-muted-foreground">
              No results for &quot;{q.trim()}&quot;
            </div>
          ) : (
            <div className="divide-y divide-border">
              {results!.products.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Products
                  </div>
                  <ul>
                    {results!.products.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/p?slug=${p.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted"
                        >
                          <div className="h-10 w-10 shrink-0 rounded bg-muted overflow-hidden">
                            {(p.images?.[0] ?? p.image_url) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.images?.[0] ?? p.image_url ?? ""}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            {p.brand && (
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {p.brand}
                              </div>
                            )}
                            <div className="text-sm font-medium truncate">{p.name}</div>
                          </div>
                          <div className="text-sm font-bold tabular-nums shrink-0">
                            {formatLKR(effectivePrice(p.price, p.discount_pct))}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results!.categories.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Categories
                  </div>
                  <ul>
                    {results!.categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/c?cat=${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="block px-3 py-2 text-sm hover:bg-muted"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results!.brands.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Brands
                  </div>
                  <ul>
                    {results!.brands.map((b) => (
                      <li key={b.id}>
                        <Link
                          href={`/brand?slug=${b.slug}`}
                          onClick={() => setOpen(false)}
                          className="block px-3 py-2 text-sm hover:bg-muted"
                        >
                          {b.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  See all results for &quot;{q.trim()}&quot;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
