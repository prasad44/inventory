"use client";

import { useCurrentUser } from "./use-current-user";

export function useRole() {
  const { profile, isLoading } = useCurrentUser();

  const role = profile?.role ?? "viewer";

  return {
    role,
    isLoading,
    isAdmin: role === "admin",
    isManager: role === "manager" || role === "admin",
    canEdit: role === "manager" || role === "admin",
    canDelete: role === "admin",
  };
}
