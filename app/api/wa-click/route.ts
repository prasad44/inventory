import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body?.product_id;
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sid = (await cookies()).get("rv_sid")?.value ?? null;

  // Fire-and-forget insert; tolerate errors silently
  await supabase.from("wa_clicks").insert({
    product_id: productId,
    session_id: sid,
    user_id: user?.id ?? null,
  });

  return NextResponse.json({ ok: true });
}
