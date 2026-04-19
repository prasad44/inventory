"use client";
import { useState } from "react";
import { BellRing, TrendingDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
}

export function StockPriceAlerts({ product }: Props) {
  const outOfStock = product.quantity_in_stock <= 0;

  const [mode, setMode] = useState<"idle" | "stock" | "price" | "done">(
    outOfStock ? "stock" : "idle"
  );
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitStock(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/alerts/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, email }),
      });
      if (!res.ok) throw new Error("failed");
      setMode("done");
      toast.success("We'll email you when it's back in stock");
    } catch {
      toast.error("Could not create alert");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/alerts/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          email,
          target_price: target ? Number(target) : null,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setMode("done");
      toast.success("We'll email you if the price drops");
    } catch {
      toast.error("Could not create alert");
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "done") {
    return (
      <div className="rounded-md border border-success bg-success/10 p-3 text-sm inline-flex items-center gap-2 text-success">
        <Check className="h-4 w-4" />
        Alert created
      </div>
    );
  }

  if (mode === "stock") {
    return (
      <form onSubmit={submitStock} className="rounded-md border border-border p-3 space-y-2 text-sm">
        <div className="inline-flex items-center gap-2 font-medium">
          <BellRing className="h-4 w-4 text-primary" />
          Notify me when back in stock
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "..." : "Notify me"}
          </button>
        </div>
      </form>
    );
  }

  if (mode === "price") {
    return (
      <form onSubmit={submitPrice} className="rounded-md border border-border p-3 space-y-2 text-sm">
        <div className="inline-flex items-center gap-2 font-medium">
          <TrendingDown className="h-4 w-4 text-primary" />
          Notify me when price drops
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <input
          type="number"
          min={0}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target price in Rs (optional)"
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="px-3 py-1.5 rounded-md border border-border text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "..." : "Notify me"}
          </button>
        </div>
      </form>
    );
  }

  // idle + in stock → show a link button
  return (
    <button
      type="button"
      onClick={() => setMode("price")}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
    >
      <TrendingDown className="h-4 w-4" />
      Notify me when price drops
    </button>
  );
}
