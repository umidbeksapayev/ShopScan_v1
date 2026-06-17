import type { Product } from "@/types/database";
import { normalizeBarcode } from "@/lib/utils";

/**
 * Keshlangan mahsulotlar ro'yxatidan barcode bo'yicha qidiradi (offline fallback).
 * findProductsByBarcode (Supabase) bilan bir xil mantiq: faol + qoldig'i bor,
 * eng yangi birinchi, ko'pi bilan `limit` ta.
 */
export function matchBarcode(
  products: Product[],
  barcode: string,
  limit = 3
): Product[] {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) return [];
  return products
    .filter(
      (p) =>
        p.is_active &&
        p.quantity > 0 &&
        p.barcode != null &&
        normalizeBarcode(p.barcode) === normalized
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);
}
