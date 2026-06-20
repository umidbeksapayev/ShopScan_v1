"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { LabelData } from "@/lib/barcode-format";
import {
  printLabelsNative,
  scanPrinters,
  getLastPrinter,
  setLastPrinter,
  type PrinterDevice,
} from "@/lib/native-printer";

/**
 * Termal (native) yorliq chop etish oqimi — LabelPrintDialog va BulkLabelDialog
 * uchun umumiy (DRY). Skan/picker/ulanish/print + oxirgi printerni eslab qolish.
 *
 * `getLabels` chop etish PAYTIDA chaqiriladi → eng yangi holat (nusxa/tanlov)
 * olinadi. Picker ochilganda yorliqlar ref'ga muhrlanadi.
 */
export function useThermalLabelPrint() {
  const { t } = useTranslation();
  const [isNative, setIsNative] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const labelsRef = useRef<LabelData[]>([]);

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

  const stopScan = useCallback(async () => {
    await stopRef.current?.();
    stopRef.current = null;
    setScanning(false);
  }, []);

  // Komponent yopilganda skanni to'xtatamiz
  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  const printTo = useCallback(
    async (address: string) => {
      if (labelsRef.current.length === 0) return;
      setBusy(true);
      try {
        await stopScan();
        await printLabelsNative(labelsRef.current, address);
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
    },
    [stopScan, t]
  );

  const openPicker = useCallback(async () => {
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
  }, [stopScan, t]);

  /** Termalga chop etishni boshlaydi: oxirgi printer bo'lsa darhol, aks holda picker. */
  const startThermal = useCallback(
    (labels: LabelData[]) => {
      if (labels.length === 0) return;
      labelsRef.current = labels;
      const last = getLastPrinter();
      if (last) printTo(last);
      else openPicker();
    },
    [printTo, openPicker]
  );

  const cancelPicker = useCallback(() => {
    stopScan();
    setPicker(false);
  }, [stopScan]);

  /** Dialog yopilganda chaqiriladi — holatni tozalaydi. */
  const reset = useCallback(() => {
    stopScan();
    setPicker(false);
  }, [stopScan]);

  return {
    isNative,
    busy,
    picker,
    scanning,
    devices,
    startThermal,
    printTo,
    openPicker,
    cancelPicker,
    reset,
  };
}
