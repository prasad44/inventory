import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth-guard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createClient();
  const gate = await requireRole(supabase, "manager");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
