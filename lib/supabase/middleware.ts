import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin-area page prefixes that require an authenticated user.
 * All other routes (shop pages, public APIs) are served to guests.
 * API routes enforce their own authorization via Supabase RLS.
 */
const ADMIN_PAGE_PREFIXES = [
  "/brands",
  "/dashboard",
  "/delivery-zones",
  "/flash-deals",
  "/inventory",
  "/orders", // admin orders list (customer confirmation is at /order/[id])
  "/pos",
  "/reviews",
  "/settings",
  "/suppliers",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminPage = ADMIN_PAGE_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && isAdminPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If a logged-in user visits /login, send them to the dashboard
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
