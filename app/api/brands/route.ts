import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, is_featured, sort_order, description, logo_url, created_at")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const slug =
    typeof body?.slug === "string" && body.slug.trim()
      ? body.slug.trim().toLowerCase()
      : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const insert: Record<string, unknown> = { name, slug };
  if (typeof body?.description === "string") insert.description = body.description.trim();
  if (typeof body?.logo_url === "string") insert.logo_url = body.logo_url;
  if (typeof body?.is_featured === "boolean") insert.is_featured = body.is_featured;
  if (typeof body?.sort_order === "number") insert.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from("brands")
    .insert(insert)
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      // Brand already exists by slug — return existing
      const { data: existing } = await supabase.from("brands").select().eq("slug", slug).maybeSingle();
      return NextResponse.json({ brand: existing });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brand: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.description === "string") updates.description = body.description.trim();
  if (typeof body.logo_url === "string" || body.logo_url === null) updates.logo_url = body.logo_url;
  if (typeof body.is_featured === "boolean") updates.is_featured = body.is_featured;
  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order;
  if (typeof body.slug === "string") updates.slug = body.slug.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brands")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brand: data });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
