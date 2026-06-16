"use client";

import Link from "next/link";
import { ProductThumb } from "@/components/products/product-thumb";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types/database";
import { formatWeight } from "@/lib/utils";

interface LowStockListProps {
  products: Product[];
  loading?: boolean;
}

export function LowStockList({ products, loading }: LowStockListProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="text-sm text-muted-foreground">{t("dashboard.allStocked")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {products.map((p) => {
        const isOut = p.quantity <= 0;
        const qtyLabel =
          p.sale_type === "weight" ? formatWeight(p.quantity) : `${p.quantity} ${t("common.pcs")}`;
        return (
          <li key={p.id}>
            <Link
              href="/catalog"
              className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                <ProductThumb src={p.image_url} alt={p.name} sizes="40px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{t("dashboard.remaining")}: {qtyLabel}</p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOut
                    ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                {isOut ? t("dashboard.out") : t("dashboard.low")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
