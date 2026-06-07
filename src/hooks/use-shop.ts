"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Shop } from "@/types/database";

/**
 * Joriy foydalanuvchining do'konini qaytaradi (client-side, TanStack Query bilan keshlangan).
 */
export function useShop() {
  return useQuery({
    queryKey: ["shop"],
    queryFn: async (): Promise<Shop | null> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (error) return null;
      return data as Shop;
    },
    staleTime: 5 * 60 * 1000, // 5 daqiqa
  });
}
