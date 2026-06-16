"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Sale } from "@/types/database";
import { formatCurrency, formatWeight } from "@/lib/utils";
import { returnableQty } from "@/lib/returns";
import { useReturnedQuantities, useProcessReturn } from "@/hooks/use-returns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProductThumb } from "@/components/products/product-thumb";

interface ReturnDialogProps {
  open: boolean;
  sale: Sale | null;
  shopId: string;
  onClose: () => void;
}

export function ReturnDialog({ open, sale, shopId, onClose }: ReturnDialogProps) {
  const { t } = useTranslation();
  const { data: returnedMap } = useReturnedQuantities(open ? sale?.id : undefined);
  const returnMut = useProcessReturn();
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");

  const items = useMemo(() => sale?.items ?? [], [sale]);

  const refundPreview = useMemo(
    () =>
      items.reduce((sum, it) => {
        const q = Number(qtys[it.id]) || 0;
        return sum + it.selling_price_snapshot * q;
      }, 0),
    [items, qtys]
  );

  async function handleSubmit() {
    if (!sale) return;
    const payload = items
      .map((it) => ({ sale_item_id: it.id, quantity: Number(qtys[it.id]) || 0 }))
      .filter((x) => x.quantity > 0);
    if (payload.length === 0) {
      toast.error(t("returns.nothingSelected"));
      return;
    }
    try {
      await returnMut.mutateAsync({
        shopId,
        saleId: sale.id,
        items: payload,
        reason: reason || null,
      });
      toast.success(t("returns.success"));
      setQtys({});
      setReason("");
      onClose();
    } catch (err) {
      toast.error(t("returns.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("returns.title")}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-2 overflow-auto">
          {items.map((it) => {
            const max = returnableQty(it.quantity_sold, returnedMap?.[it.id] ?? 0);
            const isWeight = it.sale_type === "weight";
            return (
              <div key={it.id} className="flex items-center gap-3 rounded-lg border p-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  <ProductThumb
                    src={it.product?.image_url}
                    alt={it.product?.name ?? ""}
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">
                    {it.product?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t("returns.returnable")}:{" "}
                    {isWeight ? formatWeight(max) : `${max} ${t("common.pcs")}`}
                  </p>
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={max}
                  step={isWeight ? 0.001 : 1}
                  value={qtys[it.id] ?? ""}
                  onChange={(e) =>
                    setQtys((prev) => ({ ...prev, [it.id]: e.target.value }))
                  }
                  disabled={max <= 0}
                  placeholder="0"
                  className="w-20 shrink-0 text-center"
                />
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="return-reason" className="text-xs text-muted-foreground">
            {t("returns.reason")}
          </Label>
          <Input
            id="return-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("returns.reasonPlaceholder")}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-accent/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("returns.refundTotal")}</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(refundPreview)}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={returnMut.isPending || refundPreview <= 0}
          >
            {returnMut.isPending ? t("returns.processing") : t("returns.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
