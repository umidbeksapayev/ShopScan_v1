"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminOverview, getAdminShops } from "@/lib/admin";

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
