import { withAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_request, { supabase }) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}, "admin");

export const PUT = withAuth(async (request, { user, supabase }) => {
  const body = await request.json();

  if (!body.id || !body.role) {
    return NextResponse.json({ error: "ID and role are required" }, { status: 400 });
  }

  if (!["admin", "manager", "viewer"].includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent self-demotion
  if (body.id === user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const { data: old } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", body.id)
    .single();

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: body.role })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, {
    userId: user.id,
    action: "updated",
    entityType: "profile",
    entityId: body.id,
    changes: { before: { role: old?.role }, after: { role: body.role } },
  });

  return NextResponse.json({ data });
}, "admin");
