"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, FileText, Minus, Plus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { barcodeToDataUrl, printLabelsSheet } from "@/lib/labels";
import type { LabelData } from "@/lib/barcode-format";
import { useThermalLabelPrint } from "@/hooks/use-thermal-label-print";
import { ThermalPickerList } from "@/components/products/thermal-picker-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LabelPrintDialogProps {
  product: Product | null;
  shopName: string;
  open: boolean;
  onClose: () => void;
}

const MAX_COPIES = 100;

/** Bitta mahsulot uchun narx-yorlig'i: A4 varaq (har joyda) + termal label (native). */
export function LabelPrintDialog({
  product,
  shopName,
  open,
  onClose,
}: LabelPrintDialogProps) {
  const { t } = useTranslation();
  const [copies, setCopies] = useState(1);
  const [showShop, setShowShop] = useState(true);
  const thermal = useThermalLabelPrint();

  useEffect(() => {
    if (!open) {
      thermal.reset();
      setCopies(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const previewImg = useMemo(
    () => (product?.barcode ? barcodeToDataUrl(product.barcode) : null),
    [product?.barcode]
  );

  if (!product) return null;

  function makeLabels(): LabelData[] {
    const base: LabelData = {
      name: product!.name,
      price: product!.selling_price,
      barcode: product!.barcode,
      shopName: showShop ? shopName : undefined,
    };
    return Array.from({ length: copies }, () => base);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> {t("labels.title")}
          </DialogTitle>
        </DialogHeader>

        {/* Ko'rinish (preview) */}
        <div className="flex flex-col items-center gap-1 rounded-xl border bg-white p-3 text-center text-black">
          {showShop && (
            <span className="text-[10px] text-neutral-500">{shopName}</span>
          )}
          <span className="line-clamp-2 text-xs font-semibold">{product.name}</span>
          <span className="text-lg font-extrabold">
            {formatCurrency(product.selling_price)}
          </span>
          {previewImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImg} alt="" className="mt-1 h-12 object-contain" />
          ) : (
            <span className="mt-1 text-[10px] text-neutral-400">
              {t("labels.noBarcode")}
            </span>
          )}
        </div>

        {/* Nusxa soni */}
        <div className="flex items-center justify-between">
          <Label>{t("labels.copies")}</Label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCopies((c) => Math.max(1, c - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-40"
              disabled={copies <= 1}
              aria-label={t("common.decrease")}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2.5rem] text-center font-semibold tabular-nums">
              {copies}
            </span>
            <button
              type="button"
              onClick={() => setCopies((c) => Math.min(MAX_COPIES, c + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-40"
              disabled={copies >= MAX_COPIES}
              aria-label={t("common.increase")}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Do'kon nomi */}
        <div className="flex items-center justify-between">
          <Label htmlFor="label-shop">{t("labels.showShop")}</Label>
          <Switch id="label-shop" checked={showShop} onCheckedChange={setShowShop} />
        </div>

        {thermal.picker ? (
          <ThermalPickerList
            scanning={thermal.scanning}
            busy={thermal.busy}
            devices={thermal.devices}
            onSelect={thermal.printTo}
            onRescan={thermal.openPicker}
            onCancel={thermal.cancelPicker}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => printLabelsSheet(makeLabels(), { showShopName: showShop })}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <FileText className="mr-2 h-5 w-5" /> {t("labels.printA4")}
            </Button>
            {thermal.isNative && (
              <Button
                onClick={() => thermal.startThermal(makeLabels())}
                size="lg"
                className="w-full"
                disabled={thermal.busy}
              >
                {thermal.busy ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-5 w-5" />
                )}
                {t("labels.printThermal")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
