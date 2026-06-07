"use client";

import Image from "next/image";
import { Barcode, Sparkles, Search, Receipt } from "lucide-react";
import type { Sale, SearchMethod } from "@/types/database";
import { formatCurrency, formatWeight } from "@/lib/utils";

interface SalesHistoryListProps {
  sales: Sale[];
  loading?: boolean;
}

const methodMeta: Record<SearchMethod, { label: string; icon: typeof Barcode; cls: string }> = {
  barcode: { label: "Barcode", icon: Barcode, cls: "bg-blue-100 text-blue-700" },
  visual: { label: "Vizual", icon: Sparkles, cls: "bg-purple-100 text-purple-700" },
  manual: { label: "Qo'lda", icon: Search, cls: "bg-gray-100 text-gray-600" },
};

/** "2026-06-07T09:18:33Z" → "07.06 14:18" (Asia/Tashkent) */
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
}

export function SalesHistoryList({ sales, loading }: SalesHistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Receipt className="h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">Hali sotuvlar yo&apos;q</p>
        <p className="text-xs text-gray-400">Sotuv ekranidan birinchi sotuvni amalga oshiring</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {sales.map((s) => {
        const meta = methodMeta[s.search_method];
        const MethodIcon = meta.icon;
        const qtyLabel =
          s.sale_type === "weight"
            ? formatWeight(s.quantity_sold)
            : `${s.quantity_sold} dona`;
        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-lg border p-2.5"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100">
              {s.product?.image_url ? (
                <Image
                  src={s.product.image_url}
                  alt={s.product.name ?? ""}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">
                {s.product?.name ?? "Mahsulot"}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                <span className="tabular-nums">{qtyLabel}</span>
                <span>•</span>
                <span className="tabular-nums">{formatTime(s.sold_at)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(s.total_revenue)}
              </p>
              <span
                className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.cls}`}
              >
                <MethodIcon className="h-2.5 w-2.5" />
                {meta.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
