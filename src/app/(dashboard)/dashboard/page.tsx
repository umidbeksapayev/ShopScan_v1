"use client";

import dynamic from "next/dynamic";
import { Wallet, TrendingUp, ShoppingCart, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShop } from "@/hooks/use-shop";
import {
  useDashboardStats,
  useSalesTrend,
  useLowStockProducts,
} from "@/hooks/use-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Recharts og'ir → grafik faqat kerak bo'lganda yuklanadi
const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-muted" />,
  }
);

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(shop?.id);
  const { data: trend, isLoading: trendLoading } = useSalesTrend(shop?.id, 7);
  const { data: lowStock, isLoading: lowLoading } = useLowStockProducts(shop?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
        {shop && <p className="text-sm text-muted-foreground">{shop.name}</p>}
      </div>

      {/* Statistika kartlari */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.todayRevenue")}
          value={formatCurrency(stats?.today_revenue ?? 0)}
          icon={Wallet}
          variant="violet"
          loading={statsLoading}
        />
        <StatCard
          label={t("dashboard.netProfit")}
          value={formatCurrency(stats?.today_profit ?? 0)}
          icon={TrendingUp}
          variant="green"
          loading={statsLoading}
        />
        <StatCard
          label={t("dashboard.salesCount")}
          value={`${stats?.today_sales_count ?? 0}`}
          icon={ShoppingCart}
          variant="blue"
          loading={statsLoading}
        />
        <StatCard
          label={t("dashboard.lowStock")}
          value={`${stats?.low_stock_count ?? 0} ${t("common.pcs")}`}
          icon={AlertTriangle}
          variant="amber"
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tushum trendi */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.last7days")}</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
            ) : (
              <RevenueChart data={trend ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Kam qoldiq */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.lowStockProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LowStockList products={lowStock ?? []} loading={lowLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
