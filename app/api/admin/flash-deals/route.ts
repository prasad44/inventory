import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data, error } = await supabase
    .from("flash_deals")
    .select("*, product:products(id, name, slug, price, images, image_url)")
    .order("ends_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deals: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body?.product_id;
  const discount = Number(body?.discount_pct);
  const startsAt = body?.starts_at;
  const endsAt = body?.ends_at;
  const maxUnits = body?.max_units != null && body.max_units !== "" ? Number(body.max_units) : null;

  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }
  if (!Number.isFinite(discount) || discount < 1 || discount > 95) {
    return NextResponse.json({ error: "discount_pct 1-95" }, { status: 400 });
  }
  if (!startsAt || !endsAt) {
    return NextResponse.json({ error: "starts_at and ends_at required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("flash_deals")
    .insert({
      product_id: productId,
      discount_pct: Math.round(discount),
      starts_at: startsAt,
      ends_at: endsAt,
      max_units: maxUnits,
      is_active: true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deal: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (body.discount_pct != null && Number.isFinite(Number(body.discount_pct))) {
    updates.discount_pct = Math.round(Number(body.discount_pct));
  }
  if (body.ends_at) updates.ends_at = body.ends_at;
  if ("max_units" in body) {
    updates.max_units = body.max_units != null && body.max_units !== "" ? Number(body.max_units) : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no updates" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("flash_deals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deal: data });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { error } = await supabase.from("flash_deals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
