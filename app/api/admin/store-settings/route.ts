import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    "wa_number",
    "bank_name",
    "bank_account_name",
    "bank_account_number",
    "bank_branch",
  ] as const;
  for (const f of fields) {
    const value = (body as Record<string, unknown>)[f];
    if (typeof value === "string" || value === null) {
      updates[f] = value;
    }
  }
  const fd = Number((body as Record<string, unknown>).free_delivery_threshold);
  if (Number.isFinite(fd) && fd >= 0) updates.free_delivery_threshold = fd;

  const { data, error } = await supabase
    .from("store_settings")
    .update(updates)
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
