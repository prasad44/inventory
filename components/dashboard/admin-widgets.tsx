"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, MessagesSquare, Wallet, Trophy } from "lucide-react";

interface TopProduct {
  id: string;
  name: string;
  slug: string;
  sold: number;
}

interface ExpiringDeal {
  id: string;
  discount_pct: number;
  ends_at: string;
  product: { name: string; slug: string } | null;
}

interface WidgetData {
  topProducts: TopProduct[];
  pendingReviewsCount: number;
  pendingBankTransfersCount: number;
  expiringDeals: ExpiringDeal[];
}

function formatEndsIn(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  const mins = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${mins}m left`;
}

export function AdminWidgets() {
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard/widgets")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as WidgetData;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top sellers (7d)
          </CardTitle>
          <Trophy className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent className="space-y-1">
          {data.topProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sales in the last 7 days</p>
          ) : (
            data.topProducts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/products?slug=${p.slug}`}
                  className="truncate hover:underline"
                  title={p.name}
                >
                  {p.name}
                </Link>
                <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                  {p.sold}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Link href="/reviews" className="group">
        <Card className="h-full transition-colors group-hover:bg-accent/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending reviews
            </CardTitle>
            <MessagesSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {data.pendingReviewsCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Review and approve new submissions
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/orders?payment_method=bank_transfer" className="group">
        <Card className="h-full transition-colors group-hover:bg-accent/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending bank transfers
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {data.pendingBankTransfersCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Awaiting payment confirmation
            </p>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Deals expiring soon
          </CardTitle>
          <Flame className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent className="space-y-1">
          {data.expiringDeals.length === 0 ? (
            <p className="text-xs text-muted-foreground">No deals ending in the next 24h</p>
          ) : (
            data.expiringDeals.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="truncate" title={d.product?.name ?? ""}>
                  {d.product?.name ?? "Deal"}
                </span>
                <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                  {formatEndsIn(d.ends_at)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
