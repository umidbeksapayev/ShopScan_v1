"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Printer,
  FileText,
  Minus,
  Plus,
  Loader2,
  Bluetooth,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Product } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { barcodeToDataUrl, printLabelsSheet } from "@/lib/labels";
import type { LabelData } from "@/lib/barcode-format";
import {
  printLabelsNative,
  scanPrinters,
  getLastPrinter,
  setLastPrinter,
  type PrinterDevice,
} from "@/lib/native-printer";
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

/** Narx-yorlig'i chop etish: A4 varaq (har joyda) + termal label (native). */
export function LabelPrintDialog({
  product,
  shopName,
  open,
  onClose,
}: LabelPrintDialogProps) {
  const { t } = useTranslation();
  const [copies, setCopies] = useState(1);
  const [showShop, setShowShop] = useState(true);
  const [isNative, setIsNative] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const stopRef = useRef<(() => Promise<void>) | null>(null);

  // Native (Capacitor) — termal printer faqat shu yerda ko'rinadi
  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        setIsNative(Capacitor.isNativePlatform());
      } catch {
        /* web */
      }
    })();
  }, []);

  // Dialog yopilganda holatni tiklaymiz + skanni to'xtatamiz
  useEffect(() => {
    if (!open) {
      stopRef.current?.();
      stopRef.current = null;
      setPicker(false);
      setScanning(false);
      setCopies(1);
    }
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

  function handleA4() {
    printLabelsSheet(makeLabels(), { showShopName: showShop });
  }

  async function stopScan() {
    await stopRef.current?.();
    stopRef.current = null;
    setScanning(false);
  }

  async function printTo(address: string) {
    setBusy(true);
    try {
      await stopScan();
      await printLabelsNative(makeLabels(), address);
      setLastPrinter(address);
      setPicker(false);
      toast.success(t("receipt.printSent"));
    } catch (err) {
      toast.error(t("receipt.btError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function openPicker() {
    setPicker(true);
    setDevices([]);
    setScanning(true);
    try {
      stopRef.current = await scanPrinters(setDevices);
      window.setTimeout(() => stopScan(), 10000);
    } catch (err) {
      setScanning(false);
      toast.error(t("receipt.btError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  function handleThermal() {
    const last = getLastPrinter();
    if (last) printTo(last);
    else openPicker();
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

        {/* Termal printer tanlovi (native) */}
        {picker ? (
          <div className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Bluetooth className="h-4 w-4" /> {t("receipt.selectPrinter")}
              </span>
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <button
                  type="button"
                  onClick={openPicker}
                  className="flex items-center gap-1 text-xs text-primary"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> {t("receipt.rescan")}
                </button>
              )}
            </div>
            {devices.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                {scanning ? t("receipt.searching") : t("receipt.noPrinters")}
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {devices.map((d) => (
                  <li key={d.address}>
                    <button
                      type="button"
                      onClick={() => printTo(d.address)}
                      disabled={busy}
                      className="flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <Printer className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {d.name || t("receipt.unknownPrinter")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => {
                stopScan();
                setPicker(false);
              }}
              className="mt-2 w-full text-center text-xs text-muted-foreground"
            >
              {t("common.cancel")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={handleA4} variant="outline" size="lg" className="w-full">
              <FileText className="mr-2 h-5 w-5" /> {t("labels.printA4")}
            </Button>
            {isNative && (
              <Button
                onClick={handleThermal}
                size="lg"
                className="w-full"
                disabled={busy}
              >
                {busy ? (
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
