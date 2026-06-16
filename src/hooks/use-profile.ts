"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  role: "owner" | "super_admin";
}

/** Joriy foydalanuvchining roli (RBAC uchun). Keshlangan. */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) return null;
      return data as Profile;
    },
    staleTime: 5 * 60 * 1000,
  });
}
