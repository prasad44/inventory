"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/lib/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

interface OrderDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess: () => void;
}

const typeBadgeVariant = {
  inbound: "default" as const,
  outbound: "secondary" as const,
  adjustment: "outline" as const,
};

const statusBadgeVariant = {
  pending: "outline" as const,
  completed: "default" as const,
  cancelled: "destructive" as const,
};

export function OrderDetail({ open, onOpenChange, order, onSuccess }: OrderDetailProps) {
  const [loading, setLoading] = useState(false);
  const { profile } = useCurrentUser();
  const canManage = profile?.role === "admin" || profile?.role === "manager";

  const handleComplete = async () => {
    if (!confirm("Complete this order? This will update stock levels.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete order");
      }
      toast.success("Order completed — stock updated");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this order?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel order");
      }
      toast.success("Order cancelled");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order Details
            <Badge variant={typeBadgeVariant[order.type]} className="capitalize">
              {order.type}
            </Badge>
            <Badge variant={statusBadgeVariant[order.status]} className="capitalize">
              {order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            {order.reference_number && (
              <div>
                <span className="text-muted-foreground">Reference: </span>
                {order.reference_number}
              </div>
            )}
            {order.supplier && (
              <div>
                <span className="text-muted-foreground">Supplier: </span>
                {order.supplier.name}
              </div>
            )}
            {order.creator && (
              <div>
                <span className="text-muted-foreground">Created by: </span>
                {order.creator.full_name}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Created: </span>
              {new Date(order.created_at).toLocaleDateString()}
            </div>
            {order.completed_at && (
              <div>
                <span className="text-muted-foreground">Completed: </span>
                {new Date(order.completed_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {order.notes && (
            <>
              <Separator />
              <p className="text-muted-foreground">{order.notes}</p>
            </>
          )}

          <Separator />

          {order.order_items && order.order_items.length > 0 && (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        {item.product?.name ?? "Unknown"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {item.product?.sku}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {order.status === "pending" && canManage && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel Order
            </Button>
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? "Processing..." : "Complete Order"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
