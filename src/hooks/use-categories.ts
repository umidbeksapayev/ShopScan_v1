"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
} from "@/lib/categories";
import { useShop } from "@/hooks/use-shop";

export function useCategories() {
  const { data: shop } = useShop();
  return useQuery({
    queryKey: ["categories", shop?.id],
    queryFn: () => listCategories(shop?.id),
    enabled: !!shop?.id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const { data: shop } = useShop();
  return useMutation({
    mutationFn: (name: string) => createCategory(shop!.id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useRenameCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameCategory(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      // Mahsulotlarning category_id NULL bo'ldi — katalogni ham yangilaymiz
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
