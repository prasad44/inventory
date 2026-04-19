"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";

interface ListResponse {
  data: Product[];
  count: number;
  page: number;
  pageSize: number;
}

export interface UseInfiniteProductsOpts {
  /** URL querystring (already encoded, no leading ?). If this string changes, the hook resets. */
  queryKey: string;
  /** Page size. Default 24. */
  pageSize?: number;
}

export function useInfiniteProducts({ queryKey, pageSize = 24 }: UseInfiniteProductsOpts) {
  const [pages, setPages] = useState<Product[][]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const keyRef = useRef(queryKey);

  const fetchPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const qs = queryKey ? `${queryKey}&` : "";
        const res = await fetch(`/api/products/list?${qs}page=${p}&page_size=${pageSize}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ListResponse;
        setTotal(json.count ?? 0);
        setPages((prev) => (p === 1 ? [json.data] : [...prev, json.data]));
        pageRef.current = p;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fetch failed");
      } finally {
        setLoading(false);
      }
    },
    [queryKey, pageSize]
  );

  // Reset on queryKey change
  useEffect(() => {
    if (keyRef.current !== queryKey) {
      keyRef.current = queryKey;
      setPages([]);
      pageRef.current = 1;
    }
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const items = pages.flat();
  const hasMore = items.length < total;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchPage(pageRef.current + 1);
  }, [loading, hasMore, fetchPage]);

  return { items, total, loading, error, hasMore, loadMore };
}
