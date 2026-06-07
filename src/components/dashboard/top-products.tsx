"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import type { TopProduct } from "@/lib/dashboard";
import { formatCurrency, formatWeight } from "@/lib/utils";

interface TopProductsProps {
  products: TopProduct[];
  loading?: boolean;
}

export function TopProducts({ products, loading }: TopProductsProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Package className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">Bu davrda sotuvlar yo&apos;q</p>
      </div>
    );
  }

  const max = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <ul className="space-y-3">
      {products.map((p, idx) => {
        const soldLabel =
          p.sale_type === "weight" ? formatWeight(p.units_sold) : `${p.units_sold} dona`;
        return (
          <li key={p.product_id} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-sm font-semibold text-gray-400 tabular-nums">
              {idx + 1}
            </span>
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
              <Image src={p.image_url} alt={p.name} fill sizes="40px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(p.revenue / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(p.revenue)}</p>
              <p className="text-xs text-gray-500 tabular-nums">{soldLabel}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
