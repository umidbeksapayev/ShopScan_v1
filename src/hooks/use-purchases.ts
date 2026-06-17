"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  processPurchase,
  getPurchases,
  type ProcessPurchaseInput,
} from "@/lib/purchases";

export function usePurchases(shopId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["purchases", shopId, limit],
    queryFn: () => getPurchases(shopId!, limit),
    enabled: !!shopId,
  });
}

export function useProcessPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProcessPurchaseInput) => processPurchase(input),
    onSuccess: () => {
      // Inventar + tan narx, kirim tarixi va dashboard (kam qoldiq) o'zgardi
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
