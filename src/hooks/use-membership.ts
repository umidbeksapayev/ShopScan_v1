"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyMembership, canDo } from "@/lib/membership";
import type { PermissionKey } from "@/types/database";

/** Joriy foydalanuvchining a'zoligi (do'kon + rol + ruxsatlar). Keshlangan. */
export function useMembership() {
  return useQuery({
    queryKey: ["membership"],
    queryFn: getMyMembership,
    staleTime: 5 * 60 * 1000,
  });
}

/** Joriy foydalanuvchida ruxsat bormi (ega → har doim true). */
export function usePermission(perm: PermissionKey): boolean {
  const { data } = useMembership();
  return canDo(data?.role, data?.permissions, perm);
}

export function useIsOwner(): boolean {
  const { data } = useMembership();
  return data?.role === "owner";
}
