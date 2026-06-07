"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product, SearchMethod } from "@/types/database";
import { formatCurrency, formatWeight } from "@/lib/utils";
import { QuantityStepper } from "@/components/sales/quantity-stepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddToCartDialogProps {
  open: boolean;
  /** 1 ta yoki bir nechta moslik (takror barcode bo'lsa 3 tagacha) */
  candidates: Product[];
  method: SearchMethod;
  onAdd: (product: Product, quantity: number, method: SearchMethod) => void;
  onClose: () => void;
}

export function AddToCartDialog({
  open,
  candidates,
  method,
  onAdd,
  onClose,
}: AddToCartDialogProps) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);

  // Dialog ochilganda: bitta moslik bo'lsa avtomatik tanlanadi
  useEffect(() => {
    if (open) {
      const auto = candidates.length === 1 ? candidates[0] : null;
      setSelected(auto);
      setQty(auto?.sale_type === "weight" ? 0 : 1);
    }
  }, [open, candidates]);

  function handleAdd() {
    if (!selected || qty <= 0) return;
    onAdd(selected, qty, method);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {!selected && candidates.length > 1
              ? "Mahsulotni tanlang"
              : "Savatga qo'shish"}
          </DialogTitle>
        </DialogHeader>

        {/* Bir nechta moslik — tanlash ro'yxati */}
        {!selected && candidates.length > 1 && (
          <div className="space-y-2">
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelected(p);
                  setQty(p.sale_type === "weight" ? 0 : 1);
                }}
                className="flex w-full items-center gap-3 rounded-lg border p-2 text-left hover:bg-accent"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={p.image_url} alt={p.name} fill sizes="48px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(p.selling_price)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tanlangan mahsulot — miqdor kiritish (tan narxi KO'RSATILMAYDI) */}
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={selected.image_url} alt={selected.name} fill sizes="64px" className="object-cover" />
              </div>
              <div>
                <p className="font-medium">{selected.name}</p>
                <p className="text-lg font-bold">
                  {formatCurrency(selected.selling_price)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}/ {selected.sale_type === "weight" ? "kg" : "dona"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Qoldiq:{" "}
                  {selected.sale_type === "weight"
                    ? formatWeight(selected.quantity)
                    : `${selected.quantity} dona`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Miqdor ({selected.sale_type === "weight" ? "kg" : "dona"})
              </p>
              <QuantityStepper
                saleType={selected.sale_type}
                value={qty}
                max={selected.quantity}
                onChange={setQty}
              />

              {/* VAZN uchun tezkor preset tugmalari */}
              {selected.sale_type === "weight" && (
                <div className="grid grid-cols-4 gap-2">
                  {[0.25, 0.5, 1, 2].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={preset > selected.quantity}
                      onClick={() => setQty(preset)}
                      className="rounded-md border py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40"
                    >
                      {preset} kg
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
              <span className="text-sm text-muted-foreground">Jami:</span>
              <span className="font-semibold">
                {formatCurrency(selected.selling_price * qty)}
              </span>
            </div>

            <Button onClick={handleAdd} disabled={qty <= 0} className="w-full" size="lg">
              Savatga qo&apos;shish
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
