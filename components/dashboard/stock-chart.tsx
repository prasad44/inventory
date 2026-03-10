"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface OrderSummary {
  date: string;
  inbound: number;
  outbound: number;
}

export function StockChart() {
  const [data, setData] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/orders?status=completed&pageSize=100");
        const json = await res.json();
        const orders = json.data || [];

        const byDate = new Map<string, { inbound: number; outbound: number }>();

        // Process orders
        for (const order of orders) {
            // Use completed_at if available, otherwise created_at
            const dateStr = order.completed_at || order.created_at;
            if (!dateStr) continue;

            const date = new Date(dateStr).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            if (!byDate.has(date)) {
              byDate.set(date, { inbound: 0, outbound: 0 });
            }

            const entry = byDate.get(date)!;
            // robust check for order_items
            const items = Array.isArray(order.order_items) ? order.order_items : [];
            
            const totalQty = items.reduce(
              (sum: number, item: { quantity: number }) => sum + (item.quantity || 0),
              0
            );

            if (order.type === "inbound") {
              entry.inbound += totalQty;
            } else if (order.type === "outbound") {
              entry.outbound += totalQty;
            }
        }

        // Convert to array and sort by date roughly (this is a simple approximation)
        // ideally we sort by actual date timestamp
        const chartData = Array.from(byDate.entries()).map(([date, vals]) => ({
            date,
            ...vals,
        }));

        setData(chartData.slice(-14)); // Last 14 entries
      } catch (error) {
        console.error("Failed to fetch chart data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
        <Card className="col-span-1 h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
        </Card>
    );
  }

  return (
    <Card className="col-span-1 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Stock Movement</CardTitle>
        <CardDescription>
          Inbound vs Outbound stock over time
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No completed orders data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar 
                dataKey="inbound" 
                name="Inbound (Stock In)" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
              <Bar 
                dataKey="outbound" 
                name="Outbound (Sales)" 
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
