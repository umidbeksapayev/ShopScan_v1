import type { Product } from "@/types/database";
import { barcodeVariants, normalizeBarcode } from "@/lib/utils";

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
  const variants = new Set(barcodeVariants(barcode));
  if (variants.size === 0) return [];
  return products
    .filter(
      (p) =>
        p.is_active &&
        p.quantity > 0 &&
        p.barcode != null &&
        variants.has(normalizeBarcode(p.barcode))
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);
}
