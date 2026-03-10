"use client";

import { OrdersTable } from "@/components/orders/orders-table";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage stock movements — inbound, outbound, and adjustments</p>
      </div>
      <OrdersTable />
    </div>
  );
}
