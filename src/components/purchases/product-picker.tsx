"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@/types/database";
import { useProducts } from "@/hooks/use-products";
import { Input } from "@/components/ui/input";
import { ProductThumb } from "@/components/products/product-thumb";

interface ProductPickerProps {
  excludeIds?: string[];
  onSelect: (product: Product) => void;
}

/** Kirimga qo'shish uchun mavjud mahsulotni qidirib tanlash. */
export function ProductPicker({ excludeIds = [], onSelect }: ProductPickerProps) {
  const { t } = useTranslation();
  const { data: products } = useProducts({});
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const list = (products ?? []).filter((p) => !excludeIds.includes(p.id));
    if (!term.trim()) return list.slice(0, 8);
    const q = term.trim().toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, term, excludeIds]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("purchases.productSearch")}
          className="pl-9"
          autoFocus
        />
      </div>
      <ul className="max-h-60 space-y-1 overflow-auto">
        {filtered.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(p);
                setTerm("");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                <ProductThumb src={p.image_url} alt={p.name} sizes="36px" />
              </div>
              <span className="line-clamp-1 text-sm">{p.name}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-2 py-3 text-center text-xs text-muted-foreground">
            {t("purchases.noProducts")}
          </li>
        )}
      </ul>
    </div>
  );
}
