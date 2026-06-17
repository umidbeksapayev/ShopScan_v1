import { create } from "zustand";
import type { SaleType } from "@/types/database";

export type SortField = "created_at" | "name" | "selling_price" | "quantity";
export type SortDir = "asc" | "desc";
export type ViewMode = "grid" | "list";

/** Kategoriya filtri: kategoriya id, "all" (barchasi) yoki "none" (kategoriyasiz). */
export type CategoryFilter = string | "all" | "none";

interface CatalogState {
  search: string;
  saleType: SaleType | "all";
  categoryId: CategoryFilter;
  sortBy: SortField;
  sortDir: SortDir;
  viewMode: ViewMode;
  setSearch: (v: string) => void;
  setSaleType: (v: SaleType | "all") => void;
  setCategoryId: (v: CategoryFilter) => void;
  setSort: (by: SortField, dir: SortDir) => void;
  setViewMode: (v: ViewMode) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  search: "",
  saleType: "all",
  categoryId: "all",
  sortBy: "created_at",
  sortDir: "desc",
  viewMode: "grid",
  setSearch: (search) => set({ search }),
  setSaleType: (saleType) => set({ saleType }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setSort: (sortBy, sortDir) => set({ sortBy, sortDir }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
