import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only run middleware on routes that actually need auth gating.
  // Admin pages are the only ones requiring session checks; everything else
  // is public or handles auth in the API handler itself. Keeping middleware
  // narrow avoids a class of Vercel function hangs on dynamic shop segments.
  matcher: [
    "/dashboard/:path*",
    "/inventory/:path*",
    "/orders/:path*",
    "/pos/:path*",
    "/settings/:path*",
    "/suppliers/:path*",
    "/brands/:path*",
    "/flash-deals/:path*",
    "/reviews/:path*",
    "/delivery-zones/:path*",
    "/login",
  ],
};
