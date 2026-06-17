"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, PackagePlus, Lock, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product, Supplier } from "@/types/database";
import { cn, formatCurrency } from "@/lib/utils";
import { lineTotal } from "@/lib/purchases";
import { useShop } from "@/hooks/use-shop";
import { useProcessPurchase, usePurchases } from "@/hooks/use-purchases";
import { usePermissionGuard } from "@/hooks/use-guards";
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

/** Raqamli bosqich kartasi (1 → 2 → 3). */
function Step({
  num,
  title,
  hint,
  children,
}: {
  num: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-primary-foreground shadow-pop">
          {num}
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold leading-tight text-foreground">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
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
  const { checking } = usePermissionGuard("purchase");

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

  if (checking) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("purchases.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("purchases.subtitle")}</p>
      </div>

      {/* 1 — Ta'minotchi */}
      <Step num={1} title={t("purchases.step1Title")} hint={t("purchases.step1Hint")}>
        {shop && (
          <SupplierPicker shopId={shop.id} value={supplier} onChange={setSupplier} />
        )}
      </Step>

      {/* 2 — Kelgan mahsulotlar */}
      <Step num={2} title={t("purchases.step2Title")}>
        {lines.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-2 font-medium text-foreground">
              {t("purchases.step2Empty")}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
              {t("purchases.step2EmptyHint")}
            </p>
            <Button
              className="mt-4"
              onClick={() => setPickOpen(true)}
              disabled={!shop}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("purchases.addProduct")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((l) => {
              const unit = l.product.sale_type === "weight"
                ? t("common.kg")
                : t("common.pcs");
              const lt = lineTotal(Number(l.quantity) || 0, Number(l.cost) || 0);
              return (
                <div
                  key={l.product.id}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <ProductThumb
                        src={l.product.image_url}
                        alt={l.product.name}
                        sizes="40px"
                      />
                    </div>
                    <p className="line-clamp-1 flex-1 text-sm font-medium">
                      {l.product.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeLine(l.product.id)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`qty-${l.product.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        {t("purchases.qty")} ({unit})
                      </Label>
                      <Input
                        id={`qty-${l.product.id}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={l.product.sale_type === "weight" ? 0.001 : 1}
                        value={l.quantity}
                        onChange={(e) =>
                          updateLine(l.product.id, { quantity: e.target.value })
                        }
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`cost-${l.product.id}`}
                        className="text-xs text-muted-foreground"
                      >
                        {t("purchases.costPrice")} (1 {unit})
                      </Label>
                      <Input
                        id={`cost-${l.product.id}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={l.cost}
                        onChange={(e) =>
                          updateLine(l.product.id, { cost: e.target.value })
                        }
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-1 text-sm">
                    <span className="text-muted-foreground">
                      {t("purchases.total")}:
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(lt)}
                    </span>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setPickOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("purchases.addMore")}
            </Button>
          </div>
        )}
      </Step>

      {/* 3 — Tekshirish va saqlash (faqat mahsulot bo'lsa) */}
      {lines.length > 0 && (
        <Step num={3} title={t("purchases.step3Title")}>
          <div className="space-y-4">
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

            <div className="flex items-center justify-between rounded-xl bg-accent/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("purchases.total")}
              </span>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(total)}
              </span>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> {t("purchases.secret")}
            </p>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={purchaseMut.isPending || total <= 0}
            >
              <PackagePlus className="mr-1.5 h-5 w-5" />
              {purchaseMut.isPending
                ? t("purchases.processing")
                : t("purchases.confirm")}
            </Button>
          </div>
        </Step>
      )}

      {/* Kirim tarixi */}
      <section className={cn("space-y-2", lines.length === 0 && "pt-2")}>
        <h2 className="text-sm font-semibold text-foreground">
          {t("purchases.history")}
        </h2>
        <PurchaseHistoryList purchases={history ?? []} loading={histLoading} />
      </section>

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
