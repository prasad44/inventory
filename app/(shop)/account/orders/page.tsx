"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatLKR } from "@/lib/format";

interface OrderItem {
  quantity: number;
  unit_price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[] | null;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  delivery_fee: number;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((j) => setOrders((j.orders ?? []) as Order[]))
      .catch(() => setOrders([]));
  }, []);

  if (orders === null) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-medium">No orders yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your orders will appear here.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-primary hover:underline text-sm"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const shortId = o.id.slice(0, 8).toUpperCase();
        const subtotal = o.items.reduce(
          (s, i) => s + i.unit_price * i.quantity,
          0
        );
        const total = subtotal + (Number(o.delivery_fee) || 0);
        return (
          <Link
            key={o.id}
            href={`/order?id=${encodeURIComponent(o.id)}`}
            className="block rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-mono text-xs text-muted-foreground">
                  ORDER-{shortId}
                </div>
                <div className="text-sm mt-1">
                  {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                  <span className="text-muted-foreground"> · </span>
                  {new Date(o.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular-nums">
                  {formatLKR(total)}
                </div>
                <StatusBadge status={o.status} payment={o.payment_status} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ status, payment }: { status: string; payment: string }) {
  const { label, className } =
    status === "completed"
      ? { label: "Completed", className: "text-success bg-success/10" }
      : status === "cancelled"
      ? { label: "Cancelled", className: "text-destructive bg-destructive/10" }
      : payment === "paid"
      ? { label: "Paid", className: "text-primary bg-primary/10" }
      : { label: "Pending", className: "text-muted-foreground bg-muted" };
  return (
    <span
      className={`inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${className}`}
    >
      {label}
    </span>
  );
}
