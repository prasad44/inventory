"use client";

import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { StatCards } from "@/components/dashboard/stat-cards";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { StockChart } from "@/components/dashboard/stock-chart";

export default function DashboardPage() {
  const { profile, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || "User"}
        </p>
      </div>

      <StatCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <StockChart />
        <LowStockAlerts />
      </div>
    </div>
  );
}
