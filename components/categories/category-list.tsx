"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "./category-form";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import type { Category } from "@/lib/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

function buildTree(categories: Category[]): Category[] {
  const map = new Map<string, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];

  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));

  categories.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  });

  return roots;
}

function CategoryNode({
  category,
  allCategories,
  canEdit,
  onEdit,
  onDelete,
  level = 0,
}: {
  category: Category & { children?: Category[] };
  allCategories: Category[];
  canEdit: boolean;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className="flex-1 text-sm">{category.name}</span>
        {category.description && (
          <span className="text-xs text-muted-foreground">{category.description}</span>
        )}
        {canEdit && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(category)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(category.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      {expanded &&
        hasChildren &&
        category.children!.map((child) => (
          <CategoryNode
            key={child.id}
            category={child as Category & { children?: Category[] }}
            allCategories={allCategories}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
            level={level + 1}
          />
        ))}
    </div>
  );
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const { profile } = useCurrentUser();

  const canEdit = profile?.role === "admin" || profile?.role === "manager";

  const reloadCategories = async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    if (json.data) setCategories(json.data);
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setCategories(json.data);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      reloadCategories();
    } else {
      const json = await res.json();
      toast.error(json.error || "Failed to delete");
    }
  };

  const tree = buildTree(categories);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Categories</CardTitle>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setEditCategory(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Category
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {tree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="space-y-0.5">
            {tree.map((cat) => (
              <CategoryNode
                key={cat.id}
                category={cat}
                allCategories={categories}
                canEdit={canEdit}
                onEdit={(c) => {
                  setEditCategory(c);
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>

      {formOpen && (
        <CategoryForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditCategory(null);
          }}
          category={editCategory}
          categories={categories}
          onSuccess={reloadCategories}
        />
      )}
    </Card>
  );
}
