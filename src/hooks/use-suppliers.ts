"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listSuppliers,
  createSupplier,
  type CreateSupplierInput,
} from "@/lib/suppliers";

export function useSuppliers(shopId: string | undefined) {
  return useQuery({
    queryKey: ["suppliers", shopId],
    queryFn: () => listSuppliers(shopId!),
    enabled: !!shopId,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupplierInput) => createSupplier(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
