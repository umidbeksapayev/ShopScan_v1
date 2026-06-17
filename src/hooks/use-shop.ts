"use client";

import { useMembership } from "@/hooks/use-membership";

/**
 * Joriy foydalanuvchining do'koni (a'zolik orqali — ega yoki kassir).
 * `useMembership` keshidan olinadi (bitta so'rov).
 */
export function useShop() {
  const q = useMembership();
  return { ...q, data: q.data?.shop ?? null };
}
