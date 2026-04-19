"use client";
import { useState } from "react";
import { Package } from "lucide-react";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const images = [product.images?.[0] ?? product.image_url, ...(product.images ?? []).slice(1)].filter(
    Boolean
  ) as string[];
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted grid place-items-center">
        <Package className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square rounded-lg bg-muted overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active] ?? images[0]}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === active}
              className={`shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors ${
                i === active ? "border-primary" : "border-border hover:border-primary/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
