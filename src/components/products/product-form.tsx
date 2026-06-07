"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Product, SaleType } from "@/types/database";
import { calculateProfit, cn, formatCurrency } from "@/lib/utils";
import { uploadProductImage } from "@/lib/storage";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { ImageUploader } from "@/components/products/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductFormProps {
  shopId: string;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ shopId, product, onSuccess }: ProductFormProps) {
  const isEdit = !!product;
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();

  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [saleType, setSaleType] = useState<SaleType>(product?.sale_type ?? "unit");
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() ?? "");
  const [sellingPrice, setSellingPrice] = useState(
    product?.selling_price?.toString() ?? ""
  );
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? "");
  const [lowStock, setLowStock] = useState(
    product?.low_stock_alert?.toString() ?? (product?.sale_type === "weight" ? "1" : "5")
  );
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isWeight = saleType === "weight";
  const unitLabel = isWeight ? "kg" : "dona";
  const cost = parseFloat(costPrice) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const { profit, profitPercent } = calculateProfit(selling, cost);

  function switchType(t: SaleType) {
    setSaleType(t);
    // ogohlantirish chegarasini turga moslab default qo'yish
    setLowStock(t === "weight" ? "1" : "5");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return toast.error("Mahsulot nomini kiriting");
    if (!isEdit && !imageBlob) return toast.error("Mahsulot rasmini tanlang");
    if (cost <= 0 || selling <= 0) return toast.error("Narxlarni to'g'ri kiriting");
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) return toast.error("Miqdorni to'g'ri kiriting");
    if (!isWeight && !Number.isInteger(qty))
      return toast.error("Donali mahsulot miqdori butun son bo'lishi kerak");

    setSubmitting(true);
    try {
      let imageUrl = product?.image_url ?? "";
      if (imageBlob) {
        imageUrl = await uploadProductImage(imageBlob, shopId);
      }

      const payload = {
        name: name.trim(),
        sale_type: saleType,
        cost_price: cost,
        selling_price: selling,
        quantity: qty,
        low_stock_alert: parseFloat(lowStock) || 0,
        barcode: barcode.trim() || null,
        image_url: imageUrl,
      };

      if (isEdit && product) {
        await updateMut.mutateAsync({ id: product.id, ...payload });
        toast.success("Mahsulot yangilandi");
      } else {
        await createMut.mutateAsync({ shop_id: shopId, ...payload });
        toast.success("Mahsulot qo'shildi");
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
      <ImageUploader
        value={imageBlob}
        previewUrl={product?.image_url ?? null}
        onChange={setImageBlob}
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
              "rounded-md border py-2.5 text-sm font-medium transition-colors",
              !isWeight
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-input bg-background text-gray-600"
            )}
          >
            🔢 DONALI (dona)
          </button>
          <button
            type="button"
            onClick={() => switchType("weight")}
            className={cn(
              "rounded-md border py-2.5 text-sm font-medium transition-colors",
              isWeight
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-input bg-background text-gray-600"
            )}
          >
            ⚖️ VAZN (kg)
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

      {/* Miqdor + ogohlantirish */}
      <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="low">Kam qoldi ({unitLabel})</Label>
          <Input
            id="low"
            type="number"
            inputMode="decimal"
            min="0"
            step={isWeight ? "0.001" : "1"}
            value={lowStock}
            onChange={(e) => setLowStock(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode (ixtiyoriy)</Label>
        <Input
          id="barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="EAN-13 / QR"
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Qo'shish"}
      </Button>
    </form>
  );
}
