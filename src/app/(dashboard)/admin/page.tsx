"use client";

import { useState } from "react";
import { Users, Store, Package, ShoppingCart, Wallet, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAdminOverview, useAdminShops, useSetAdminPlan } from "@/hooks/use-admin";
import type { BillingPeriod, PlanCode } from "@/lib/admin";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLAN_CODES: PlanCode[] = ["free", "pro", "ultra"];

/**
 * Tarif belgilash — MVP'da to'lov ilovada YO'Q (qaror: qo'lda faollashtirish).
 * Mijoz Telegram/qo'ng'iroq orqali so'raydi, admin shu forma bilan
 * `admin_set_plan()` RPC'ni chaqirib tasdiqlaydi (041_subscriptions.sql).
 */
function SetPlanForm({ shops }: { shops: { shop_id: string; name: string }[] }) {
  const { t } = useTranslation();
  const setPlanMut = useSetAdminPlan();

  const [shopId, setShopId] = useState("");
  const [planCode, setPlanCode] = useState<PlanCode>("pro");
  const [period, setPeriod] = useState<BillingPeriod>("month");
  const [months, setMonths] = useState("1");
  const [note, setNote] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) {
      toast.error(t("admin.selectShopFirst"));
      return;
    }
    try {
      await setPlanMut.mutateAsync({
        shopId,
        planCode,
        period,
        months: Math.max(1, Number(months) || 1),
        note: note.trim() || undefined,
      });
      toast.success(t("admin.planUpdated"));
      setNote("");
    } catch (err) {
      toast.error(t("admin.planUpdateError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>{t("admin.colShop")}</Label>
        <Select value={shopId} onValueChange={setShopId}>
          <SelectTrigger>
            <SelectValue placeholder={t("admin.selectShop")} />
          </SelectTrigger>
          <SelectContent>
            {shops.map((s) => (
              <SelectItem key={s.shop_id} value={s.shop_id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("admin.selectPlan")}</Label>
        <Select value={planCode} onValueChange={(v) => setPlanCode(v as PlanCode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_CODES.map((code) => (
              <SelectItem key={code} value={code}>
                {t(`billing.plan.${code}`, code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("admin.period")}</Label>
        <Select value={period} onValueChange={(v) => setPeriod(v as BillingPeriod)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{t("admin.periodMonth")}</SelectItem>
            <SelectItem value="year">{t("admin.periodYear")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="months">{t("admin.months")}</Label>
        <Input
          id="months"
          type="number"
          min={1}
          value={months}
          onChange={(e) => setMonths(e.target.value)}
          disabled={planCode === "free"}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="note">{t("admin.note")}</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button type="submit" disabled={setPlanMut.isPending} className="sm:col-span-2">
        {setPlanMut.isPending ? t("admin.applying") : t("admin.applyPlan")}
      </Button>
    </form>
  );
}

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

      {/* Obuna — tarifni qo'lda belgilash (MVP: to'lov ilovada yo'q) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("admin.subscriptions")}
          </CardTitle>
          <CardDescription>{t("admin.subscriptionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SetPlanForm shops={shops ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
