import { BadgeCheck } from "lucide-react";
import type { Product } from "@/lib/types";

export function WarrantyBadges({ product }: { product: Product }) {
  if (!product.is_genuine && product.warranty_months <= 0) return null;
  return (
    <div className="rounded-md border border-border p-3 flex flex-col gap-1.5 text-sm">
      {product.warranty_months > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span>{product.warranty_months}-month manufacturer warranty</span>
        </span>
      )}
      {product.is_genuine && (
        <>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span>Genuine stock — direct from authorized distributor</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span>Verify authenticity at delivery</span>
          </span>
        </>
      )}
    </div>
  );
}
