"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockBadge } from "@/components/ui/stock-badge";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "./product-form";
import { ProductDetail } from "./product-detail";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { Product, Category } from "@/lib/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export function ProductsDataTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const { profile } = useCurrentUser();

  const canEdit = profile?.role === "admin" || profile?.role === "manager";
  const canDelete = profile?.role === "admin";

  const reloadProducts = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/products?${params}`);
    const json = await res.json();
    if (json.data) {
      setProducts(json.data);
      setTotalCount(json.count ?? 0);
    }
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.data || []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const timeout = setTimeout(() => {
      fetch(`/api/products?${params}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setProducts(json.data);
            setTotalCount(json.count ?? 0);
          }
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, categoryFilter, statusFilter, page, pageSize]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product deleted");
      reloadProducts();
    } else {
      const json = await res.json();
      toast.error(json.error || "Failed to delete");
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="discontinued">Discontinued</SelectItem>
          </SelectContent>
        </Select>
        {canEdit && (
          <Button
            onClick={() => {
              setEditProduct(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded border bg-muted overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Plus className="h-3 w-3 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.sku}</Badge>
                  </TableCell>
                  <TableCell>{product.category?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    ${Number(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <StockBadge
                      quantity={product.quantity_in_stock}
                      reorderPoint={product.reorder_point}
                    />
                    <span className="ml-2">{product.quantity_in_stock}</span>
                  </TableCell>
                  <TableCell>
                    {product.status === "active" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                        active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800">
                        {product.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDetailProduct(product)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditProduct(product);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {formOpen && (
        <ProductForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditProduct(null);
          }}
          product={editProduct}
          onSuccess={reloadProducts}
        />
      )}

      {detailProduct && (
        <ProductDetail
          open={!!detailProduct}
          onOpenChange={(open) => {
            if (!open) setDetailProduct(null);
          }}
          product={detailProduct}
        />
      )}
    </div>
  );
}
