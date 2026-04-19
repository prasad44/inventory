import { withAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { validateProduct } from "@/lib/validators";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_request, { supabase, params }) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), supplier:suppliers(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
});

export const PUT = withAuth(async (request, { user, supabase, params }) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const errors = validateProduct(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  const { data: old } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  // Derive slug if missing
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : old?.slug || slugify(String(body.name || ""));

  const { data, error } = await supabase
    .from("products")
    .update({
      name: body.name,
      description: body.description || null,
      sku: body.sku,
      barcode: body.barcode || null,
      category_id: body.category_id || null,
      price: body.price || 0,
      cost_price: body.cost_price || 0,
      quantity_in_stock: body.quantity_in_stock ?? old?.quantity_in_stock ?? 0,
      reorder_point: body.reorder_point || 0,
      reorder_quantity: body.reorder_quantity || 0,
      supplier_id: body.supplier_id || null,
      image_url: body.image_url || null,
      status: body.status || "active",
      brand: body.brand || null,
      slug,
      discount_pct: Number(body.discount_pct) || 0,
      warranty_months: Number(body.warranty_months) || 0,
      is_genuine: body.is_genuine === undefined ? old?.is_genuine ?? true : !!body.is_genuine,
      images: Array.isArray(body.images) ? body.images : old?.images ?? [],
      specs: body.specs && typeof body.specs === "object" ? body.specs : old?.specs ?? {},
      meta_title: body.meta_title || null,
      meta_desc: body.meta_desc || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, category:categories(*), supplier:suppliers(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "updated",
    entityType: "product",
    entityId: id,
    changes: { before: old, after: data },
  });

  return NextResponse.json({ data });
}, "manager");

export const DELETE = withAuth(async (_request, { user, supabase, params }) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { data: old } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "deleted",
    entityType: "product",
    entityId: id,
    changes: old,
  });

  return NextResponse.json({ success: true });
}, "admin");
