"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ArrowRight, PackageX } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProduct {
  id: string;
  name: string;
  sku: string;
  quantity_in_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  supplier: { id: string; name: string } | null;
}

export function LowStockAlerts() {
  const [alerts, setAlerts] = useState<AlertProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/alerts")
      .then((r) => r.json())
      .then((j) => {
        setAlerts(j.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Card className="col-span-1 flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Link href="/inventory?filter=low_stock">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View All <ArrowRight className="h-3 w-3" />
                </Button>
            </Link>
        </div>
        <CardDescription>
          Items that have fallen below their reorder point.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                 <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                 </div>
                 <div className="h-6 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
                <PackageX className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm">No low stock alerts.</p>
            <p className="text-xs opacity-70">Inventory levels are healthy.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
             <div className="divide-y">
                {alerts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono bg-muted px-1 py-0.5 rounded">{product.sku}</span>
                        {product.supplier && (
                            <span>• {product.supplier.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {product.quantity_in_stock === 0 ? (
                        <Badge variant="destructive" className="h-6">Out of Stock</Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 h-6">
                          {product.quantity_in_stock} left
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Reorder at: {product.reorder_point}
                      </span>
                    </div>
                  </div>
                ))}
             </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
