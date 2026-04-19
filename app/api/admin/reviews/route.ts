import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const status = new URL(req.url).searchParams.get("status");
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  let q = supabase
    .from("reviews")
    .select("*, product:products(id, name, slug), user:profiles(full_name)")
    .order("created_at", { ascending: false });
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    q = q.eq("status", status);
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  const status = body?.status;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
