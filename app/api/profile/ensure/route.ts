import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_ROLES = ["admin", "manager", "viewer"] as const;

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ profile: existing });
  }

  // Create profile from user_metadata
  const meta = user.user_metadata ?? {};
  let role = meta.role ?? "viewer";
  if (!VALID_ROLES.includes(role)) {
    role = "viewer";
  }

  const { data: profile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: meta.full_name ?? meta.name ?? "",
      avatar_url: meta.avatar_url ?? meta.picture ?? "",
      role,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile });
}
