"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useRecordPayment } from "@/hooks/use-customers";
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

interface PaymentDialogProps {
  open: boolean;
  shopId: string;
  customerId: string;
  customerName: string;
  balance: number;
  onClose: () => void;
}

export function PaymentDialog({
  open,
  shopId,
  customerId,
  customerName,
  balance,
  onClose,
}: PaymentDialogProps) {
  const { t } = useTranslation();
  const payMut = useRecordPayment();
  const [amount, setAmount] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error(t("customers.invalidAmount"));
      return;
    }
    try {
      await payMut.mutateAsync({ shopId, customerId, amount: value });
      toast.success(t("customers.paymentRecorded"));
      setAmount("");
      onClose();
    } catch (err) {
      toast.error(t("customers.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("customers.recordPayment")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl bg-accent/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {customerName} · {t("customers.currentDebt")}:{" "}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(balance)}
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-amount">{t("customers.paymentAmount")}</Label>
            <Input
              id="pay-amount"
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              placeholder="0"
            />
            {balance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(balance))}
                className="text-xs text-primary hover:underline"
              >
                {t("customers.payFullDebt", { amount: formatCurrency(balance) })}
              </button>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={payMut.isPending}>
              {payMut.isPending ? t("common.saving") : t("customers.acceptPayment")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
