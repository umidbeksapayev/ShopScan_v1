"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  importProducts,
  type ProductFilters,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/products";
import type { ImportPayloadRow } from "@/lib/import-products";
import { useShop } from "@/hooks/use-shop";

export function useProducts(filters: ProductFilters) {
  const { data: shop } = useShop();
  return useQuery({
    queryKey: ["products", shop?.id, filters],
    queryFn: () => listProducts({ ...filters, shopId: shop?.id }),
    enabled: !!shop?.id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useImportProducts() {
  const qc = useQueryClient();
  const { data: shop } = useShop();
  return useMutation({
    mutationFn: (rows: ImportPayloadRow[]) => importProducts(shop!.id, rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
