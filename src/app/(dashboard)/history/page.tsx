"use client";

import { useTranslation } from "react-i18next";
import { useShop } from "@/hooks/use-shop";
import { useSalesHistory } from "@/hooks/use-dashboard";
import { SalesHistoryList } from "@/components/dashboard/sales-history-list";
import { formatCurrency } from "@/lib/utils";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const { data: sales, isLoading } = useSalesHistory(shop?.id, 50);

  const total = (sales ?? []).reduce((sum, s) => sum + s.total_revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t("history.title")}</h1>
        {sales && sales.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {t("history.recentSales", { count: sales.length })} •{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrency(total)}
            </span>
          </p>
        )}
      </div>

      <SalesHistoryList sales={sales ?? []} loading={isLoading} />
    </div>
  );
}
