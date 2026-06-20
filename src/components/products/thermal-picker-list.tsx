"use client";

import { Printer, Loader2, Bluetooth, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PrinterDevice } from "@/lib/native-printer";

interface ThermalPickerListProps {
  scanning: boolean;
  busy: boolean;
  devices: PrinterDevice[];
  onSelect: (address: string) => void;
  onRescan: () => void;
  onCancel: () => void;
}

/** Termal printer tanlash ro'yxati — LabelPrintDialog va BulkLabelDialog umumiy. */
export function ThermalPickerList({
  scanning,
  busy,
  devices,
  onSelect,
  onRescan,
  onCancel,
}: ThermalPickerListProps) {
  const { t } = useTranslation();
  return (
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
            onClick={onRescan}
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
                onClick={() => onSelect(d.address)}
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
        onClick={onCancel}
        className="mt-2 w-full text-center text-xs text-muted-foreground"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}
