"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  totalSuppliers: number;
  pendingOrders: number;
}

export function StatCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((j) => {
        setStats(j.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted mb-1" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: `${stats.activeProducts} active products`,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      description: `${stats.outOfStockCount} out of stock`,
      color: stats.lowStockCount > 0 ? "text-red-600" : "text-green-600",
      bg: stats.lowStockCount > 0 ? "bg-red-100 dark:bg-red-900/20" : "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Inventory Value",
      value: `$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      description: "Total cost value",
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/20",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: ShoppingCart,
      description: `${stats.totalSuppliers} active suppliers`,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={cn("p-2 rounded-full", card.bg)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
