"use client";

import { Search, LayoutGrid, List, Hash, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCatalogStore, type SortField, type SortDir } from "@/stores/catalog-store";
import { useCategories } from "@/hooks/use-categories";
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
  const { t } = useTranslation();
  const {
    search,
    saleType,
    categoryId,
    sortBy,
    sortDir,
    viewMode,
    setSearch,
    setSaleType,
    setCategoryId,
    setSort,
    setViewMode,
  } = useCatalogStore();
  const { data: categories } = useCategories();

  return (
    <div className="space-y-3">
      {/* Qidiruv */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
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
            <SelectItem value="all">{t("catalog.allTypes")}</SelectItem>
            <SelectItem value="unit">
              <span className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5" /> {t("catalog.unit")}
              </span>
            </SelectItem>
            <SelectItem value="weight">
              <span className="flex items-center gap-2">
                <Scale className="h-3.5 w-3.5" /> {t("catalog.weight")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Kategoriya filtri */}
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("catalog.allCategories")}</SelectItem>
            <SelectItem value="none">{t("catalog.noCategory")}</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
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
            <SelectItem value="created_at:desc">{t("catalog.sortNewest")}</SelectItem>
            <SelectItem value="name:asc">{t("catalog.sortNameAsc")}</SelectItem>
            <SelectItem value="selling_price:asc">{t("catalog.sortPriceAsc")}</SelectItem>
            <SelectItem value="selling_price:desc">{t("catalog.sortPriceDesc")}</SelectItem>
            <SelectItem value="quantity:asc">{t("catalog.sortQtyAsc")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Ko'rinish rejimi */}
        <div className="ml-auto flex rounded-md border">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-l-md p-2",
              viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            aria-label={t("catalog.gridView")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-r-md p-2",
              viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            aria-label={t("catalog.listView")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
