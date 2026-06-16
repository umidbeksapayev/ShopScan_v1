"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Phone, HandCoins, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, formatCurrency } from "@/lib/utils";
import { computeCustomerBalance } from "@/lib/debt";
import { useShop } from "@/hooks/use-shop";
import {
  useCustomer,
  useCustomerSales,
  useCustomerPayments,
} from "@/hooks/use-customers";
import { SalesHistoryList } from "@/components/dashboard/sales-history-list";
import { PaymentDialog } from "@/components/customers/payment-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function CustomerDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = String(params.id);
  const { data: shop } = useShop();
  const { data: customer, isLoading: custLoading } = useCustomer(id);
  const { data: sales } = useCustomerSales(id);
  const { data: payments } = useCustomerPayments(id);
  const [payOpen, setPayOpen] = useState(false);

  const balance = computeCustomerBalance(sales ?? [], payments ?? []);

  return (
    <div className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("customers.back")}
      </Link>

      {custLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : customer ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
          {customer.phone && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {customer.phone}
            </p>
          )}
          {customer.note && (
            <p className="mt-1 text-sm text-muted-foreground">{customer.note}</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-accent/40 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("customers.currentDebt")}
              </p>
              <p
                className={cn(
                  "text-xl font-bold tabular-nums",
                  balance > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {formatCurrency(balance)}
              </p>
            </div>
            <Button onClick={() => setPayOpen(true)} disabled={!shop}>
              <HandCoins className="mr-1 h-4 w-4" /> {t("customers.acceptPayment")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* To'lovlar tarixi */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wallet className="h-4 w-4" /> {t("customers.paymentsHistory")}
        </h2>
        {(payments ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
            {t("customers.noPayments")}
          </p>
        ) : (
          <ul className="space-y-2">
            {(payments ?? []).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatTime(p.paid_at)}
                  </span>
                  {p.note && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.note}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sotuvlar tarixi */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">
          {t("customers.salesHistory")}
        </h2>
        <SalesHistoryList sales={sales ?? []} />
      </section>

      {customer && shop && (
        <PaymentDialog
          open={payOpen}
          shopId={shop.id}
          customerId={customer.id}
          customerName={customer.name}
          balance={balance}
          onClose={() => setPayOpen(false)}
        />
      )}
    </div>
  );
}
