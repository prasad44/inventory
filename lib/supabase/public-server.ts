import { createClient } from "@supabase/supabase-js";

/**
 * Lightweight Supabase client for PUBLIC server-side reads.
 *
 * Use this from React Server Components that read public data (products,
 * categories, brands, flash deals, reviews, etc.). It does NOT thread
 * cookies / session through the @supabase/ssr cookie adapter, which has
 * been observed to hang RSC renders on Vercel.
 *
 * If you need the authenticated user's session server-side, keep using
 * `@/lib/supabase/server` (createClient there wires cookies for SSR auth).
 */
export function createPublicServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
