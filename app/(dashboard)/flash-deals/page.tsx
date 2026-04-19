"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CountdownTimer } from "@/components/shop/countdown-timer";
import { Plus, Trash2, PowerOff, Power, StopCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { FlashDeal, Product } from "@/lib/types";

type DealWithProduct = Omit<FlashDeal, "product"> & {
  product?: Pick<Product, "id" | "name" | "slug" | "price" | "images" | "image_url"> | null;
};

interface ProductSearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[] | null;
  image_url?: string | null;
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStartIso(): string {
  return toLocalDatetime(new Date().toISOString());
}

function defaultEndIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toLocalDatetime(d.toISOString());
}

function thumbFor(p: DealWithProduct["product"]): string | null {
  if (!p) return null;
  if (p.images && p.images.length > 0) return p.images[0];
  return p.image_url ?? null;
}

function dealStatus(d: DealWithProduct): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
} {
  const now = Date.now();
  const start = new Date(d.starts_at).getTime();
  const end = new Date(d.ends_at).getTime();
  if (!d.is_active) return { label: "Inactive", variant: "outline" };
  if (now < start) return { label: "Scheduled", variant: "secondary" };
  if (now > end) return { label: "Ended", variant: "outline" };
  return { label: "Active", variant: "default" };
}

export default function FlashDealsPage() {
  const [deals, setDeals] = useState<DealWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Create form
  const [productQuery, setProductQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [discountPct, setDiscountPct] = useState<number>(10);
  const [startsAt, setStartsAt] = useState<string>(defaultStartIso());
  const [endsAt, setEndsAt] = useState<string>(defaultEndIso());
  const [maxUnits, setMaxUnits] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/flash-deals");
    const json = await res.json();
    setDeals((json.deals ?? []) as DealWithProduct[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!productQuery || productQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(productQuery.trim())}`);
      const json = await res.json();
      setResults((json.products ?? []) as ProductSearchResult[]);
    }, 250);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [productQuery]);

  const resetForm = () => {
    setProductQuery("");
    setResults([]);
    setSelectedProduct(null);
    setDiscountPct(10);
    setStartsAt(defaultStartIso());
    setEndsAt(defaultEndIso());
    setMaxUnits("");
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const createDeal = async () => {
    if (!selectedProduct) {
      toast.error("Select a product");
      return;
    }
    if (!Number.isFinite(discountPct) || discountPct < 1 || discountPct > 95) {
      toast.error("Discount must be 1-95");
      return;
    }
    if (!startsAt || !endsAt) {
      toast.error("Start and end required");
      return;
    }
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      toast.error("End must be after start");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        product_id: selectedProduct.id,
        discount_pct: discountPct,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        max_units: maxUnits.trim() ? Number(maxUnits) : null,
      };
      const res = await fetch("/api/admin/flash-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed");
      toast.success("Deal created");
      setOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (d: DealWithProduct) => {
    const res = await fetch("/api/admin/flash-deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, is_active: !d.is_active }),
    });
    if (res.ok) {
      toast.success(!d.is_active ? "Deal activated" : "Deal paused");
      void load();
    } else {
      const j = await res.json();
      toast.error(j.error || "Update failed");
    }
  };

  const endNow = async (d: DealWithProduct) => {
    if (!confirm("End this deal immediately?")) return;
    const now = new Date().toISOString();
    const res = await fetch("/api/admin/flash-deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, ends_at: now, is_active: false }),
    });
    if (res.ok) {
      toast.success("Deal ended");
      void load();
    } else {
      const j = await res.json();
      toast.error(j.error || "Update failed");
    }
  };

  const remove = async (d: DealWithProduct) => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/flash-deals?id=${d.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deal deleted");
      void load();
    } else {
      const j = await res.json();
      toast.error(j.error || "Delete failed");
    }
  };

  const sorted = useMemo(() => {
    return [...deals].sort((a, b) => {
      const aActive = dealStatus(a).label === "Active" ? 0 : 1;
      const bActive = dealStatus(b).label === "Active" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime();
    });
  }, [deals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flash deals</h1>
          <p className="text-muted-foreground">Schedule limited-time discounts on products</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Create deal
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-[90px]">Discount</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="w-[120px]">Progress</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No deals yet.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((d) => {
                const status = dealStatus(d);
                const thumb = thumbFor(d.product);
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded border bg-muted" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{d.product?.name ?? "(missing)"}</div>
                          {d.product?.slug && (
                            <div className="truncate text-xs text-muted-foreground">/{d.product.slug}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">-{d.discount_pct}%</TableCell>
                    <TableCell className="text-xs">
                      <div>{new Date(d.starts_at).toLocaleString()}</div>
                      <div className="text-muted-foreground">
                        → {new Date(d.ends_at).toLocaleString()}
                      </div>
                      {status.label === "Active" && (
                        <div className="mt-1">
                          <CountdownTimer endsAt={d.ends_at} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.max_units != null ? (
                        <span>
                          {d.sold_units} / {d.max_units}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{d.sold_units} sold</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {status.label === "Active" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="End now"
                            onClick={() => endNow(d)}
                          >
                            <StopCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={d.is_active ? "Pause" : "Activate"}
                          onClick={() => toggleActive(d)}
                        >
                          {d.is_active ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Delete"
                          onClick={() => remove(d)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create flash deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deal-product">Product</Label>
              {selectedProduct ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{selectedProduct.name}</div>
                    <div className="truncate text-xs text-muted-foreground">/{selectedProduct.slug}</div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedProduct(null);
                      setProductQuery("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="deal-product"
                    value={productQuery}
                    placeholder="Search products by name..."
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  {results.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-md">
                      {results.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductQuery("");
                            setResults([]);
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{p.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              Rs {Math.round(p.price).toLocaleString("en-LK")} · /{p.slug}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deal-discount">Discount %</Label>
                <Input
                  id="deal-discount"
                  type="number"
                  min={1}
                  max={95}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-max">Max units (optional)</Label>
                <Input
                  id="deal-max"
                  type="number"
                  min={1}
                  value={maxUnits}
                  onChange={(e) => setMaxUnits(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deal-starts">Starts at</Label>
                <Input
                  id="deal-starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-ends">Ends at</Label>
                <Input
                  id="deal-ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createDeal} disabled={saving}>
              {saving ? "Creating..." : "Create deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
