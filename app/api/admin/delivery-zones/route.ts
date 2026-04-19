import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { data, error } = await supabase.from("delivery_zones").select("*").order("city");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ zones: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.city || !body?.district) {
    return NextResponse.json({ error: "city and district required" }, { status: 400 });
  }
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { data, error } = await supabase
    .from("delivery_zones")
    .insert({
      city: String(body.city).trim(),
      district: String(body.district).trim(),
      est_min_days: Number(body.est_min_days ?? 1),
      est_max_days: Number(body.est_max_days ?? 3),
      delivery_fee: Number(body.delivery_fee ?? 0),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ zone: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updates: Record<string, unknown> = {};
  if (typeof body.city === "string") updates.city = body.city.trim();
  if (typeof body.district === "string") updates.district = body.district.trim();
  if (body.est_min_days != null && Number.isFinite(Number(body.est_min_days))) {
    updates.est_min_days = Number(body.est_min_days);
  }
  if (body.est_max_days != null && Number.isFinite(Number(body.est_max_days))) {
    updates.est_max_days = Number(body.est_max_days);
  }
  if (body.delivery_fee != null && Number.isFinite(Number(body.delivery_fee))) {
    updates.delivery_fee = Number(body.delivery_fee);
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no updates" }, { status: 400 });
  }
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { data, error } = await supabase
    .from("delivery_zones")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ zone: data });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
