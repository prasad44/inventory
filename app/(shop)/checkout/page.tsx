import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { CheckoutForm } from "@/components/shop/checkout-form";
import type { DeliveryZone } from "@/lib/types";

export default async function CheckoutPage() {
  const supabase = await createClient();

  // Fetch zones for the city select
  const { data: zonesData } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("city");
  const zones = (zonesData ?? []) as DeliveryZone[];

  // Optional: fetch current user profile for prefilling contact
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let prefillEmail: string | null = null;
  let prefillName: string | null = null;
  if (user) {
    prefillEmail = user.email ?? null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    prefillName = profile?.full_name ?? null;
  }

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
      <CheckoutForm zones={zones} prefillEmail={prefillEmail} prefillName={prefillName} />
    </div>
  );
}
