"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BellRing, X, TrendingDown } from "lucide-react";
import { formatLKR } from "@/lib/format";
import type { Product } from "@/lib/types";

interface StockAlertRow {
  id: string;
  product_id: string;
  email: string;
  created_at: string;
  product: Product | null;
}

interface PriceAlertRow extends StockAlertRow {
  target_price: number | null;
}

export default function AlertsPage() {
  const [stock, setStock] = useState<StockAlertRow[] | null>(null);
  const [price, setPrice] = useState<PriceAlertRow[] | null>(null);

  function refetch() {
    setStock(null);
    setPrice(null);
    fetch("/api/account/alerts")
      .then((r) => r.json())
      .then((j) => {
        setStock((j.stock ?? []) as StockAlertRow[]);
        setPrice((j.price ?? []) as PriceAlertRow[]);
      })
      .catch(() => {
        setStock([]);
        setPrice([]);
      });
  }

  useEffect(refetch, []);

  async function cancel(type: "stock" | "price", id: string) {
    const res = await fetch(
      `/api/account/alerts?type=${type}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Alert cancelled");
      refetch();
    } else {
      toast.error("Could not cancel");
    }
  }

  if (stock === null || price === null) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  const nothing = stock.length === 0 && price.length === 0;
  if (nothing) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <BellRing className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-medium">No alerts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set stock or price alerts from any product page to get notified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stock.length > 0 && (
        <section>
          <h2 className="font-medium mb-2 inline-flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Back-in-stock alerts
          </h2>
          <ul className="space-y-2">
            {stock.map((a) => (
              <AlertRow
                key={a.id}
                onCancel={() => cancel("stock", a.id)}
                product={a.product}
              >
                <span className="text-xs text-muted-foreground">
                  Email us at {a.email} when back in stock
                </span>
              </AlertRow>
            ))}
          </ul>
        </section>
      )}
      {price.length > 0 && (
        <section>
          <h2 className="font-medium mb-2 inline-flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            Price drop alerts
          </h2>
          <ul className="space-y-2">
            {price.map((a) => (
              <AlertRow
                key={a.id}
                onCancel={() => cancel("price", a.id)}
                product={a.product}
              >
                <span className="text-xs text-muted-foreground">
                  {a.target_price != null
                    ? `When price drops below ${formatLKR(a.target_price)}`
                    : "On any price drop"}
                </span>
              </AlertRow>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AlertRow({
  product,
  children,
  onCancel,
}: {
  product: Product | null;
  children: React.ReactNode;
  onCancel: () => void;
}) {
  const img = product?.images?.[0] ?? product?.image_url ?? "";
  return (
    <li className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
      <div className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
        {product && img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {product ? (
          <Link
            href={`/p?slug=${encodeURIComponent(product.slug)}`}
            className="text-sm font-medium hover:text-primary line-clamp-1"
          >
            {product.name}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">
            (Product unavailable)
          </span>
        )}
        <div className="mt-0.5">{children}</div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel alert"
        className="p-1.5 rounded hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
