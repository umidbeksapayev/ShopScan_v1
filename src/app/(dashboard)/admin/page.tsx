"use client";

import { Users, Store, Package, ShoppingCart, Wallet, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAdminOverview, useAdminShops } from "@/hooks/use-admin";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminPage() {
  const { t } = useTranslation();
  const { data: overview, isLoading: ovLoading } = useAdminOverview();
  const { data: shops, isLoading: shopsLoading } = useAdminShops();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("admin.title")}</h1>

      {/* Umumiy ko'rsatkichlar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={t("admin.users")}
          value={`${overview?.users_count ?? 0}`}
          icon={Users}
          variant="brand"
          loading={ovLoading}
        />
        <StatCard
          label={t("admin.shops")}
          value={`${overview?.shops_count ?? 0}`}
          icon={Store}
          variant="blue"
          loading={ovLoading}
        />
        <StatCard
          label={t("admin.products")}
          value={`${overview?.products_count ?? 0}`}
          icon={Package}
          variant="green"
          loading={ovLoading}
        />
        <StatCard
          label={t("admin.sales")}
          value={`${overview?.sales_count ?? 0}`}
          icon={ShoppingCart}
          variant="amber"
          loading={ovLoading}
        />
      </div>

      {/* Umumiy tushum */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-primary" />
            {t("admin.totalRevenue")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(overview?.total_revenue ?? 0)}
          </p>
        </CardContent>
      </Card>

      {/* Do'konlar ro'yxati */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.shopsList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {shopsLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !shops || shops.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("admin.noShops")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t("admin.colShop")}</th>
                    <th className="py-2 pr-3 font-medium">{t("admin.colOwner")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t("admin.colProducts")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{t("admin.colSales")}</th>
                    <th className="py-2 text-right font-medium">{t("admin.colRevenue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shops.map((s) => (
                    <tr key={s.shop_id}>
                      <td className="py-2 pr-3 font-medium">{s.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{s.owner_email}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{s.product_count}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{s.sales_count}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatCurrency(s.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Obuna (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("admin.subscriptions")}
          </CardTitle>
          <CardDescription>{t("admin.subscriptionsDesc")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
