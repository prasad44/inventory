import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export type Role = "admin" | "manager" | "viewer";

const roleHierarchy: Record<Role, number> = {
  admin: 3,
  manager: 2,
  viewer: 1,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: {
    user: { id: string; email: string };
    profile: { id: string; full_name: string; avatar_url: string; role: Role };
    supabase: Awaited<ReturnType<typeof createClient>>;
    params?: Record<string, string>;
  }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler, requiredRole: Role = "viewer") {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    let profile = existingProfile;

    // Auto-create profile from user_metadata if missing
    if (profileError || !profile) {
      const meta = user.user_metadata ?? {};
      let role = meta.role ?? "viewer";
      if (!["admin", "manager", "viewer"].includes(role)) {
        role = "viewer";
      }

      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: meta.full_name ?? meta.name ?? "",
          avatar_url: meta.avatar_url ?? meta.picture ?? "",
          role,
        })
        .select()
        .single();

      if (createError || !created) {
        return NextResponse.json({ error: "Profile not found and could not be created" }, { status: 401 });
      }

      profile = created;
    }

    if (!hasRole(profile.role as Role, requiredRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = context?.params ? await context.params : undefined;

    return handler(request, {
      user: { id: user.id, email: user.email! },
      profile: profile as { id: string; full_name: string; avatar_url: string; role: Role },
      supabase,
      params: resolvedParams,
    });
  };
}
