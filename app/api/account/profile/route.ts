import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email ?? null,
      full_name: data?.full_name ?? "",
      avatar_url: data?.avatar_url ?? "",
      role: data?.role ?? "viewer",
    },
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.full_name === "string") patch.full_name = body.full_name.trim().slice(0, 120);
  if (typeof body.avatar_url === "string") patch.avatar_url = body.avatar_url.trim().slice(0, 500);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("id, full_name, avatar_url, role")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email ?? null,
      full_name: data?.full_name ?? "",
      avatar_url: data?.avatar_url ?? "",
      role: data?.role ?? "viewer",
    },
  });
}
