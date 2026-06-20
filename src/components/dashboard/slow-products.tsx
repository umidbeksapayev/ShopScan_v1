"use client";

import { PackageX } from "lucide-react";
import { ProductThumb } from "@/components/products/product-thumb";
import { useTranslation } from "react-i18next";
import type { TopProduct } from "@/lib/dashboard";
import { formatCurrency, formatWeight } from "@/lib/utils";

interface SlowProductsProps {
  products: TopProduct[];
  loading?: boolean;
}

/** Eng kam sotilgan mahsulotlar (sotilmaganlar "Sotilmagan" badge bilan). */
export function SlowProducts({ products, loading }: SlowProductsProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <PackageX className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("dashboard.noProducts")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {products.map((p) => {
        const isUnsold = p.units_sold <= 0;
        const soldLabel =
          p.sale_type === "weight"
            ? formatWeight(p.units_sold)
            : `${p.units_sold} ${t("common.pcs")}`;
        return (
          <li key={p.product_id} className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
              <ProductThumb src={p.image_url} alt={p.name} sizes="40px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {isUnsold ? t("dashboard.notSold") : formatCurrency(p.revenue)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {isUnsold ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  {t("dashboard.notSold")}
                </span>
              ) : (
                <>
                  <p className="text-sm font-semibold tabular-nums">{soldLabel}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.sold")}</p>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
