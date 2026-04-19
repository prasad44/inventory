import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ error: "Service unavailable" }, { status: 500 });

  const { data } = await svc
    .from("orders")
    .select(
      "*, items:order_items(id, quantity, unit_price, discount_pct_snapshot, product:products(*))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: data });
}
