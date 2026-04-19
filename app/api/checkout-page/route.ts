import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";

/**
 * Returns data needed to render the checkout page:
 * - delivery zones (public)
 * - logged-in user's email + full_name for prefill, if authenticated
 */
export async function GET() {
  // Zones from plain anon client (public)
  const anon = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: zones } = await anon
    .from("delivery_zones")
    .select("*")
    .order("city");

  // Session-aware client for current-user lookup
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  let prefillEmail: string | null = null;
  let prefillName: string | null = null;
  if (user) {
    prefillEmail = user.email ?? null;
    const { data: profile } = await session
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    prefillName = profile?.full_name ?? null;
  }

  return NextResponse.json({
    zones: zones ?? [],
    prefillEmail,
    prefillName,
  });
}
