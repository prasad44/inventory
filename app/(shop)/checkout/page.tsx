"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { CheckoutForm } from "@/components/shop/checkout-form";
import type { DeliveryZone } from "@/lib/types";

interface Payload {
  zones: DeliveryZone[];
  prefillEmail: string | null;
  prefillName: string | null;
}

export default function CheckoutPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/checkout-page")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        if (!alive) return;
        setData(j as Payload);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load checkout");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
        className="mb-4"
      />
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Checkout</h1>
      {error ? (
        <div className="text-sm text-destructive">Could not load checkout: {error}</div>
      ) : !data ? (
        <div className="h-64 grid place-items-center text-muted-foreground text-sm">
          Loading...
        </div>
      ) : (
        <CheckoutForm
          zones={data.zones}
          prefillEmail={data.prefillEmail}
          prefillName={data.prefillName}
        />
      )}
    </div>
  );
}
