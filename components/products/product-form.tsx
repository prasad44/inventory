"use client";

import { useState, useEffect } from "react";
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
import { ImageUpload } from "./image-upload";
import type { Product, Category, Supplier } from "@/lib/types";
import toast from "react-hot-toast";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

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
  });

  const isEdit = !!product;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.data || []));
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((j) => setSuppliers(j.data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        ...form,
        price: Number(form.price),
        cost_price: Number(form.cost_price),
        quantity_in_stock: Number(form.quantity_in_stock),
        reorder_point: Number(form.reorder_point),
        reorder_quantity: Number(form.reorder_quantity),
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload
                value={form.image_url}
                onChange={(url) => update("image_url", url)}
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
