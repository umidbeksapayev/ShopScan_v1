"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Hash, Scale, AlertTriangle, ScanLine, X, Plus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product, SaleType } from "@/types/database";
import {
  calculateProfit,
  cn,
  formatCurrency,
  formatWeight,
  computeLowStockThreshold,
  normalizeBarcode,
  LOW_STOCK_RATIO,
} from "@/lib/utils";
import { uploadProductImage } from "@/lib/storage";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import {
  MultiImageUploader,
  type UploaderImage,
} from "@/components/products/multi-image-uploader";
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
import { useCategories, useCreateCategory } from "@/hooks/use-categories";

// Kamera kutubxonasi (@zxing) faqat skaner ochilganda yuklanadi.
const BarcodeScanner = dynamic(
  () => import("@/components/sales/barcode-scanner").then((m) => m.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Kamera yuklanmoqda...
      </div>
    ),
  }
);

interface ProductFormProps {
  shopId: string;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ shopId, product, onSuccess }: ProductFormProps) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();

  const [images, setImages] = useState<UploaderImage[]>([]);
  const [name, setName] = useState(product?.name ?? "");
  const [saleType, setSaleType] = useState<SaleType>(product?.sale_type ?? "unit");
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() ?? "");
  const [sellingPrice, setSellingPrice] = useState(
    product?.selling_price?.toString() ?? ""
  );
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Kategoriya (ixtiyoriy): "none" = kategoriyasiz
  const { data: categories } = useCategories();
  const createCatMut = useCreateCategory();
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? "none");
  const [newCatMode, setNewCatMode] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const isWeight = saleType === "weight";
  const unitLabel = isWeight ? t("common.kg") : t("common.pcs");
  const cost = parseFloat(costPrice) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const { profit, profitPercent } = calculateProfit(selling, cost);

  // Ogohlantirish chegarasi kiritilgan miqdordan avtomatik (20%) hisoblanadi
  const qtyNum = parseFloat(quantity) || 0;
  const lowStockAlert = computeLowStockThreshold(qtyNum, saleType);
  const thresholdLabel = isWeight
    ? formatWeight(lowStockAlert)
    : `${lowStockAlert} ${t("common.pcs")}`;

  function switchType(type: SaleType) {
    setSaleType(type);
  }

  async function handleCreateCategory() {
    const nm = newCatName.trim();
    if (!nm) return;
    try {
      const cat = await createCatMut.mutateAsync(nm);
      setCategoryId(cat.id);
      setNewCatMode(false);
      setNewCatName("");
      toast.success(t("category.created"));
    } catch (err) {
      toast.error(t("category.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return toast.error(t("product.enterName"));
    if (cost <= 0 || selling <= 0) return toast.error(t("product.enterPrices"));
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) return toast.error(t("product.enterQty"));
    if (!isWeight && !Number.isInteger(qty))
      return toast.error(t("product.unitInteger"));

    setSubmitting(true);
    try {
      // Rasm IXTIYORIY (F-2). Tanlangan bo'lsa — birinchisini yuklaymiz.
      let imageUrl: string | null = product?.image_url ?? null;
      if (images.length > 0) {
        imageUrl = await uploadProductImage(images[0].blob, shopId);
      }

      const payload = {
        name: name.trim(),
        sale_type: saleType,
        cost_price: cost,
        selling_price: selling,
        quantity: qty,
        // Avtomatik: kiritilgan miqdorning 20% (sotuv jarayoni buni o'zgartirmaydi)
        low_stock_alert: computeLowStockThreshold(qty, saleType),
        barcode: normalizeBarcode(barcode) || null,
        image_url: imageUrl,
        category_id: categoryId === "none" ? null : categoryId,
      };

      if (isEdit && product) {
        await updateMut.mutateAsync({ id: product.id, ...payload });
        toast.success(t("product.updated"));
      } else {
        await createMut.mutateAsync({ shop_id: shopId, ...payload });
        toast.success(t("product.added"));
      }

      onSuccess();
    } catch (err) {
      toast.error(t("product.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MultiImageUploader
        value={images}
        existingUrl={product?.image_url ?? null}
        max={1}
        onChange={setImages}
      />

      <div className="space-y-2">
        <Label htmlFor="name">{t("product.name")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("product.namePlaceholder")}
        />
      </div>

      {/* Kategoriya (ixtiyoriy) — tanlash yoki inline yangi yaratish */}
      <div className="space-y-2">
        <Label>{t("product.category")}</Label>
        {newCatMode ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={t("category.namePlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateCategory();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCreateCategory}
              disabled={createCatMut.isPending || !newCatName.trim()}
              aria-label={t("common.add")}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setNewCatMode(false);
                setNewCatName("");
              }}
              aria-label={t("common.cancel")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("product.noCategory")}</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setNewCatMode(true)}
              aria-label={t("category.add")}
              title={t("category.add")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sotuv turi toggle */}
      <div className="space-y-2">
        <Label>{t("product.saleType")}</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchType("unit")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
              !isWeight
                ? "border-primary bg-accent text-primary"
                : "border-input bg-background text-muted-foreground"
            )}
          >
            <Hash className="h-4 w-4" /> {t("product.unitBtn")}
          </button>
          <button
            type="button"
            onClick={() => switchType("weight")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
              isWeight
                ? "border-primary bg-accent text-primary"
                : "border-input bg-background text-muted-foreground"
            )}
          >
            <Scale className="h-4 w-4" /> {t("product.weightBtn")}
          </button>
        </div>
      </div>

      {/* Narxlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cost">{t("product.costPrice")} ({isWeight ? t("product.perKg") : t("product.perUnit")})</Label>
          <Input
            id="cost"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="selling">{t("product.sellingPrice")} ({isWeight ? t("product.perKg") : t("product.perUnit")})</Label>
          <Input
            id="selling"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Foyda preview (FR-16) */}
      {cost > 0 && selling > 0 && (
        <div
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2 text-sm",
            profit >= 0
              ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"
          )}
        >
          <span>{t("product.netProfit")} ({isWeight ? t("product.perKg") : t("product.perUnit")}):</span>
          <span className="font-semibold">
            {formatCurrency(profit)} ({profitPercent.toFixed(0)}%)
          </span>
        </div>
      )}

      {/* Miqdor — ogohlantirish chegarasi avtomatik (20%) */}
      <div className="space-y-2">
        <Label htmlFor="qty">{t("product.quantity")} ({unitLabel})</Label>
        <Input
          id="qty"
          type="number"
          inputMode="decimal"
          min="0"
          step={isWeight ? "0.001" : "1"}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={isWeight ? "0.000" : "0"}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          {qtyNum > 0 ? (
            <span>
              {t("product.autoWarnPrefix")}{" "}
              <span className="font-medium text-foreground">{thresholdLabel}</span>{" "}
              {t("product.autoWarnSuffix", { pct: LOW_STOCK_RATIO * 100 })}
            </span>
          ) : (
            <span>{t("product.autoWarnHint", { pct: LOW_STOCK_RATIO * 100 })}</span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">{t("product.barcodeOptional")}</Label>
        <div className="flex gap-2">
          <Input
            id="barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder={t("product.barcodePlaceholder")}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setScanning((s) => !s)}
            aria-label={scanning ? t("product.scanClose") : t("product.scanOpen")}
            title={scanning ? t("product.scanClose") : t("product.scanOpen")}
          >
            {scanning ? <X className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
          </Button>
        </div>
        {scanning && (
          <div className="rounded-xl border p-2">
            <BarcodeScanner
              onDetected={(code) => {
                setBarcode(code);
                setScanning(false);
                toast.success(t("product.barcodeRead"));
              }}
            />
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? t("product.saving") : isEdit ? t("product.updateBtn") : t("product.addBtn")}
      </Button>
    </form>
  );
}
