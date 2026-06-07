"use client";

import Image from "next/image";
import { MoreVertical, Pencil, Archive } from "lucide-react";
import type { Product } from "@/types/database";
import { formatCurrency, formatWeight } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onArchive: (p: Product) => void;
}

/** Qoldiq holatini aniqlaydi (FR-33). cost_price BU YERDA hech qachon ko'rsatilmaydi. */
function stockState(p: Product): { label: string; variant: "success" | "warning" | "destructive" } {
  const isWeight = p.sale_type === "weight";
  const qtyText = isWeight ? formatWeight(p.quantity) : `${p.quantity} dona`;

  if (p.quantity <= 0) return { label: "Tugadi", variant: "destructive" };
  if (p.quantity < p.low_stock_alert) return { label: `${qtyText} (kam!)`, variant: "warning" };
  return { label: qtyText, variant: "success" };
}

export function ProductCard({ product, onEdit, onArchive }: ProductCardProps) {
  const stock = stockState(product);
  const isWeight = product.sale_type === "weight";

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-gray-100">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          className="object-cover"
        />
        <Badge
          variant={isWeight ? "secondary" : "outline"}
          className="absolute left-2 top-2 bg-white/90"
        >
          {isWeight ? "⚖️ kg" : "🔢 dona"}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-gray-700 shadow hover:bg-white"
              aria-label="Amallar"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" /> Tahrirlash
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onArchive(product)}
              className="text-red-600 focus:text-red-600"
            >
              <Archive className="mr-2 h-4 w-4" /> Arxivlash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 font-medium text-gray-900">{product.name}</h3>
        <p className="text-lg font-bold text-gray-900">
          {formatCurrency(product.selling_price)}
          <span className="text-xs font-normal text-gray-500">
            {" "}
            / {isWeight ? "kg" : "dona"}
          </span>
        </p>
        <Badge variant={stock.variant}>{stock.label}</Badge>
      </div>
    </div>
  );
}
