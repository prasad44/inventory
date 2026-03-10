"use client";

import { UserTable } from "@/components/users/user-table";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions (Admin only)</p>
      </div>
      <UserTable />
    </div>
  );
}
