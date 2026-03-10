"use client";

import { AuditLogTable } from "@/components/audit/audit-log-table";

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">View all system changes (Admin only)</p>
      </div>
      <AuditLogTable />
    </div>
  );
}
