"use client";
import { MessageCircle } from "lucide-react";
import { formatLKR, effectivePrice } from "@/lib/format";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  qty: number;
  dealDiscountPct?: number;
}

export function WhatsAppBuyButton({ product, qty, dealDiscountPct }: Props) {
  const waNumber = process.env.NEXT_PUBLIC_STORE_WA_NUMBER;
  if (!waNumber) return null; // Hide button if not configured

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    // Log the click (fire and forget)
    void fetch("/api/wa-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id }),
    });

    const discount = dealDiscountPct ?? product.discount_pct ?? 0;
    const total = effectivePrice(product.price, discount) * qty;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const message =
      `Hi, I'd like to order:\n\n` +
      `${product.name} (Qty ${qty})\n` +
      `${formatLKR(total)}\n` +
      `Link: ${origin}/p/${product.slug}\n\n` +
      `My details:\n` +
      `Name: \n` +
      `City: `;
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-success bg-success/10 text-success text-sm font-medium hover:bg-success/15 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Buy via WhatsApp
    </button>
  );
}
