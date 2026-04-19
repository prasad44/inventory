import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const COOKIE = "cart_sid";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

async function ensureCartOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const store = await cookies();
  let sid = store.get(COOKIE)?.value;
  if (!sid) {
    sid = crypto.randomUUID();
    store.set(COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
  }
  return { supabase, userId: user?.id ?? null, sessionId: sid };
}

function ownerFilter<
  T extends {
    eq: (col: string, val: unknown) => T;
    is: (col: string, val: unknown) => T;
  }
>(query: T, userId: string | null, sessionId: string): T {
  if (userId) {
    return query.eq("user_id", userId);
  }
  return query.is("user_id", null).eq("session_id", sessionId);
}

export async function GET() {
  const { supabase, userId, sessionId } = await ensureCartOwner();
  let q = supabase
    .from("cart_items")
    .select(
      "id, product_id, quantity, added_at, product:products(id, name, slug, brand, price, discount_pct, images, image_url, quantity_in_stock, status)"
    )
    .order("added_at", { ascending: true });
  q = ownerFilter(q as never, userId, sessionId) as typeof q;
  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

interface PostBody {
  product_id?: unknown;
  quantity?: unknown;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as PostBody | null;
  const productId = typeof body?.product_id === "string" ? body.product_id : null;
  const quantity =
    typeof body?.quantity === "number" && Number.isFinite(body.quantity)
      ? Math.max(1, Math.floor(body.quantity))
      : 1;

  if (!productId) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const { supabase, userId, sessionId } = await ensureCartOwner();

  // Verify product is active + in stock
  const { data: product } = await supabase
    .from("products")
    .select("id, quantity_in_stock, status")
    .eq("id", productId)
    .maybeSingle();
  if (!product || product.status !== "active" || product.quantity_in_stock <= 0) {
    return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
  }

  // Find existing row by (owner, product)
  let existsQ = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("product_id", productId);
  existsQ = ownerFilter(existsQ as never, userId, sessionId) as typeof existsQ;
  const { data: existing } = await existsQ.maybeSingle();

  const desiredQty = Math.min(
    (existing?.quantity ?? 0) + quantity,
    product.quantity_in_stock
  );

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: desiredQty })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("cart_items").insert({
      product_id: productId,
      quantity: desiredQty,
      user_id: userId,
      session_id: userId ? null : sessionId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, quantity: desiredQty });
}

interface PatchBody {
  product_id?: unknown;
  quantity?: unknown;
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as PatchBody | null;
  const productId = typeof body?.product_id === "string" ? body.product_id : null;
  const quantity =
    typeof body?.quantity === "number" && Number.isFinite(body.quantity)
      ? Math.floor(body.quantity)
      : NaN;

  if (!productId || !Number.isFinite(quantity)) {
    return NextResponse.json(
      { error: "product_id and quantity required" },
      { status: 400 }
    );
  }

  const { supabase, userId, sessionId } = await ensureCartOwner();

  if (quantity <= 0) {
    // Treat zero/negative as delete
    let q = supabase.from("cart_items").delete().eq("product_id", productId);
    q = ownerFilter(q as never, userId, sessionId) as typeof q;
    await q;
    return NextResponse.json({ ok: true, quantity: 0 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("quantity_in_stock")
    .eq("id", productId)
    .maybeSingle();
  const stock = product?.quantity_in_stock ?? 0;
  const clamped = Math.min(quantity, stock);

  let q = supabase
    .from("cart_items")
    .update({ quantity: clamped })
    .eq("product_id", productId);
  q = ownerFilter(q as never, userId, sessionId) as typeof q;
  await q;

  return NextResponse.json({ ok: true, quantity: clamped });
}

export async function DELETE(req: NextRequest) {
  const productId = new URL(req.url).searchParams.get("product_id");
  const { supabase, userId, sessionId } = await ensureCartOwner();

  let q = supabase.from("cart_items").delete();
  q = ownerFilter(q as never, userId, sessionId) as typeof q;
  if (productId) q = q.eq("product_id", productId);

  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
