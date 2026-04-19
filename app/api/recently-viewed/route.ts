import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const COOKIE = "rv_sid";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

async function ensureSessionId(): Promise<string> {
  const store = await cookies();
  let sid = store.get(COOKIE)?.value;
  if (!sid) {
    sid = crypto.randomUUID();
    store.set(COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
  }
  return sid;
}

export async function GET() {
  const sid = await ensureSessionId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Prefer user_id when authenticated (cross-device history); else session_id
  let query = supabase
    .from("recently_viewed")
    .select("product_id, viewed_at, product:products(*)")
    .order("viewed_at", { ascending: false })
    .limit(20);

  if (user) {
    query = query.eq("user_id", user.id);
  } else {
    query = query.eq("session_id", sid);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Dedupe by product_id — keeps the most recent view of each product
  const seen = new Set<string>();
  const unique = (data ?? []).filter((r) => {
    if (seen.has(r.product_id)) return false;
    seen.add(r.product_id);
    return true;
  });

  return NextResponse.json({ items: unique });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body?.product_id;
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const sid = await ensureSessionId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Insert a fresh row (the prune trigger keeps only 20 most recent per session)
  const { error } = await supabase.from("recently_viewed").insert({
    session_id: sid,
    user_id: user?.id ?? null,
    product_id: productId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
