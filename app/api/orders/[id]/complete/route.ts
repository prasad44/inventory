import { withAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_request, { user, supabase, params }) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  // Call the RPC function for transactional stock update
  const { data, error } = await supabase.rpc("complete_order", {
    p_order_id: id,
    p_user_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The RPC returns a JSON object with either { success: true } or { error: "..." }
  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}, "manager");
