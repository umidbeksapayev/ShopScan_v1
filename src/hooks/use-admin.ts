"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminOverview, getAdminShops, setAdminPlan } from "@/lib/admin";

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
    staleTime: 30_000,
  });
}

export function useAdminShops() {
  return useQuery({
    queryKey: ["admin", "shops"],
    queryFn: getAdminShops,
    staleTime: 30_000,
  });
}

export function useSetAdminPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setAdminPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "shops"] });
    },
  });
}
