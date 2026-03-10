import { withAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { validateCategory } from "@/lib/validators";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_request, { supabase }) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withAuth(async (request, { user, supabase }) => {
  const body = await request.json();
  const errors = validateCategory(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: body.name,
      description: body.description || null,
      parent_id: body.parent_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "created",
    entityType: "category",
    entityId: data.id,
    changes: data,
  });

  return NextResponse.json({ data }, { status: 201 });
}, "manager");

export const PUT = withAuth(async (request, { user, supabase }) => {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }
  const errors = validateCategory(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  const { data: old } = await supabase
    .from("categories")
    .select("*")
    .eq("id", body.id)
    .single();

  const { data, error } = await supabase
    .from("categories")
    .update({
      name: body.name,
      description: body.description || null,
      parent_id: body.parent_id || null,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "updated",
    entityType: "category",
    entityId: data.id,
    changes: { before: old, after: data },
  });

  return NextResponse.json({ data });
}, "manager");

export const DELETE = withAuth(async (request, { user, supabase }) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { data: old } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "deleted",
    entityType: "category",
    entityId: id,
    changes: old,
  });

  return NextResponse.json({ success: true });
}, "manager");
