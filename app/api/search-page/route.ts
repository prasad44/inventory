import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Returns the available-brands list derived from products that match q.
 * Used by the client /search page to populate the filter rail.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ availableBrands: [] });
  }
  const supabase = client();
  const like = `%${q}%`;
  const { data } = await supabase
    .from("products")
    .select("brand")
    .eq("status", "active")
    .or(`name.ilike.${like},brand.ilike.${like}`)
    .not("brand", "is", null)
    .limit(200);

  const availableBrands = Array.from(
    new Set(
      (data ?? [])
        .map((r) => (r as { brand: string | null }).brand)
        .filter((b): b is string => !!b)
    )
  ).sort();

  return NextResponse.json({ availableBrands });
}
