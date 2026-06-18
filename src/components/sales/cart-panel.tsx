"use client";

import { Trash2, ShoppingCart, Minus, Plus } from "lucide-react";
import { ProductThumb } from "@/components/products/product-thumb";
import { useTranslation } from "react-i18next";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency, formatWeight } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Vazn miqdorini 1 gramm aniqligigacha yaxlitlaydi (suzuvchi nuqta xatosisiz). */
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

interface CartPanelProps {
  onCheckout: () => void;
  loading?: boolean;
}

export function CartPanel({ onCheckout, loading }: CartPanelProps) {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, totalRevenue } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-muted-foreground">
        <ShoppingCart className="mb-2 h-10 w-10" />
        <p className="text-sm">{t("cart.empty")}</p>
        <p className="text-xs">{t("cart.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <div className="border-b px-4 py-3 font-semibold">
        {t("cart.title")} ({items.length})
      </div>

      <div className="max-h-[50vh] divide-y overflow-y-auto">
        {items.map((item) => {
          const isWeight = item.product.sale_type === "weight";
          const qtyText = isWeight
            ? formatWeight(item.quantity)
            : `${item.quantity} ${t("common.pcs")}`;
          const lineTotal = item.product.selling_price * item.quantity;
          const step = isWeight ? 0.1 : 1;
          const atMin = item.quantity <= step;

          return (
            <div key={item.product.id} className="flex items-center gap-3 p-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                <ProductThumb
                  src={item.product.image_url}
                  alt={item.product.name}
                  sizes="48px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.product.selling_price)}
                  {isWeight ? ` / ${t("common.kg")}` : ""}
                </p>
                {/* Miqdor stepperi — qayta qidirmasdan +/- */}
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, round3(item.quantity - step))}
                    disabled={atMin}
                    aria-label={t("common.decrease")}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-foreground transition-colors hover:bg-accent active:scale-95 disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[3.5rem] text-center text-sm font-medium tabular-nums">
                    {qtyText}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, round3(item.quantity + step))}
                    aria-label={t("common.increase")}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-input text-foreground transition-colors hover:bg-accent active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-semibold">{formatCurrency(lineTotal)}</p>
                <button
                  type="button"
                  onClick={() => removeItem(item.product.id)}
                  className="text-destructive/70 transition-colors hover:text-destructive"
                  aria-label={t("cart.remove")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-muted-foreground">{t("cart.total")}:</span>
          <span className="text-xl font-bold">{formatCurrency(totalRevenue())}</span>
        </div>
        <Button onClick={onCheckout} disabled={loading} className="w-full" size="xl">
          <ShoppingCart className="mr-2 h-5 w-5" />
          {loading ? t("sell.selling") : t("cart.checkout")}
        </Button>
      </div>
    </div>
  );
}
