import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const VALID_ROLES = ["admin", "manager", "viewer"];

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  const { email, password, full_name, role } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const validRole = VALID_ROLES.includes(role) ? role : "viewer";

  // Use admin client with service_role key to create a pre-confirmed user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name ?? "",
      role: validRole,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
