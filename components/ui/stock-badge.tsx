import { Badge } from "@/components/ui/badge";

interface StockBadgeProps {
  quantity: number;
  reorderPoint: number;
}

export function StockBadge({ quantity, reorderPoint }: StockBadgeProps) {
  if (quantity === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }
  if (quantity <= reorderPoint) {
    return <Badge variant="outline" className="border-orange-500 text-orange-600">Low Stock</Badge>;
  }
  return <Badge variant="secondary">In Stock</Badge>;
}
