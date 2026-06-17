"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listShopMembers,
  addShopMember,
  removeShopMember,
  setMemberPermissions,
} from "@/lib/membership";
import type { MemberPermissions } from "@/types/database";

export function useStaff(shopId: string | undefined) {
  return useQuery({
    queryKey: ["staff", shopId],
    queryFn: () => listShopMembers(shopId!),
    enabled: !!shopId,
  });
}

export function useAddStaff(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => addShopMember(shopId, email, "cashier"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useRemoveStaff(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeShopMember(shopId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useSetPermissions(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { userId: string; permissions: MemberPermissions }) =>
      setMemberPermissions(shopId, args.userId, args.permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}
