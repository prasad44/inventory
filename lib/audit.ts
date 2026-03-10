import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  params: {
    userId: string;
    action: "created" | "updated" | "deleted";
    entityType: string;
    entityId: string;
    changes?: Record<string, unknown> | null;
  }
) {
  await supabase.from("audit_log").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    changes: params.changes ?? null,
  });
}
