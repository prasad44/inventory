import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addresses: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const required = ["full_name", "phone", "line1", "city", "district"] as const;
  for (const k of required) {
    if (!body[k] || typeof body[k] !== "string" || body[k].trim() === "") {
      return NextResponse.json({ error: `${k} is required` }, { status: 400 });
    }
  }

  const isDefault = !!body.is_default;

  if (isDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      full_name: body.full_name,
      phone: body.phone,
      line1: body.line1,
      line2: body.line2 || null,
      city: body.city,
      district: body.district,
      postal_code: body.postal_code || null,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const k of ["full_name", "phone", "line1", "line2", "city", "district", "postal_code"]) {
    if (k in body) patch[k] = body[k] || null;
  }
  if ("is_default" in body) patch.is_default = !!body.is_default;

  if (patch.is_default === true) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .neq("id", body.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address: data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
