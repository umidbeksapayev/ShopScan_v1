"use client";

import { useEffect, useState } from "react";
import { Bluetooth, CheckCircle2, Loader2, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { CartSaleResult } from "@/lib/sales";
import {
  printReceipt,
  type ReceiptData,
  type ReceiptLineItem,
} from "@/lib/receipt-print";
import { isWebBluetoothSupported, printViaBluetooth } from "@/lib/printer";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReceiptProps {
  open: boolean;
  result: CartSaleResult | null;
  /** Sotuv paytida olingan savat snapshot'i (chek satrlari uchun). */
  items: ReceiptLineItem[];
  shopName: string;
  onNext: () => void;
}

/**
 * Sotuvdan keyingi chek. Xaridorga faqat tushum ko'rsatiladi (tan narxi/foyda emas).
 * Ikki chop etish usuli: HTML (window.print, universal) va Bluetooth BLE (mos qurilmalar).
 */
export function Receipt({ open, result, items, shopName, onNext }: ReceiptProps) {
  const { t } = useTranslation();
  const [bleSupported, setBleSupported] = useState(false);
  const [blePrinting, setBlePrinting] = useState(false);

  // SSR/hidratsiya mosligi uchun qo'llab-quvvatlashni mount'dan keyin aniqlaymiz.
  useEffect(() => {
    setBleSupported(isWebBluetoothSupported());
  }, []);

  function buildData(): ReceiptData | null {
    if (!result) return null;
    return {
      shopName,
      items,
      total: result.total_revenue,
      itemCount: result.item_count,
      soldAt: new Date(),
    };
  }

  function handleHtmlPrint() {
    const data = buildData();
    if (data) printReceipt(data);
  }

  async function handleBluetoothPrint() {
    const data = buildData();
    if (!data) return;
    setBlePrinting(true);
    try {
      await printViaBluetooth(data);
      toast.success(t("receipt.printSent"));
    } catch (err) {
      toast.error(t("receipt.btError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBlePrinting(false);
    }
  }

  const canPrint = !!result && items.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onNext()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">{t("receipt.label")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="mb-3 h-14 w-14 text-green-500" />
          <h2 className="text-lg font-semibold">{t("receipt.title")}</h2>
          {result && (
            <div className="mt-4 w-full space-y-2 rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("receipt.itemsLabel")}</span>
                <span className="font-medium">{result.item_count} {t("common.pcs")}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">{t("receipt.totalRevenue")}</span>
                <span className="text-lg font-bold">
                  {formatCurrency(result.total_revenue)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleHtmlPrint}
            variant="outline"
            className="w-full"
            size="lg"
            disabled={!canPrint}
          >
            <Printer className="mr-2 h-5 w-5" /> {t("receipt.print")}
          </Button>

          {bleSupported && (
            <Button
              onClick={handleBluetoothPrint}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={!canPrint || blePrinting}
            >
              {blePrinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("receipt.sending")}
                </>
              ) : (
                <>
                  <Bluetooth className="mr-2 h-5 w-5" /> {t("receipt.bluetooth")}
                </>
              )}
            </Button>
          )}

          <Button onClick={onNext} className="w-full" size="lg">
            {t("receipt.next")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
