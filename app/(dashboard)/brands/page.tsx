"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Brand } from "@/lib/types";

interface FormState {
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  is_featured: boolean;
  sort_order: number;
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  logo_url: "",
  is_featured: false,
  sort_order: 0,
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/brands");
    const json = await res.json();
    setBrands((json.data ?? []) as Brand[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description ?? "",
      logo_url: b.logo_url ?? "",
      is_featured: b.is_featured,
      sort_order: b.sort_order,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        logo_url: form.logo_url.trim() || null,
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order) || 0,
      };
      const res = await fetch("/api/brands", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      toast.success(editing ? "Brand updated" : "Brand created");
      setOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b: Brand) => {
    if (!confirm(`Delete "${b.name}"?`)) return;
    const res = await fetch(`/api/brands?id=${b.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Brand deleted");
      void load();
    } else {
      const j = await res.json();
      toast.error(j.error || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage product brands and featured flags</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Add brand
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[100px]">Featured</TableHead>
              <TableHead className="w-[80px]">Sort</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : brands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No brands yet.
                </TableCell>
              </TableRow>
            ) : (
              brands.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">{b.slug}</TableCell>
                  <TableCell>
                    {b.is_featured ? (
                      <Badge>Featured</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{b.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(b)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit brand" : "New brand"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-slug">Slug (leave blank to auto-generate)</Label>
              <Input
                id="brand-slug"
                value={form.slug}
                placeholder="samsung"
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo URL</Label>
              <Input
                id="brand-logo"
                value={form.logo_url}
                placeholder="https://..."
                onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-desc">Description</Label>
              <Textarea
                id="brand-desc"
                value={form.description}
                rows={3}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand-sort">Sort order</Label>
                <Input
                  id="brand-sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Featured brand
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
