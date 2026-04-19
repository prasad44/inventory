import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const COOKIE = "helpful_votes";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "review id required" }, { status: 400 });

  const store = await cookies();
  const raw = store.get(COOKIE)?.value ?? "";
  const voted = new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
  if (voted.has(id)) {
    return NextResponse.json({ ok: true, alreadyVoted: true });
  }

  const supabase = await createClient();
  // Read current count, then update (no atomic increment via PostgREST; race acceptable at MVP scale)
  const { data: review } = await supabase
    .from("reviews")
    .select("helpful_count")
    .eq("id", id)
    .maybeSingle();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("reviews")
    .update({ helpful_count: (review.helpful_count ?? 0) + 1 })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  voted.add(id);
  store.set(COOKIE, Array.from(voted).join(","), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
