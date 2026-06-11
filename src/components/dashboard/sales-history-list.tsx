"use client";

import Image from "next/image";
import { Barcode, Sparkles, Search, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Sale, SearchMethod } from "@/types/database";
import { formatCurrency, formatWeight } from "@/lib/utils";

interface SalesHistoryListProps {
  sales: Sale[];
  loading?: boolean;
}

const methodMeta: Record<SearchMethod, { labelKey: string; icon: typeof Barcode; cls: string }> = {
  barcode: { labelKey: "history.methodBarcode", icon: Barcode, cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  visual: { labelKey: "history.methodVisual", icon: Sparkles, cls: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" },
  manual: { labelKey: "history.methodManual", icon: Search, cls: "bg-muted text-muted-foreground" },
};

/** "2026-06-07T09:18:33Z" → "07.06 14:18" (Asia/Tashkent) */
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
}

export function SalesHistoryList({ sales, loading }: SalesHistoryListProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Receipt className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("history.noSales")}</p>
        <p className="text-xs text-muted-foreground">{t("history.noSalesDesc")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {sales.map((s) => {
        const meta = methodMeta[s.search_method];
        const MethodIcon = meta.icon;
        const qtyLabel =
          s.sale_type === "weight"
            ? formatWeight(s.quantity_sold)
            : `${s.quantity_sold} ${t("common.pcs")}`;
        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-lg border p-2.5"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
              {s.product?.image_url ? (
                <Image
                  src={s.product.image_url}
                  alt={s.product.name ?? ""}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">
                {s.product?.name ?? "—"}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">{qtyLabel}</span>
                <span>•</span>
                <span className="tabular-nums">{formatTime(s.sold_at)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(s.total_revenue)}
              </p>
              <span
                className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}
              >
                <MethodIcon className="h-2.5 w-2.5" />
                {t(meta.labelKey)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
