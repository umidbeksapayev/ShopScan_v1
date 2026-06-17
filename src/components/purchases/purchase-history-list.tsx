"use client";

import { useState } from "react";
import { Package, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Purchase } from "@/types/database";
import { cn, formatCurrency, formatWeight } from "@/lib/utils";
import { ProductThumb } from "@/components/products/product-thumb";

/** "2026-06-07T09:18:33Z" → "07.06 14:18" (Asia/Tashkent) */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
}

interface PurchaseHistoryListProps {
  purchases: Purchase[];
  loading?: boolean;
}

export function PurchaseHistoryList({ purchases, loading }: PurchaseHistoryListProps) {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Package className="h-9 w-9 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("purchases.noPurchases")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {purchases.map((p) => {
        const isOpen = openId === p.id;
        return (
          <li key={p.id} className="overflow-hidden rounded-lg border">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : p.id)}
              className="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-accent"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.supplier?.name ?? t("purchases.noSupplier")}
                </p>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatTime(p.created_at)}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(p.total)}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen && (
              <ul className="divide-y border-t bg-muted/30">
                {(p.items ?? []).map((it) => {
                  const qtyLabel =
                    it.product?.sale_type === "weight"
                      ? formatWeight(it.quantity)
                      : `${it.quantity} ${t("common.pcs")}`;
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
                          {qtyLabel} × {formatCurrency(it.cost_price)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {formatCurrency(it.quantity * it.cost_price)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
