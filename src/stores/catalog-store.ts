import { create } from "zustand";
import type { SaleType } from "@/types/database";

export type SortField = "created_at" | "name" | "selling_price" | "quantity";
export type SortDir = "asc" | "desc";
export type ViewMode = "grid" | "list";

interface CatalogState {
  search: string;
  saleType: SaleType | "all";
  sortBy: SortField;
  sortDir: SortDir;
  viewMode: ViewMode;
  setSearch: (v: string) => void;
  setSaleType: (v: SaleType | "all") => void;
  setSort: (by: SortField, dir: SortDir) => void;
  setViewMode: (v: ViewMode) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  search: "",
  saleType: "all",
  sortBy: "created_at",
  sortDir: "desc",
  viewMode: "grid",
  setSearch: (search) => set({ search }),
  setSaleType: (saleType) => set({ saleType }),
  setSort: (sortBy, sortDir) => set({ sortBy, sortDir }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
