import { withAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");

  let query = supabase
    .from("audit_log")
    .select("*, user:profiles(id, full_name)", { count: "exact" });

  if (entityType) query = query.eq("entity_type", entityType);
  if (action) query = query.eq("action", action);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, page, pageSize });
}, "admin");
