"use client";

import { SupplierTable } from "@/components/suppliers/supplier-table";

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground">Manage your suppliers</p>
      </div>
      <SupplierTable />
    </div>
  );
}
