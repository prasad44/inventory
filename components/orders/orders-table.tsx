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
import { Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const { profile } = useCurrentUser();

  const canCreate = profile?.role === "admin" || profile?.role === "manager";

  const reloadOrders = async () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const res = await fetch(`/api/orders?${params}`);
    const json = await res.json();
    if (json.data) {
      setOrders(json.data);
      setTotalCount(json.count ?? 0);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    fetch(`/api/orders?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setOrders(json.data);
          setTotalCount(json.count ?? 0);
        }
      });
  }, [typeFilter, statusFilter, page, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={typeFilter}
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
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
                  <TableCell>{order.supplier?.name ?? "—"}</TableCell>
                  <TableCell>{order.order_items?.length ?? 0} item(s)</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setDetailOrder(order)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
          onSuccess={reloadOrders}
        />
      )}

      {detailOrder && (
        <OrderDetail
          open={!!detailOrder}
          onOpenChange={(open) => {
            if (!open) setDetailOrder(null);
          }}
          order={detailOrder}
          onSuccess={reloadOrders}
        />
      )}
    </div>
  );
}
