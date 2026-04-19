import type { SupabaseClient } from "@supabase/supabase-js";

export type Role = "admin" | "manager" | "viewer";

const rank: Record<Role, number> = { viewer: 1, manager: 2, admin: 3 };

/**
 * Inline role gate for API handlers that use the existing
 * `createClient()`-based shape and don't want to adopt `withAuth()`.
 *
 * Returns a discriminated union so the caller can short-circuit with
 * `NextResponse.json({ error: gate.error }, { status: gate.status })`.
 */
export async function requireRole(
  supabase: SupabaseClient,
  minRole: Role
): Promise<
  | { ok: true; userId: string; role: Role }
  | { ok: false; status: number; error: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as Role | undefined) ?? "viewer";
  if (rank[role] < rank[minRole]) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, userId: user.id, role };
}
