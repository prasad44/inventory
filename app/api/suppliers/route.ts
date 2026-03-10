import { withAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { validateSupplier } from "@/lib/validators";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabase.from("suppliers").select("*").order("name");

  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withAuth(async (request, { user, supabase }) => {
  const body = await request.json();
  const errors = validateSupplier(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: body.name,
      contact_name: body.contact_name || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "created",
    entityType: "supplier",
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
  const errors = validateSupplier(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  const { data: old } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", body.id)
    .single();

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: body.name,
      contact_name: body.contact_name || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      notes: body.notes || null,
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
    entityType: "supplier",
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
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("suppliers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "deleted",
    entityType: "supplier",
    entityId: id,
    changes: old,
  });

  return NextResponse.json({ success: true });
}, "manager");
