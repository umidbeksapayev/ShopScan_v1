"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import { useShop } from "@/hooks/use-shop";
import { useCustomers } from "@/hooks/use-customers";
import { usePermissionGuard } from "@/hooks/use-guards";
import { CustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomersPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const { data: customers, isLoading } = useCustomers(shop?.id);
  const [term, setTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { checking } = usePermissionGuard("manage_debt");

  const totalDebt = useMemo(
    () => (customers ?? []).reduce((sum, c) => sum + Math.max(0, c.balance), 0),
    [customers]
  );

  const filtered = useMemo(() => {
    const list = customers ?? [];
    if (!term.trim()) return list;
    const q = term.trim().toLowerCase();
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q)
    );
  }, [customers, term]);

  if (checking) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("customers.title")}</h1>
        <Button onClick={() => setAddOpen(true)} disabled={!shop}>
          <Plus className="mr-1 h-4 w-4" /> {t("customers.addNew")}
        </Button>
      </div>

      {/* Jami qarz */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm text-muted-foreground">{t("customers.totalDebt")}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
          {formatCurrency(totalDebt)}
        </p>
      </div>

      {/* Qidiruv */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("customers.searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {/* Ro'yxat */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-muted-foreground">
            {term ? t("customers.notFound") : t("customers.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft transition-all hover:shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent font-medium text-accent-foreground">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  )}
                </div>
                {c.balance > 0 ? (
                  <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatCurrency(c.balance)}
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {t("customers.noDebt")}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customers.newCustomer")}</DialogTitle>
          </DialogHeader>
          {shop && (
            <CustomerForm shopId={shop.id} onSuccess={() => setAddOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
