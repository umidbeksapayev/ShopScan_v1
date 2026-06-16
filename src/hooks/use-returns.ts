"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  processReturn,
  getReturnedQuantities,
  type ProcessReturnInput,
} from "@/lib/returns";

/** Sotuv bo'yicha allaqachon qaytarilgan miqdorlar (return dialog limiti uchun). */
export function useReturnedQuantities(saleId: string | undefined) {
  return useQuery({
    queryKey: ["returns", "qty", saleId],
    queryFn: () => getReturnedQuantities(saleId!),
    enabled: !!saleId,
  });
}

export function useProcessReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProcessReturnInput) => processReturn(input),
    onSuccess: () => {
      // Inventar tiklandi, sotuv/hisobot net qiymatlari va qaytarish holati o'zgardi
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["returns"] });
    },
  });
}
