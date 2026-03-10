"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/types";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";

interface ProductDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export function ProductDetail({ open, onOpenChange, product }: ProductDetailProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              width={480}
              height={192}
              className="h-48 w-full rounded-md border object-cover"
              unoptimized
            />
          )}

          <div className="flex gap-2">
            <Badge variant="outline">{product.sku}</Badge>
            <Badge variant={product.status === "active" ? "default" : "secondary"}>
              {product.status}
            </Badge>
            <StockBadge
              quantity={product.quantity_in_stock}
              reorderPoint={product.reorder_point}
            />
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Price:</span>{" "}
              <span className="font-medium">${product.price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>{" "}
              <span className="font-medium">${product.cost_price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">In Stock:</span>{" "}
              <span className="font-medium">{product.quantity_in_stock}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reorder Point:</span>{" "}
              <span className="font-medium">{product.reorder_point}</span>
            </div>
            {product.barcode && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-sm">Barcode:</span>
                <BarcodeDisplay
                  value={product.barcode}
                  className="w-full mt-1"
                  height={40}
                />
              </div>
            )}
            {product.category && (
              <div>
                <span className="text-muted-foreground">Category:</span>{" "}
                <span className="font-medium">{product.category.name}</span>
              </div>
            )}
            {product.supplier && (
              <div>
                <span className="text-muted-foreground">Supplier:</span>{" "}
                <span className="font-medium">{product.supplier.name}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
