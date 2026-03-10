"use client";

import Link from "next/link";
import { CategoryList } from "@/components/categories/category-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { Users, FileText } from "lucide-react";

export default function SettingsPage() {
  const { profile } = useCurrentUser();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage categories and system settings</p>
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/settings/users">
            <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/settings/audit-log">
            <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View all system changes and activity</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      <CategoryList />
    </div>
  );
}
