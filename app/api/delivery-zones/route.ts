import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("delivery_zones").select("*").order("city");
  return NextResponse.json({ zones: data ?? [] });
}
