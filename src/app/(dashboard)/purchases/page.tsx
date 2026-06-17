"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, PackagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product, Supplier } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { lineTotal } from "@/lib/purchases";
import { useShop } from "@/hooks/use-shop";
import { useProcessPurchase, usePurchases } from "@/hooks/use-purchases";
import { SupplierPicker } from "@/components/purchases/supplier-picker";
import { ProductPicker } from "@/components/purchases/product-picker";
import { PurchaseHistoryList } from "@/components/purchases/purchase-history-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductThumb } from "@/components/products/product-thumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Line {
  product: Product;
  quantity: string;
  cost: string;
}

export default function PurchasesPage() {
  const { t } = useTranslation();
  const { data: shop } = useShop();
  const purchaseMut = useProcessPurchase();
  const { data: history, isLoading: histLoading } = usePurchases(shop?.id);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [note, setNote] = useState("");
  const [pickOpen, setPickOpen] = useState(false);

  const total = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + lineTotal(Number(l.quantity) || 0, Number(l.cost) || 0),
        0
      ),
    [lines]
  );

  function addProduct(p: Product) {
    setLines((prev) => {
      if (prev.some((l) => l.product.id === p.id)) return prev;
      return [...prev, { product: p, quantity: "1", cost: String(p.cost_price) }];
    });
    setPickOpen(false);
  }
  function updateLine(id: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => (l.product.id === id ? { ...l, ...patch } : l))
    );
  }
  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== id));
  }

  async function handleSubmit() {
    if (!shop) return;
    const items = lines
      .map((l) => ({
        product_id: l.product.id,
        quantity: Number(l.quantity) || 0,
        cost_price: Number(l.cost) || 0,
      }))
      .filter((x) => x.quantity > 0);
    if (items.length === 0) {
      toast.error(t("purchases.noLines"));
      return;
    }
    try {
      await purchaseMut.mutateAsync({
        shopId: shop.id,
        supplierId: supplier?.id ?? null,
        items,
        note: note || null,
      });
      toast.success(t("purchases.success"));
      setLines([]);
      setSupplier(null);
      setNote("");
    } catch (err) {
      toast.error(t("purchases.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("purchases.title")}</h1>

      {/* Yangi kirim */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("purchases.supplier")}
          </Label>
          {shop && (
            <SupplierPicker
              shopId={shop.id}
              value={supplier}
              onChange={setSupplier}
            />
          )}
        </div>

        {/* Mahsulot qatorlari */}
        <div className="space-y-2">
          {lines.map((l) => {
            const isWeight = l.product.sale_type === "weight";
            return (
              <div
                key={l.product.id}
                className="flex items-center gap-2 rounded-lg border p-2"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  <ProductThumb
                    src={l.product.image_url}
                    alt={l.product.name}
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">
                    {l.product.name}
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={isWeight ? 0.001 : 1}
                      value={l.quantity}
                      onChange={(e) =>
                        updateLine(l.product.id, { quantity: e.target.value })
                      }
                      className="h-8 w-20 text-center"
                      aria-label={t("purchases.qty")}
                      placeholder={t("purchases.qty")}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={l.cost}
                      onChange={(e) =>
                        updateLine(l.product.id, { cost: e.target.value })
                      }
                      className="h-8 flex-1"
                      aria-label={t("purchases.costPrice")}
                      placeholder={t("purchases.costPrice")}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(l.product.id)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setPickOpen(true)}
            disabled={!shop}
          >
            <Plus className="mr-1 h-4 w-4" /> {t("purchases.addProduct")}
          </Button>
        </div>

        {lines.length > 0 && (
          <>
            <div className="space-y-1.5">
              <Label
                htmlFor="purchase-note"
                className="text-xs text-muted-foreground"
              >
                {t("purchases.note")}
              </Label>
              <Input
                id="purchase-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("purchases.notePlaceholder")}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">
                {t("purchases.total")}
              </span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={purchaseMut.isPending || total <= 0}
            >
              <PackagePlus className="mr-1 h-4 w-4" />
              {purchaseMut.isPending
                ? t("purchases.processing")
                : t("purchases.confirm")}
            </Button>
          </>
        )}
      </div>

      {/* Kirim tarixi */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">
          {t("purchases.history")}
        </h2>
        <PurchaseHistoryList purchases={history ?? []} loading={histLoading} />
      </div>

      {/* Mahsulot tanlash dialogi */}
      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("purchases.addProduct")}</DialogTitle>
          </DialogHeader>
          <ProductPicker
            excludeIds={lines.map((l) => l.product.id)}
            onSelect={addProduct}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
