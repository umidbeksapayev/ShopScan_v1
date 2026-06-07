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
}

export function useProcessCartSale() {
  const qc = useQueryClient();
  return useMutation<CartSaleResult, Error, ProcessSaleArgs>({
    mutationFn: ({ shopId, items, method }) =>
      processCartSale(shopId, items, method),
    onSuccess: () => {
      // Inventar va dashboard ma'lumotlari o'zgardi
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
