"use client";

import { CheckCircle2 } from "lucide-react";
import type { CartSaleResult } from "@/lib/sales";
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
  onNext: () => void;
}

/**
 * Sotuvdan keyingi chek. Xaridorga faqat tushum ko'rsatiladi (tan narxi/foyda emas).
 */
export function Receipt({ open, result, onNext }: ReceiptProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onNext()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Chek</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="mb-3 h-14 w-14 text-green-500" />
          <h2 className="text-lg font-semibold">Sotuv yakunlandi</h2>
          {result && (
            <div className="mt-4 w-full space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mahsulotlar:</span>
                <span className="font-medium">{result.item_count} ta</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Jami tushum:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(result.total_revenue)}
                </span>
              </div>
            </div>
          )}
        </div>
        <Button onClick={onNext} className="w-full" size="lg">
          Keyingisi
        </Button>
      </DialogContent>
    </Dialog>
  );
}
