"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import { useCatalogStore, type SortField, type SortDir } from "@/stores/catalog-store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CatalogToolbar() {
  const {
    search,
    saleType,
    sortBy,
    sortDir,
    viewMode,
    setSearch,
    setSaleType,
    setSort,
    setViewMode,
  } = useCatalogStore();

  return (
    <div className="space-y-3">
      {/* Qidiruv */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mahsulot nomi bo'yicha qidirish..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Tur filtri */}
        <Select value={saleType} onValueChange={(v) => setSaleType(v as typeof saleType)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            <SelectItem value="unit">🔢 Donali</SelectItem>
            <SelectItem value="weight">⚖️ Vazn</SelectItem>
          </SelectContent>
        </Select>

        {/* Tartiblash */}
        <Select
          value={`${sortBy}:${sortDir}`}
          onValueChange={(v) => {
            const [by, dir] = v.split(":") as [SortField, SortDir];
            setSort(by, dir);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at:desc">Eng yangi</SelectItem>
            <SelectItem value="name:asc">Nom (A→Z)</SelectItem>
            <SelectItem value="selling_price:asc">Narx (arzon)</SelectItem>
            <SelectItem value="selling_price:desc">Narx (qimmat)</SelectItem>
            <SelectItem value="quantity:asc">Qoldiq (kam)</SelectItem>
          </SelectContent>
        </Select>

        {/* Ko'rinish rejimi */}
        <div className="ml-auto flex rounded-md border">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-l-md p-2",
              viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-gray-500"
            )}
            aria-label="Grid ko'rinish"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-r-md p-2",
              viewMode === "list" ? "bg-accent text-accent-foreground" : "text-gray-500"
            )}
            aria-label="Ro'yxat ko'rinish"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
