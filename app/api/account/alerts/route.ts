import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [stockRes, priceRes] = await Promise.all([
    supabase
      .from("stock_alerts")
      .select("id, product_id, email, created_at, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("price_alerts")
      .select("id, product_id, email, target_price, created_at, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (stockRes.error)
    return NextResponse.json({ error: stockRes.error.message }, { status: 500 });
  if (priceRes.error)
    return NextResponse.json({ error: priceRes.error.message }, { status: 500 });

  return NextResponse.json({
    stock: stockRes.data ?? [],
    price: priceRes.data ?? [],
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (type !== "stock" && type !== "price") {
    return NextResponse.json({ error: "type must be stock or price" }, { status: 400 });
  }

  const table = type === "stock" ? "stock_alerts" : "price_alerts";
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
