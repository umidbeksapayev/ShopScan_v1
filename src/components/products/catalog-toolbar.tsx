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
          <SelectTrigger className="min-w-[118px] flex-1 sm:w-[130px] sm:flex-none">
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
          <SelectTrigger className="min-w-[136px] flex-1 sm:w-[150px] sm:flex-none">
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
          <SelectTrigger className="min-w-[148px] flex-1 sm:w-[170px] sm:flex-none">
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

        {/* Ko'rinish rejimi — segmented control */}
        <div className="ml-auto flex shrink-0 rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={cn(
              "flex h-9 w-10 items-center justify-center rounded-md transition-all",
              viewMode === "list"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={t("catalog.listView")}
            title={t("catalog.listView")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            className={cn(
              "flex h-9 w-10 items-center justify-center rounded-md transition-all",
              viewMode === "grid"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={t("catalog.gridView")}
            title={t("catalog.gridView")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
