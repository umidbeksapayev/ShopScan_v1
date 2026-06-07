"use client";

import Image from "next/image";
import { Trash2, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency, formatWeight } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CartPanelProps {
  onCheckout: () => void;
  loading?: boolean;
}

export function CartPanel({ onCheckout, loading }: CartPanelProps) {
  const { items, removeItem, totalRevenue } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-gray-400">
        <ShoppingCart className="mb-2 h-10 w-10" />
        <p className="text-sm">Savat bo&apos;sh</p>
        <p className="text-xs">Skanerlab yoki qidirib mahsulot qo&apos;shing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border bg-white">
      <div className="border-b px-4 py-3 font-semibold">
        Savat ({items.length})
      </div>

      <div className="max-h-[50vh] divide-y overflow-y-auto">
        {items.map((item) => {
          const isWeight = item.product.sale_type === "weight";
          const qtyText = isWeight
            ? formatWeight(item.quantity)
            : `${item.quantity} dona`;
          const lineTotal = item.product.selling_price * item.quantity;

          return (
            <div key={item.product.id} className="flex items-center gap-3 p-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={item.product.image_url}
                  alt={item.product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-gray-500">
                  {qtyText} × {formatCurrency(item.product.selling_price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(lineTotal)}</p>
                <button
                  type="button"
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="O'chirish"
                >
                  <Trash2 className="ml-auto h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-gray-600">Jami:</span>
          <span className="text-xl font-bold">{formatCurrency(totalRevenue())}</span>
        </div>
        <Button onClick={onCheckout} disabled={loading} className="w-full" size="lg">
          {loading ? "Sotilmoqda..." : "Sotish"}
        </Button>
      </div>
    </div>
  );
}
