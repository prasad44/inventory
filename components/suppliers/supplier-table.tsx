"use client";

import { useState, useEffect, useCallback } from "react";
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
import { SupplierForm } from "./supplier-form";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { Supplier } from "@/lib/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export function SupplierTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const { profile } = useCurrentUser();

  const canEdit = profile?.role === "admin" || profile?.role === "manager";

  const fetchSuppliers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/suppliers?${params}`);
    const json = await res.json();
    if (json.data) setSuppliers(json.data);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(timeout);
  }, [fetchSuppliers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    const res = await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Supplier deleted");
      fetchSuppliers();
    } else {
      const json = await res.json();
      toast.error(json.error || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditSupplier(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Supplier
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              {canEdit && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_name}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditSupplier(supplier);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {formOpen && (
        <SupplierForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditSupplier(null);
          }}
          supplier={editSupplier}
          onSuccess={fetchSuppliers}
        />
      )}
    </div>
  );
}
