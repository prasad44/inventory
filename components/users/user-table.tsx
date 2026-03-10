"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export function UserTable() {
  const [users, setUsers] = useState<Profile[]>([]);
  const { user: currentUser } = useCurrentUser();

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const json = await res.json();
    if (json.data) setUsers(json.data);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      toast.success("Role updated");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const initials = u.full_name
              ? u.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "?";
            const isSelf = u.id === currentUser?.id;

            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {u.full_name}
                        {isSelf && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {isSelf ? (
                    <Badge className="capitalize">{u.role}</Badge>
                  ) : (
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u.id, v)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
