// Requires SUPABASE_SERVICE_ROLE_KEY in env for guest checkout RLS bypass.
// MVP: stock decrement uses read-then-write (see getNewStock) — a classic
// TOCTOU race is tolerated here; production fix would move this into a
// Postgres transaction / RPC similar to the existing complete_order RPC.
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAnonClient } from "@/lib/supabase/server";
import { createClient as createServiceClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { computeDeliveryDates, computeDeliveryFee } from "@/lib/delivery";
import { effectivePrice } from "@/lib/format";
import { STORE_SETTINGS } from "@/lib/settings";

interface CheckoutBody {
  contact?: {
    email?: string;
    phone?: string;
    full_name?: string;
  };
  shipping?: {
    line1?: string;
    line2?: string | null;
    city?: string;
    district?: string;
    postal_code?: string | null;
    notes?: string | null;
  };
  payment_method?: "cod" | "bank_transfer";
}

function service(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service creds missing");
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as CheckoutBody | null;
  if (!body?.contact?.email || !body.contact.full_name || !body.contact.phone) {
    return NextResponse.json({ error: "Contact info required" }, { status: 400 });
  }
  if (!body.shipping?.line1 || !body.shipping.city || !body.shipping.district) {
    return NextResponse.json({ error: "Shipping address required" }, { status: 400 });
  }
  const method = body.payment_method;
  if (method !== "cod" && method !== "bank_transfer") {
    return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
  }

  const anon = await createAnonClient();
  const {
    data: { user },
  } = await anon.auth.getUser();

  const sid = (await cookies()).get("cart_sid")?.value ?? null;

  // Load cart — same matching as /api/cart
  const cartQ = user
    ? anon.from("cart_items").select("*, product:products(*)").eq("user_id", user.id)
    : anon
        .from("cart_items")
        .select("*, product:products(*)")
        .is("user_id", null)
        .eq("session_id", sid ?? "");

  const { data: cartItems } = await cartQ;
  const items = (cartItems ?? []).filter((it) => it.product);
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Revalidate stock
  for (const it of items) {
    const p = it.product as {
      quantity_in_stock: number;
      name: string;
      status: string;
    };
    if (p.status !== "active") {
      return NextResponse.json(
        { error: `${p.name} is no longer available` },
        { status: 409 }
      );
    }
    if (it.quantity > p.quantity_in_stock) {
      return NextResponse.json(
        { error: `${p.name} only has ${p.quantity_in_stock} in stock` },
        { status: 409 }
      );
    }
  }

  // Service-role client bypasses RLS so guests can insert orders/order_items.
  const svc = service();

  // Resolve delivery fee from zone
  const { data: zone } = await svc
    .from("delivery_zones")
    .select("*")
    .eq("city", body.shipping.city)
    .maybeSingle();
  const zoneFee = zone ? Number(zone.delivery_fee) : 0;

  // Compute subtotal with discount snapshots
  const lineSnapshots = items.map((it) => {
    const p = it.product as { id: string; price: number; discount_pct: number };
    const unit = effectivePrice(p.price, p.discount_pct ?? 0);
    return {
      product_id: p.id,
      quantity: it.quantity,
      unit_price: unit,
      discount_pct_snapshot: p.discount_pct ?? 0,
    };
  });
  const subtotal = lineSnapshots.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const deliveryFee = computeDeliveryFee(zoneFee, subtotal, STORE_SETTINGS.freeDeliveryThresholdLKR);

  const minDays = zone?.est_min_days ?? 2;
  const maxDays = zone?.est_max_days ?? 5;
  const { min: dmin, max: dmax } = computeDeliveryDates(new Date(), minDays, maxDays);
  const dateFmt = new Intl.DateTimeFormat("en-LK", { month: "short", day: "numeric" });
  const deliveryEstimate = `${dateFmt.format(dmin)} – ${dateFmt.format(dmax)}`;

  // Insert order (service role bypasses RLS for guest)
  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      type: "outbound",
      status: "pending",
      created_by: user?.id ?? null,
      payment_method: method,
      payment_status: "pending",
      guest_email: user ? null : body.contact.email,
      guest_phone: user ? null : body.contact.phone,
      delivery_city: body.shipping.city,
      delivery_fee: deliveryFee,
      delivery_estimate: deliveryEstimate,
      customer_notes: body.shipping.notes ?? null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: orderErr?.message ?? "Could not create order" },
      { status: 500 }
    );
  }

  // Insert order_items with snapshots
  const { error: itemsErr } = await svc.from("order_items").insert(
    lineSnapshots.map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_pct_snapshot: l.discount_pct_snapshot,
    }))
  );

  if (itemsErr) {
    // Best-effort: leave order row for manual recovery; report error
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // Decrement stock for each item (read-then-write; TOCTOU race tolerated for MVP)
  for (const l of lineSnapshots) {
    const newQty = await getNewStock(svc, l.product_id, l.quantity);
    const { error: stockErr } = await svc
      .from("products")
      .update({ quantity_in_stock: newQty })
      .eq("id", l.product_id);
    if (stockErr) {
      console.error("Stock update failed", stockErr);
    }
  }

  // Clear cart items belonging to this owner
  if (user) {
    await svc.from("cart_items").delete().eq("user_id", user.id);
  } else if (sid) {
    await svc.from("cart_items").delete().is("user_id", null).eq("session_id", sid);
  }

  return NextResponse.json({ ok: true, order_id: order.id });
}

async function getNewStock(
  svc: SupabaseClient,
  productId: string,
  decrementBy: number
): Promise<number> {
  const { data } = await svc
    .from("products")
    .select("quantity_in_stock")
    .eq("id", productId)
    .maybeSingle();
  const current = (data?.quantity_in_stock as number) ?? 0;
  return Math.max(0, current - decrementBy);
}
