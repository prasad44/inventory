import { withAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { validateProduct } from "@/lib/validators";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const supplier = searchParams.get("supplier");
  const status = searchParams.get("status");
  const stockFilter = searchParams.get("stock"); // "low" | "out"
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  let query = supabase
    .from("products")
    .select("*, category:categories(*), supplier:suppliers(*)", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq("category_id", category);
  }
  if (supplier) {
    query = query.eq("supplier_id", supplier);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (stockFilter === "low") {
    query = query.gt("quantity_in_stock", 0);
  }
  if (stockFilter === "out") {
    query = query.eq("quantity_in_stock", 0);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Client-side filter for low stock (column comparison)
  let filtered = data;
  if (stockFilter === "low" && data) {
    filtered = data.filter(
      (p: { quantity_in_stock: number; reorder_point: number }) =>
        p.quantity_in_stock <= p.reorder_point
    );
  }

  return NextResponse.json({
    data: filtered,
    count: stockFilter === "low" ? filtered?.length ?? 0 : count,
    page,
    pageSize,
  });
}

export const POST = withAuth(async (request, { user, supabase }) => {
  const body = await request.json();
  const errors = validateProduct(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  // Derive slug if missing
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : slugify(String(body.name || ""));

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      description: body.description || null,
      sku: body.sku,
      barcode: body.barcode || null,
      category_id: body.category_id || null,
      price: body.price || 0,
      cost_price: body.cost_price || 0,
      quantity_in_stock: body.quantity_in_stock || 0,
      reorder_point: body.reorder_point || 0,
      reorder_quantity: body.reorder_quantity || 0,
      supplier_id: body.supplier_id || null,
      image_url: body.image_url || null,
      status: body.status || "active",
      brand: body.brand || null,
      slug,
      discount_pct: Number(body.discount_pct) || 0,
      warranty_months: Number(body.warranty_months) || 0,
      is_genuine: body.is_genuine === undefined ? true : !!body.is_genuine,
      images: Array.isArray(body.images) ? body.images : [],
      specs: body.specs && typeof body.specs === "object" ? body.specs : {},
      meta_title: body.meta_title || null,
      meta_desc: body.meta_desc || null,
    })
    .select("*, category:categories(*), supplier:suppliers(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "created",
    entityType: "product",
    entityId: data.id,
    changes: data,
  });

  return NextResponse.json({ data }, { status: 201 });
}, "manager");
