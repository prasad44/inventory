"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderWizard } from "./order-wizard";
import { OrderDetail } from "./order-detail";
import { Plus, Eye, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import type { Order } from "@/lib/types";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

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

const paymentMethodOptions = [
  { value: "all", label: "All Payments" },
  { value: "cod", label: "COD" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
];

export function OrdersTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(
    searchParams.get("payment") === "bank_transfer"
      ? "bank_transfer"
      : searchParams.get("payment_method") ?? ""
  );
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const { profile } = useCurrentUser();

  const canCreate = profile?.role === "admin" || profile?.role === "manager";
  const canManagePayments = canCreate;

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (paymentMethodFilter) params.set("payment_method", paymentMethodFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/orders?${params}`);
    const json = await res.json();
    if (json.data) {
      setOrders(json.data);
      setTotalCount(json.count ?? 0);
    }
  }, [typeFilter, statusFilter, paymentMethodFilter, page, pageSize]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Keep URL in sync with the payment_method filter so dashboard deep-links work
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (paymentMethodFilter) {
      next.set("payment_method", paymentMethodFilter);
    } else {
      next.delete("payment_method");
    }
    next.delete("payment"); // legacy alias from dashboard link
    const qs = next.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    // Avoid redundant navigation loop.
    const current =
      searchParams.toString() === qs ? pathname : `${pathname}?${searchParams.toString()}`;
    if (target !== current) {
      router.replace(target, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethodFilter]);

  const markAsPaid = async (orderId: string) => {
    setMarkingPaidId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/mark-paid`, { method: "POST" });
      if (res.ok) {
        await loadOrders();
      }
    } finally {
      setMarkingPaidId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => {
            setTypeFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "all"}
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {paymentMethodOptions.map((opt) => {
            const active = (paymentMethodFilter || "all") === opt.value;
            return (
              <Button
                key={opt.value}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPaymentMethodFilter(opt.value === "all" ? "" : opt.value);
                  setPage(1);
                }}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
        <div className="flex-1" />
        {canCreate && (
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New Order
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const canMarkPaid =
                  canManagePayments &&
                  order.payment_method === "bank_transfer" &&
                  order.payment_status === "pending";
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.reference_number || order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariant[order.type]} className="capitalize">
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[order.status]} className="capitalize">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.payment_method ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs capitalize">
                            {order.payment_method.replace("_", " ")}
                          </span>
                          <span
                            className={
                              order.payment_status === "paid"
                                ? "text-xs text-green-600"
                                : order.payment_status === "failed"
                                  ? "text-xs text-red-600"
                                  : "text-xs text-muted-foreground"
                            }
                          >
                            {order.payment_status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{order.supplier?.name ?? "—"}</TableCell>
                    <TableCell>{order.order_items?.length ?? 0} item(s)</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canMarkPaid && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={markingPaidId === order.id}
                            onClick={() => markAsPaid(order.id)}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            {markingPaidId === order.id ? "..." : "Mark paid"}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setDetailOrder(order)}
                        >
                          <Eye className="h-3.5 w-3.5" />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
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

      {wizardOpen && (
        <OrderWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onSuccess={loadOrders}
        />
      )}

      {detailOrder && (
        <OrderDetail
          open={!!detailOrder}
          onOpenChange={(open) => {
            if (!open) setDetailOrder(null);
          }}
          order={detailOrder}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}
