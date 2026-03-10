"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: "admin" | "manager" | "viewer";
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfile(profile as Profile);
        } else {
          // Profile missing — auto-create via API fallback
          try {
            const res = await fetch("/api/profile/ensure", { method: "POST" });
            if (res.ok) {
              const { profile: created } = await res.json();
              if (created) {
                setProfile(created as Profile);
              }
            }
          } catch {
            // Silently fallback — user will appear as viewer
          }
        }
      }

      setIsLoading(false);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, isLoading };
}
