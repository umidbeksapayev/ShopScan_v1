"use client";

import { useState } from "react";
import { Barcode, Search, Receipt as ReceiptIcon, ChevronDown, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Sale, SearchMethod } from "@/types/database";
import { cn, formatCurrency, formatWeight } from "@/lib/utils";
import { ProductThumb } from "@/components/products/product-thumb";
import { Button } from "@/components/ui/button";

interface SalesHistoryListProps {
  sales: Sale[];
  loading?: boolean;
  /** Berilsa, har bir sotuvda "Qaytarish" tugmasi ko'rinadi (tarix sahifasi). */
  onReturn?: (sale: Sale) => void;
}

const methodMeta: Record<SearchMethod, { labelKey: string; icon: typeof Barcode; cls: string }> = {
  barcode: { labelKey: "history.methodBarcode", icon: Barcode, cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  manual: { labelKey: "history.methodManual", icon: Search, cls: "bg-muted text-muted-foreground" },
  // Eski 'visual' yozuvlar uchun (endi ishlatilmaydi) — qo'lda kabi ko'rsatiladi
  visual: { labelKey: "history.methodManual", icon: Search, cls: "bg-muted text-muted-foreground" },
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

export function SalesHistoryList({ sales, loading, onReturn }: SalesHistoryListProps) {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);

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
        <ReceiptIcon className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("history.noSales")}</p>
        <p className="text-xs text-muted-foreground">{t("history.noSalesDesc")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {sales.map((s) => {
        const meta = methodMeta[s.search_method] ?? methodMeta.manual;
        const MethodIcon = meta.icon;
        const isOpen = openId === s.id;
        const refunded = (s.returns ?? []).reduce((sum, r) => sum + r.total_refund, 0);
        const hasReturns = refunded > 0;
        return (
          <li key={s.id} className="overflow-hidden rounded-lg border">
            {/* Sotuv sarlavhasi — bosilganda mahsulotlar ro'yxati ochiladi */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : s.id)}
              className="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-accent"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ReceiptIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {t("history.itemCount", { count: s.item_count })}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">{formatTime(s.sold_at)}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}
                  >
                    <MethodIcon className="h-2.5 w-2.5" />
                    {t(meta.labelKey)}
                  </span>
                  {hasReturns && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                      <Undo2 className="h-2.5 w-2.5" />
                      {t("returns.badge")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(s.total_revenue)}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </button>

            {/* Detal: sotuvdagi mahsulotlar + qaytarish */}
            {isOpen && (
              <div className="border-t bg-muted/30">
                <ul className="divide-y">
                  {(s.items ?? []).map((it) => {
                    const qtyLabel =
                      it.sale_type === "weight"
                        ? formatWeight(it.quantity_sold)
                        : `${it.quantity_sold} ${t("common.pcs")}`;
                    return (
                      <li key={it.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                          <ProductThumb
                            src={it.product?.image_url}
                            alt={it.product?.name ?? ""}
                            sizes="36px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm">{it.product?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {qtyLabel} × {formatCurrency(it.selling_price_snapshot)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium tabular-nums">
                          {formatCurrency(it.total_revenue)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {(hasReturns || onReturn) && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    {hasReturns ? (
                      <span className="text-xs text-muted-foreground">
                        {t("returns.refunded")}:{" "}
                        <span className="font-medium tabular-nums text-rose-600 dark:text-rose-400">
                          {formatCurrency(refunded)}
                        </span>
                      </span>
                    ) : (
                      <span />
                    )}
                    {onReturn && (
                      <Button variant="outline" size="sm" onClick={() => onReturn(s)}>
                        <Undo2 className="mr-1 h-3.5 w-3.5" /> {t("returns.action")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
