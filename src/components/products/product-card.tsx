"use client";

import Image from "next/image";
import { MoreVertical, Pencil, Archive, Hash, Scale, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types/database";
import { formatCurrency, formatWeight } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TFn = (key: string) => string;

interface ProductCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onArchive: (p: Product) => void;
}

/** Qoldiq holatini aniqlaydi (FR-33). cost_price BU YERDA hech qachon ko'rsatilmaydi. */
function stockState(
  p: Product,
  t: TFn
): { label: string; variant: "success" | "warning" | "destructive" } {
  const isWeight = p.sale_type === "weight";
  const qtyText = isWeight ? formatWeight(p.quantity) : `${p.quantity} ${t("common.pcs")}`;

  if (p.quantity <= 0) return { label: t("dashboard.out"), variant: "destructive" };
  // Ogohlantirish chegarasi: miqdor chegaraga yetganda yoki undan kam bo'lganda (<=).
  if (p.quantity <= p.low_stock_alert)
    return { label: `${qtyText} (${t("dashboard.low").toLowerCase()}!)`, variant: "warning" };
  return { label: qtyText, variant: "success" };
}

export function ProductCard({ product, onEdit, onArchive }: ProductCardProps) {
  const { t } = useTranslation();
  const stock = stockState(product, t);
  const isWeight = product.sale_type === "weight";

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <Package className="h-10 w-10" />
          </div>
        )}
        <Badge
          variant={isWeight ? "secondary" : "outline"}
          className="absolute left-2 top-2 gap-1 bg-white/90"
        >
          {isWeight ? <Scale className="h-3 w-3" /> : <Hash className="h-3 w-3" />}
          {isWeight ? t("common.kg") : t("common.pcs")}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-foreground shadow hover:bg-white"
              aria-label={t("catalog.actions")}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" /> {t("catalog.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onArchive(product)}
              className="text-red-600 focus:text-red-600"
            >
              <Archive className="mr-2 h-4 w-4" /> {t("catalog.archive")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 font-medium text-foreground">{product.name}</h3>
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(product.selling_price)}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            / {isWeight ? "kg" : "dona"}
          </span>
        </p>
        <Badge variant={stock.variant}>{stock.label}</Badge>
      </div>
    </div>
  );
}
