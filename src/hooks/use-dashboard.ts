"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getSalesTrend,
  getTopProducts,
  getSlowProducts,
  getLowStockProducts,
  getSalesHistory,
} from "@/lib/dashboard";

export function useDashboardStats(shopId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", "stats", shopId],
    queryFn: () => getDashboardStats(shopId!),
    enabled: !!shopId,
    staleTime: 30_000,
  });
}

export function useSalesTrend(shopId: string | undefined, days = 7) {
  return useQuery({
    queryKey: ["dashboard", "trend", shopId, days],
    queryFn: () => getSalesTrend(shopId!, days),
    enabled: !!shopId,
    staleTime: 60_000,
  });
}

export function useTopProducts(shopId: string | undefined, days = 30, limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "top", shopId, days, limit],
    queryFn: () => getTopProducts(shopId!, days, limit),
    enabled: !!shopId,
    staleTime: 60_000,
  });
}

export function useSlowProducts(shopId: string | undefined, days = 30, limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "slow", shopId, days, limit],
    queryFn: () => getSlowProducts(shopId!, days, limit),
    enabled: !!shopId,
    staleTime: 60_000,
  });
}

export function useLowStockProducts(shopId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", "low-stock", shopId],
    queryFn: () => getLowStockProducts(),
    enabled: !!shopId,
    staleTime: 30_000,
  });
}

export function useSalesHistory(shopId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["sales", "history", shopId, limit],
    queryFn: () => getSalesHistory(shopId!, limit),
    enabled: !!shopId,
    staleTime: 15_000,
  });
}
