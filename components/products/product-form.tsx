"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagesGalleryUpload } from "./images-gallery-upload";
import { SpecsEditor } from "./specs-editor";
import type { Product, Category, Supplier, Brand } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    category_id: product?.category_id ?? "",
    price: product?.price ?? 0,
    cost_price: product?.cost_price ?? 0,
    quantity_in_stock: product?.quantity_in_stock ?? 0,
    reorder_point: product?.reorder_point ?? 0,
    reorder_quantity: product?.reorder_quantity ?? 0,
    supplier_id: product?.supplier_id ?? "",
    image_url: product?.image_url ?? null,
    status: product?.status ?? "active",
    // E-commerce fields
    brand: product?.brand ?? "",
    slug: product?.slug ?? "",
    discount_pct: product?.discount_pct ?? 0,
    warranty_months: product?.warranty_months ?? 0,
    is_genuine: product?.is_genuine ?? true,
    images: (product?.images ?? []) as string[],
    specs: (product?.specs ?? {}) as Record<string, unknown>,
    meta_title: product?.meta_title ?? "",
    meta_desc: product?.meta_desc ?? "",
  });

  // Track whether slug is auto-derived from name. New products start auto;
  // edits start manual (since a slug already exists).
  const [isSlugAuto, setIsSlugAuto] = useState(!product);

  const isEdit = !!product;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.data || []));
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((j) => setSuppliers(j.data || []));
    fetch("/api/brands")
      .then((r) => r.json())
      .then((j) => setBrands(j.data || []));
  }, []);

  // Auto-update slug while in auto mode
  useEffect(() => {
    if (isSlugAuto) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
  }, [form.name, isSlugAuto]);

  const categoryBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.slug);
    return m;
  }, [categories]);
  const currentCategorySlug = form.category_id
    ? categoryBySlug.get(form.category_id) ?? null
    : null;

  async function handleAddBrand() {
    const name = newBrandName.trim();
    if (!name) return;
    setAddingBrand(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to add brand");
      const created: Brand | undefined = j.brand;
      if (!created) throw new Error("No brand returned");
      // Refresh list and select the new brand
      setBrands((prev) => {
        const exists = prev.some((b) => b.id === created.id);
        return exists ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setForm((f) => ({ ...f, brand: created.name }));
      setNewBrandName("");
      setShowAddBrand(false);
      toast.success("Brand added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add brand");
    } finally {
      setAddingBrand(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure slug is always populated (fallback from name)
      const finalSlug = (form.slug && form.slug.trim()) || slugify(form.name);

      const body = {
        ...form,
        slug: finalSlug,
        price: Number(form.price),
        cost_price: Number(form.cost_price),
        quantity_in_stock: Number(form.quantity_in_stock),
        reorder_point: Number(form.reorder_point),
        reorder_quantity: Number(form.reorder_quantity),
        discount_pct: Number(form.discount_pct) || 0,
        warranty_months: Number(form.warranty_months) || 0,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        brand: form.brand ? form.brand : null,
        meta_title: form.meta_title || null,
        meta_desc: form.meta_desc || null,
      };

      const url = isEdit ? `/api/products/${product.id}` : "/api/products";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  function onSlugEdit(v: string) {
    setIsSlugAuto(false);
    setForm((f) => ({ ...f, slug: v }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => onSlugEdit(e.target.value)}
              placeholder="auto-generated from name"
            />
            <p className="text-xs text-muted-foreground">
              {isSlugAuto
                ? "Auto-generated from name. Edit to customize."
                : "Manual slug. Clear and re-type the name to regenerate."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => update("barcode", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => update("category_id", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={form.supplier_id}
                onValueChange={(v) => update("supplier_id", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Brand & Details */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold">Brand & Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <div className="flex gap-2">
                  <select
                    id="brand"
                    value={form.brand || ""}
                    onChange={(e) => update("brand", e.target.value)}
                    className="flex-1 border border-input rounded-md bg-transparent px-3 py-2 text-sm h-9 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                  >
                    <option value="">None</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddBrand((v) => !v)}
                    aria-label="Add new brand"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {showAddBrand && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="New brand name"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddBrand();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBrand}
                      disabled={addingBrand || !newBrandName.trim()}
                    >
                      {addingBrand ? "..." : "Add"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_pct">Discount %</Label>
                <Input
                  id="discount_pct"
                  type="number"
                  min="0"
                  max="95"
                  value={form.discount_pct}
                  onChange={(e) => update("discount_pct", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warranty_months">Warranty (months)</Label>
                <Input
                  id="warranty_months"
                  type="number"
                  min="0"
                  value={form.warranty_months}
                  onChange={(e) => update("warranty_months", e.target.value)}
                />
              </div>
              <div className="space-y-2 pt-5">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_genuine}
                    onChange={(e) => update("is_genuine", e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Genuine product
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={(e) => update("cost_price", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_in_stock">Stock Qty</Label>
              <Input
                id="quantity_in_stock"
                type="number"
                min="0"
                value={form.quantity_in_stock}
                onChange={(e) => update("quantity_in_stock", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={form.reorder_point}
                onChange={(e) => update("reorder_point", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_quantity">Reorder Qty</Label>
              <Input
                id="reorder_quantity"
                type="number"
                min="0"
                value={form.reorder_quantity}
                onChange={(e) => update("reorder_quantity", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Images gallery */}
          <div className="border-t pt-4 space-y-2">
            <Label>Images</Label>
            <ImagesGalleryUpload
              value={form.images}
              onChange={(next) => update("images", next)}
            />
          </div>

          {/* Specifications */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="text-sm font-semibold">Specifications</h3>
            <SpecsEditor
              categorySlug={currentCategorySlug}
              value={form.specs}
              onChange={(next) => update("specs", next)}
            />
          </div>

          {/* SEO */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold">SEO (optional)</h3>
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta title</Label>
              <Input
                id="meta_title"
                value={form.meta_title}
                onChange={(e) => update("meta_title", e.target.value)}
                maxLength={70}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_desc">Meta description</Label>
              <Textarea
                id="meta_desc"
                value={form.meta_desc}
                onChange={(e) => update("meta_desc", e.target.value)}
                maxLength={160}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
