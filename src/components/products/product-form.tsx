"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Hash, Scale, AlertTriangle, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import type { Product, SaleType } from "@/types/database";
import {
  calculateProfit,
  cn,
  formatCurrency,
  formatWeight,
  computeLowStockThreshold,
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

// Kamera kutubxonalari (react-webcam/@zxing) faqat skaner ochilganda yuklanadi.
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

  const isWeight = saleType === "weight";
  const unitLabel = isWeight ? "kg" : "dona";
  const cost = parseFloat(costPrice) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const { profit, profitPercent } = calculateProfit(selling, cost);

  // Ogohlantirish chegarasi kiritilgan miqdordan avtomatik (20%) hisoblanadi
  const qtyNum = parseFloat(quantity) || 0;
  const lowStockAlert = computeLowStockThreshold(qtyNum, saleType);
  const thresholdLabel = isWeight
    ? formatWeight(lowStockAlert)
    : `${lowStockAlert} dona`;

  function switchType(t: SaleType) {
    setSaleType(t);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return toast.error("Mahsulot nomini kiriting");
    if (!isEdit && images.length === 0)
      return toast.error("Kamida bitta mahsulot rasmini tanlang");
    if (cost <= 0 || selling <= 0) return toast.error("Narxlarni to'g'ri kiriting");
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) return toast.error("Miqdorni to'g'ri kiriting");
    if (!isWeight && !Number.isInteger(qty))
      return toast.error("Donali mahsulot miqdori butun son bo'lishi kerak");

    setSubmitting(true);
    try {
      let imageUrl = product?.image_url ?? "";
      let uploadedUrls: string[] = [];
      if (images.length > 0) {
        uploadedUrls = await Promise.all(
          images.map((img) => uploadProductImage(img.blob, shopId))
        );
        imageUrl = uploadedUrls[0];
      }

      const payload = {
        name: name.trim(),
        sale_type: saleType,
        cost_price: cost,
        selling_price: selling,
        quantity: qty,
        // Avtomatik: kiritilgan miqdorning 20% (sotuv jarayoni buni o'zgartirmaydi)
        low_stock_alert: computeLowStockThreshold(qty, saleType),
        barcode: barcode.trim() || null,
        image_url: imageUrl,
      };

      let savedId: string;
      if (isEdit && product) {
        const updated = await updateMut.mutateAsync({ id: product.id, ...payload });
        savedId = updated.id;
        toast.success("Mahsulot yangilandi");
      } else {
        const created = await createMut.mutateAsync({ shop_id: shopId, ...payload });
        savedId = created.id;
        toast.success("Mahsulot qo'shildi");
      }

      // Vizual qidiruv uchun CLIP embeddinglar — barcha rasmlar BRAUZERDA fonda
      // indekslanadi (multi-image; UI bloklanmaydi). Tahrirlashda eski embeddinglar
      // tozalanib qaytadan hisoblanadi.
      if (images.length > 0) {
        const imgs = images.map((img, i) => ({
          source: img.blob,
          imageUrl: uploadedUrls[i] ?? null,
        }));
        void import("@/lib/products").then(
          async ({ clearProductEmbeddings, indexProductImages }) => {
            try {
              if (isEdit) await clearProductEmbeddings(savedId);
              await indexProductImages(savedId, shopId, imgs);
            } catch {
              /* embed xatosi mahsulot saqlashni to'smaydi */
            }
          }
        );
      }

      onSuccess();
    } catch (err) {
      toast.error("Saqlashda xato", {
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
        onChange={setImages}
      />

      <div className="space-y-2">
        <Label htmlFor="name">Mahsulot nomi</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Shampun yoki Guruch"
        />
      </div>

      {/* Sotuv turi toggle */}
      <div className="space-y-2">
        <Label>Sotuv turi</Label>
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
            <Hash className="h-4 w-4" /> DONALI (dona)
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
            <Scale className="h-4 w-4" /> VAZN (kg)
          </button>
        </div>
      </div>

      {/* Narxlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cost">Tan narxi ({isWeight ? "1 kg" : "1 dona"})</Label>
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
          <Label htmlFor="selling">Sotish narxi ({isWeight ? "1 kg" : "1 dona"})</Label>
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
            profit >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          <span>Sof foyda ({isWeight ? "1 kg" : "1 dona"}):</span>
          <span className="font-semibold">
            {formatCurrency(profit)} ({profitPercent.toFixed(0)}%)
          </span>
        </div>
      )}

      {/* Miqdor — ogohlantirish chegarasi avtomatik (20%) */}
      <div className="space-y-2">
        <Label htmlFor="qty">Miqdor ({unitLabel})</Label>
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
              Avtomatik ogohlantirish:{" "}
              <span className="font-medium text-foreground">{thresholdLabel}</span>{" "}
              qolganda ({LOW_STOCK_RATIO * 100}%)
            </span>
          ) : (
            <span>
              Mahsulot kiritilgan miqdorning {LOW_STOCK_RATIO * 100}% qolganda
              avtomatik ogohlantiriladi
            </span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode (ixtiyoriy)</Label>
        <div className="flex gap-2">
          <Input
            id="barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="EAN-13 / QR"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setScanning((s) => !s)}
            aria-label={scanning ? "Skanerni yopish" : "Kamera bilan skanerlash"}
            title={scanning ? "Skanerni yopish" : "Kamera bilan skanerlash"}
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
                toast.success("Barcode o'qildi");
              }}
            />
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Qo'shish"}
      </Button>
    </form>
  );
}
