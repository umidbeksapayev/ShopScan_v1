"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  processCartSale,
  type CartSaleItem,
  type CartSaleResult,
} from "@/lib/sales";
import type { SearchMethod } from "@/types/database";

interface ProcessSaleArgs {
  shopId: string;
  items: CartSaleItem[];
  method: SearchMethod;
  customerId?: string | null;
  paidAmount?: number | null;
}

export function useProcessCartSale() {
  const qc = useQueryClient();
  return useMutation<CartSaleResult, Error, ProcessSaleArgs>({
    mutationFn: ({ shopId, items, method, customerId, paidAmount }) =>
      processCartSale(shopId, items, method, { customerId, paidAmount }),
    onSuccess: () => {
      // Inventar, sotuv, dashboard va qarz balanslari o'zgardi
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
