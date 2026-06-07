"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Wallet, TrendingUp, ShoppingCart } from "lucide-react";
import { useShop } from "@/hooks/use-shop";
import { useSalesTrend, useTopProducts } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { TopProducts } from "@/components/dashboard/top-products";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-[260px] animate-pulse rounded-lg bg-muted" />,
  }
);

const PERIODS = [
  { label: "7 kun", days: 7 },
  { label: "30 kun", days: 30 },
] as const;

export default function ReportsPage() {
  const { data: shop } = useShop();
  const [days, setDays] = useState<number>(7);

  const { data: trend, isLoading: trendLoading } = useSalesTrend(shop?.id, days);
  const { data: top, isLoading: topLoading } = useTopProducts(shop?.id, days, 5);

  // Davr yig'indilari (trenddan)
  const totals = (trend ?? []).reduce(
    (acc, d) => {
      acc.revenue += d.revenue;
      acc.profit += d.profit;
      acc.count += d.sales_count;
      return acc;
    },
    { revenue: 0, profit: 0, count: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Hisobotlar</h1>

        {/* Davr tanlash */}
        <div className="inline-flex rounded-lg border bg-white p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setDays(p.days)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                days === p.days
                  ? "bg-primary text-primary-foreground shadow-pop"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Davr yig'indilari */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label={`Tushum (${days} kun)`}
          value={formatCurrency(totals.revenue)}
          icon={Wallet}
          variant="violet"
          loading={trendLoading}
        />
        <StatCard
          label={`Foyda (${days} kun)`}
          value={formatCurrency(totals.profit)}
          icon={TrendingUp}
          variant="green"
          loading={trendLoading}
        />
        <StatCard
          label={`Sotuvlar (${days} kun)`}
          value={`${totals.count} ta`}
          icon={ShoppingCart}
          variant="blue"
          loading={trendLoading}
        />
      </div>

      {/* Trend grafigi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tushum va Foyda dinamikasi</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <div className="h-[260px] animate-pulse rounded-lg bg-muted" />
          ) : (
            <RevenueChart data={trend ?? []} />
          )}
        </CardContent>
      </Card>

      {/* Eng ko'p sotilgan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eng ko&apos;p tushum keltirgan mahsulotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <TopProducts products={top ?? []} loading={topLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
