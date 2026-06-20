"use client";

import {
  Pencil,
  Archive,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Tag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types/database";
import { cn, formatCurrency, formatWeight } from "@/lib/utils";
import { useCatalogStore, type SortField } from "@/stores/catalog-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/products/product-thumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TFn = (key: string) => string;

interface ProductTableProps {
  products: Product[];
  onEdit: (p: Product) => void;
  onArchive: (p: Product) => void;
  onPrintLabel: (p: Product) => void;
}

/** Qoldiq holati (cost_price BU YERDA hech qachon ko'rsatilmaydi). */
function stockStatus(
  p: Product,
  t: TFn
): { label: string; variant: "success" | "warning" | "destructive" } {
  if (p.quantity <= 0) return { label: t("catalog.statusOut"), variant: "destructive" };
  if (p.quantity <= p.low_stock_alert)
    return { label: t("catalog.statusLow"), variant: "warning" };
  return { label: t("catalog.statusOk"), variant: "success" };
}

function qtyText(p: Product, t: TFn): string {
  return p.sale_type === "weight"
    ? formatWeight(p.quantity)
    : `${p.quantity} ${t("common.pcs")}`;
}

function unitShort(p: Product, t: TFn): string {
  return p.sale_type === "weight" ? t("common.kg") : t("common.pcs");
}

/** Desktop jadvalida saralanadigan ustun sarlavhasi. */
function SortHeader({
  field,
  label,
  align = "left",
}: {
  field: SortField;
  label: string;
  align?: "left" | "right";
}) {
  const { sortBy, sortDir, setSort } = useCatalogStore();
  const active = sortBy === field;
  const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => setSort(field, active && sortDir === "asc" ? "desc" : "asc")}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "group inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground",
        active && "text-foreground",
        align === "right" && "flex-row-reverse"
      )}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-40")} />
    </button>
  );
}

/** Mahsulot amallari (tahrirlash/arxivlash) — mobil dropdown. */
function RowMenu({
  product,
  onEdit,
  onArchive,
  onPrintLabel,
  t,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onArchive: (p: Product) => void;
  onPrintLabel: (p: Product) => void;
  t: TFn;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("catalog.actions")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(product)}>
          <Pencil className="mr-2 h-4 w-4" /> {t("catalog.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPrintLabel(product)}>
          <Tag className="mr-2 h-4 w-4" /> {t("labels.action")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onArchive(product)}
          className="text-destructive focus:text-destructive"
        >
          <Archive className="mr-2 h-4 w-4" /> {t("catalog.archive")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductTable({
  products,
  onEdit,
  onArchive,
  onPrintLabel,
}: ProductTableProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* ===== Mobil: app-uslub ixcham ro'yxat (telefon ustuvor) ===== */}
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border bg-card shadow-soft lg:hidden">
        {products.map((p) => {
          const status = stockStatus(p, t);
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 transition-colors active:bg-accent"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                <ProductThumb src={p.image_url} alt={p.name} sizes="56px" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.category?.name ?? t("catalog.noCategory")}
                </p>
                <Badge variant={status.variant} className="mt-1 text-[10px]">
                  {status.label} · {qtyText(p, t)}
                </Badge>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <div className="text-right">
                  <p className="font-bold tabular-nums text-foreground">
                    {formatCurrency(p.selling_price)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    / {unitShort(p, t)}
                  </p>
                </div>
                <RowMenu
                  product={p}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onPrintLabel={onPrintLabel}
                  t={t}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* ===== Desktop: to'liq saralanadigan jadval ===== */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-soft lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="w-16 px-4 py-3">{t("catalog.colImage")}</th>
              <th className="px-4 py-3">
                <SortHeader field="name" label={t("catalog.colName")} />
              </th>
              <th className="px-4 py-3 text-right">
                <SortHeader field="selling_price" label={t("catalog.colPrice")} align="right" />
              </th>
              <th className="px-4 py-3 text-right">
                <SortHeader field="quantity" label={t("catalog.colStock")} align="right" />
              </th>
              <th className="px-4 py-3">{t("catalog.colCategory")}</th>
              <th className="px-4 py-3">{t("catalog.colStatus")}</th>
              <th className="w-24 px-4 py-3 text-right">{t("catalog.colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const status = stockStatus(p, t);
              return (
                <tr key={p.id} className="group transition-colors hover:bg-accent/40">
                  <td className="px-4 py-2.5">
                    <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-muted">
                      <ProductThumb src={p.image_url} alt={p.name} sizes="44px" />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                    {formatCurrency(p.selling_price)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      / {unitShort(p, t)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                    {qtyText(p, t)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(p)}
                        aria-label={t("catalog.edit")}
                        title={t("catalog.edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onPrintLabel(p)}
                        aria-label={t("labels.action")}
                        title={t("labels.action")}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onArchive(p)}
                        aria-label={t("catalog.archive")}
                        title={t("catalog.archive")}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
