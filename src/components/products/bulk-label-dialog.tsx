"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, FileText, Minus, Plus, Loader2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/types/database";
import { cn, formatCurrency } from "@/lib/utils";
import { printLabelsSheet } from "@/lib/labels";
import { assignBarcode } from "@/lib/products";
import type { LabelData } from "@/lib/barcode-format";
import { useThermalLabelPrint } from "@/hooks/use-thermal-label-print";
import { ThermalPickerList } from "@/components/products/thermal-picker-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkLabelDialogProps {
  /** Katalogда hozir ko'rinayotgan (filtrlangan) mahsulotlar. */
  products: Product[];
  shopName: string;
  open: boolean;
  onClose: () => void;
}

type Mode = "all" | "pick";
const MAX_COPIES = 50;

/** Ko'p mahsulot uchun yorliq: 'Hammasi (filtr)' yoki 'Tanlab (checkbox)'. */
export function BulkLabelDialog({
  products,
  shopName,
  open,
  onClose,
}: BulkLabelDialogProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copies, setCopies] = useState(1);
  const [showShop, setShowShop] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const thermal = useThermalLabelPrint();

  useEffect(() => {
    if (!open) {
      thermal.reset();
      setMode("all");
      setSelected(new Set());
      setCopies(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const targetProducts = useMemo(
    () => (mode === "all" ? products : products.filter((p) => selected.has(p.id))),
    [mode, products, selected]
  );
  const labelCount = targetProducts.length * copies;
  const allSelected = selected.size === products.length && products.length > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  /** Barcode'siz mahsulotларга avtomatik barcode beradi, keyin yorliqlarni quradi. */
  async function prepareLabels(): Promise<LabelData[]> {
    const targets = targetProducts;
    const missing = targets.filter((p) => !p.barcode);
    const assigned = new Map<string, string>();
    if (missing.length > 0) {
      await Promise.all(
        missing.map(async (p) => assigned.set(p.id, await assignBarcode(p.id)))
      );
      qc.invalidateQueries({ queryKey: ["products"] });
    }
    const out: LabelData[] = [];
    for (const p of targets) {
      const base: LabelData = {
        name: p.name,
        price: p.selling_price,
        barcode: p.barcode ?? assigned.get(p.id) ?? null,
        shopName: showShop ? shopName : undefined,
      };
      for (let i = 0; i < copies; i++) out.push(base);
    }
    return out;
  }

  async function handlePrint(target: "a4" | "thermal") {
    setPreparing(true);
    try {
      const labels = await prepareLabels();
      if (target === "a4") printLabelsSheet(labels, { showShopName: showShop });
      else thermal.startThermal(labels);
    } catch (err) {
      toast.error(t("labels.barcodeError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPreparing(false);
    }
  }

  const disabled = labelCount === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> {t("labels.bulkTitle")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              {t("labels.modeAll")}
            </TabsTrigger>
            <TabsTrigger value="pick" className="flex-1">
              {t("labels.modePick")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "all" ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("labels.allCount", { count: products.length })}
          </p>
        ) : (
          <div className="rounded-xl border">
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center justify-between border-b px-3 py-2 text-sm font-medium"
            >
              <span>{t("labels.selectAll")}</span>
              <span className="text-xs text-muted-foreground">
                {selected.size}/{products.length}
              </span>
            </button>
            <ul className="max-h-56 overflow-y-auto">
              {products.map((p) => {
                const on = selected.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          on ? "border-primary bg-primary text-primary-foreground" : "border-input"
                        )}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {formatCurrency(p.selling_price)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Nusxa soni (har mahsulotga) */}
        <div className="flex items-center justify-between">
          <Label>{t("labels.copiesEach")}</Label>
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

        <div className="flex items-center justify-between">
          <Label htmlFor="bulk-shop">{t("labels.showShop")}</Label>
          <Switch id="bulk-shop" checked={showShop} onCheckedChange={setShowShop} />
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
            <p className="text-center text-xs text-muted-foreground">
              {t("labels.totalLabels", { count: labelCount })}
            </p>
            <Button
              onClick={() => handlePrint("a4")}
              variant="outline"
              size="lg"
              className="w-full"
              disabled={disabled || preparing}
            >
              {preparing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <FileText className="mr-2 h-5 w-5" />
              )}
              {t("labels.printA4")}
            </Button>
            {thermal.isNative && (
              <Button
                onClick={() => handlePrint("thermal")}
                size="lg"
                className="w-full"
                disabled={disabled || preparing || thermal.busy}
              >
                {preparing || thermal.busy ? (
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
