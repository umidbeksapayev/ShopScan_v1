"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMembership, usePermission } from "@/hooks/use-membership";
import type { PermissionKey } from "@/types/database";

/**
 * Sahifani ruxsat bo'yicha himoyalaydi. Ruxsat bo'lmasa /sell ga yo'naltiradi.
 * `checking` — a'zolik hali yuklanmoqda yoki ruxsat yo'q (kontentni ko'rsatmang).
 */
export function usePermissionGuard(perm: PermissionKey) {
  const router = useRouter();
  const { data, isLoading } = useMembership();
  const allowed = usePermission(perm);

  useEffect(() => {
    if (!isLoading && data && !allowed) {
      router.replace("/sell");
    }
  }, [isLoading, data, allowed, router]);

  return { allowed, checking: isLoading || !data || !allowed };
}

/** Faqat ega kira oladigan sahifalar uchun (Sozlamalar, Xodimlar). */
export function useOwnerGuard() {
  const router = useRouter();
  const { data, isLoading } = useMembership();
  const isOwner = data?.role === "owner";

  useEffect(() => {
    if (!isLoading && data && !isOwner) {
      router.replace("/sell");
    }
  }, [isLoading, data, isOwner, router]);

  return { isOwner, checking: isLoading || !data || !isOwner };
}
