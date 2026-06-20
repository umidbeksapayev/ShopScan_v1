"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Coins,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShop } from "@/hooks/use-shop";
import {
  useDashboardStats,
  useSalesTrend,
  useTopProducts,
  useSlowProducts,
  useLowStockProducts,
} from "@/hooks/use-dashboard";
import { useCustomers } from "@/hooks/use-customers";
import { usePermissionGuard } from "@/hooks/use-guards";
import { usePermission } from "@/hooks/use-membership";
import { StatCard } from "@/components/dashboard/stat-card";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { TopProducts } from "@/components/dashboard/top-products";
import { SlowProducts } from "@/components/dashboard/slow-products";
import { cn, formatCurrency } from "@/lib/utils";
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
  // Mahsulot statistikasi davri: 7 (hafta) / 30 (oy)
  const [statDays, setStatDays] = useState<7 | 30>(30);
  const { data: top, isLoading: topLoading } = useTopProducts(shop?.id, statDays, 5);
  const { data: slow, isLoading: slowLoading } = useSlowProducts(shop?.id, statDays, 5);
  const { checking } = usePermissionGuard("view_reports");
  const canDebt = usePermission("manage_debt");
  const { data: customers } = useCustomers(canDebt ? shop?.id : undefined);
  const totalDebt = useMemo(
    () => (customers ?? []).reduce((sum, c) => sum + Math.max(0, c.balance), 0),
    [customers]
  );

  if (checking) return null;

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
          variant="brand"
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

      {/* Jami qarz — mijozlar sahifasiga havola (faqat manage_debt) */}
      {canDebt && (
        <Link
          href="/customers"
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalDebt")}
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(totalDebt)}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
      )}

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

      {/* Mahsulot statistikasi — eng ko'p / eng kam sotilgan (hafta/oy) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">
            {t("dashboard.productStats")}
          </h2>
          <div
            role="group"
            className="inline-flex shrink-0 items-center rounded-full bg-muted p-0.5 text-sm"
          >
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setStatDays(d)}
                aria-pressed={statDays === d}
                className={cn(
                  "rounded-full px-3.5 py-1 font-medium transition-colors",
                  statDays === d
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {t(d === 7 ? "dashboard.week" : "dashboard.month")}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.topSelling")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TopProducts products={top ?? []} loading={topLoading} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.slowMoving")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SlowProducts products={slow ?? []} loading={slowLoading} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
