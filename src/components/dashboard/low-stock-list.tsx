"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Product } from "@/types/database";
import { formatWeight } from "@/lib/utils";

interface LowStockListProps {
  products: Product[];
  loading?: boolean;
}

export function LowStockList({ products, loading }: LowStockListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="text-sm text-gray-500">Barcha mahsulotlar yetarli miqdorda</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {products.map((p) => {
        const isOut = p.quantity <= 0;
        const qtyLabel =
          p.sale_type === "weight" ? formatWeight(p.quantity) : `${p.quantity} dona`;
        return (
          <li key={p.id}>
            <Link
              href="/catalog"
              className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent"
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                <Image src={p.image_url} alt={p.name} fill sizes="40px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                <p className="text-xs text-gray-500 tabular-nums">Qoldiq: {qtyLabel}</p>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOut ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                {isOut ? "Tugadi" : "Kam"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
