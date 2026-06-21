"use client";

import { useEffect, useRef, useState } from "react";
import { Printer, Loader2, Bluetooth, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ReceiptData } from "@/lib/receipt-print";
import {
  printReceiptNative,
  scanPrinters,
  getLastPrinter,
  setLastPrinter,
  type PrinterDevice,
} from "@/lib/native-printer";
import { Button } from "@/components/ui/button";

interface NativePrintButtonProps {
  data: ReceiptData | null;
  disabled?: boolean;
}

/** Native (Bluetooth Classic SPP) termal chek chop etish — skan/tanlash/eslab qolish. */
export function NativePrintButton({ data, disabled }: NativePrintButtonProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [picker, setPicker] = useState(false);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const last = getLastPrinter();

  // Komponent yopilganda skanni to'xtatamiz
  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  async function stopScan() {
    await stopRef.current?.();
    stopRef.current = null;
    setScanning(false);
  }

  async function printTo(address: string) {
    if (!data) return;
    setBusy(true);
    try {
      await stopScan();
      await printReceiptNative(data, address);
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
      // 10s dan keyin skanni avtomatik to'xtatamiz
      window.setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (err) {
      setScanning(false);
      toast.error(t("receipt.btError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  // Asosiy chop: oxirgi printer bo'lsa to'g'ridan-to'g'ri, aks holda tanlovni ochamiz
  function handlePrint() {
    if (last) printTo(last);
    else openPicker();
  }

  return (
    <div className="space-y-2">
      {!picker && (
        <Button
          onClick={handlePrint}
          variant="outline"
          className="w-full"
          size="lg"
          disabled={disabled || busy}
        >
          {busy ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Bluetooth className="mr-2 h-5 w-5" />
          )}
          {busy ? t("receipt.sending") : t("receipt.bluetooth")}
        </Button>
      )}

      {!picker && last && (
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {t("receipt.changePrinter")}
        </button>
      )}

      {picker && (
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
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {devices.map((d) => (
                <li key={d.address}>
                  <button
                    type="button"
                    onClick={() => printTo(d.address)}
                    disabled={busy}
                    className="flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {d.name || t("receipt.unknownPrinter")}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {d.address}
                      </span>
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
      )}
    </div>
  );
}
