"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyMemberships, canDo, type Membership } from "@/lib/membership";
import { useActiveShop } from "@/stores/active-shop";
import type { PermissionKey } from "@/types/database";

/** Joriy foydalanuvchining barcha a'zoliklari (do'konlar ro'yxati). */
export function useMemberships() {
  return useQuery({
    queryKey: ["memberships"],
    queryFn: getMyMemberships,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Faol a'zolik (tanlangan do'kon + rol + ruxsatlar). Bir nechta do'kon bo'lsa,
 * foydalanuvchi tanlagani (localStorage), aks holda eng yangisi.
 */
export function useMembership() {
  const q = useMemberships();
  const activeShopId = useActiveShop((s) => s.activeShopId);
  const list: Membership[] = q.data ?? [];
  const active =
    list.find((m) => m.shop.id === activeShopId) ?? list[0] ?? null;
  return { ...q, data: active };
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
