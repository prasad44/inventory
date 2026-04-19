"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { Check, Truck, Banknote, Building2 } from "lucide-react";
import { formatLKR } from "@/lib/format";
import { STORE_SETTINGS } from "@/lib/settings";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import type { Product } from "@/lib/types";

interface OrderRow {
  id: string;
  type: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  guest_email: string | null;
  guest_phone: string | null;
  delivery_city: string | null;
  delivery_fee: number;
  delivery_estimate: string | null;
  customer_notes: string | null;
  created_at: string;
  items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    discount_pct_snapshot: number;
    product: Product | null;
  }>;
}

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/order/${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (alive) setNotFoundFlag(true);
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!alive || !j) return;
        setOrder(j.order as OrderRow);
      })
      .catch(() => alive && setNotFoundFlag(true));
    return () => {
      alive = false;
    };
  }, [id]);

  if (notFoundFlag) notFound();

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="h-32 grid place-items-center text-muted-foreground text-sm">
          Loading your order...
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const total = subtotal + (Number(order.delivery_fee) || 0);

  const shortId = order.id.slice(0, 8).toUpperCase();
  const orderRef = `ORDER-${shortId}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: `Order ${shortId}` }]}
        className="mb-4"
      />

      <div className="rounded-lg border border-success bg-success/10 p-6 flex items-start gap-3 mb-6">
        <div className="shrink-0 rounded-full bg-success h-10 w-10 grid place-items-center">
          <Check className="h-5 w-5 text-background" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Thanks for your order!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reference <span className="font-mono">{orderRef}</span>. We&apos;ve logged
            your order and will reach out soon to confirm.
          </p>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 mb-6">
        <h2 className="font-display text-lg font-bold mb-4">Order details</h2>
        <ul className="divide-y divide-border mb-4">
          {order.items.map((i) => (
            <li key={i.id} className="py-3 flex justify-between text-sm">
              <span className="pr-4">
                {i.product?.name ?? "Product unavailable"}
                <span className="text-muted-foreground"> × {i.quantity}</span>
              </span>
              <span className="tabular-nums shrink-0">
                {formatLKR(i.unit_price * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatLKR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="tabular-nums">
              {Number(order.delivery_fee) === 0 ? (
                <span className="text-success">FREE</span>
              ) : (
                formatLKR(Number(order.delivery_fee))
              )}
            </dd>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between items-baseline">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="text-xl font-bold tabular-nums">{formatLKR(total)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 mb-6">
        <h2 className="font-display text-lg font-bold mb-3 inline-flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Delivery
        </h2>
        {order.delivery_city && (
          <p className="text-sm">
            Ships to <span className="font-medium">{order.delivery_city}</span>
            {order.delivery_estimate && (
              <>
                {" "}
                · arrives{" "}
                <span className="font-medium">{order.delivery_estimate}</span>
              </>
            )}
          </p>
        )}
        {order.customer_notes && (
          <p className="mt-2 text-sm text-muted-foreground">
            Notes: {order.customer_notes}
          </p>
        )}
      </section>

      {order.payment_method === "bank_transfer" && (
        <section className="rounded-lg border border-warning bg-warning/5 p-5 mb-6">
          <h2 className="font-display text-lg font-bold mb-3 inline-flex items-center gap-2">
            <Banknote className="h-5 w-5 text-warning" />
            How to pay
          </h2>
          <p className="text-sm mb-3">
            Please transfer{" "}
            <span className="font-bold">{formatLKR(total)}</span> to the following
            account. Use <span className="font-mono">{orderRef}</span> as the reference.
          </p>
          <dl className="text-sm space-y-1.5 bg-card rounded-md p-4 border border-border">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground inline-flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Bank
              </dt>
              <dd className="font-medium text-right">{STORE_SETTINGS.bankName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Account name</dt>
              <dd className="font-medium text-right">
                {STORE_SETTINGS.bankAccountName}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Account number</dt>
              <dd className="font-medium font-mono text-right">
                {STORE_SETTINGS.bankAccountNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Branch</dt>
              <dd className="font-medium text-right">{STORE_SETTINGS.bankBranch}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-medium font-mono text-right">{orderRef}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Once payment is received we&apos;ll update your order status.
          </p>
        </section>
      )}

      {order.payment_method === "cod" && (
        <section className="rounded-lg border border-border bg-card p-5 mb-6">
          <h2 className="font-display text-lg font-bold mb-3 inline-flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Cash on delivery
          </h2>
          <p className="text-sm">
            You&apos;ll pay <span className="font-bold">{formatLKR(total)}</span> in
            cash when your order is delivered.
          </p>
        </section>
      )}

      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-sm font-medium"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
