import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " so'm";
}

export function formatWeight(kg: number): string {
  if (kg >= 1) {
    return `${kg.toFixed(3)} kg`;
  }
  return `${(kg * 1000).toFixed(0)} gramm`;
}

export function calculateProfit(sellingPrice: number, costPrice: number) {
  const profit = sellingPrice - costPrice;
  const profitPercent = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  return { profit, profitPercent };
}

/** Kam qoldiq ogohlantirishi: kiritilgan miqdorning ulushi (20%). */
export const LOW_STOCK_RATIO = 0.2;

/**
 * Mahsulot zaxirasi (stocking miqdori) asosida ogohlantirish chegarasini hisoblaydi.
 * Bu chegara FAQAT forma orqali miqdor kiritilganda hisoblanadi — sotuv jarayoni
 * uni o'zgartirmaydi (aks holda chegara doim kichrayib, hech qachon ishlamaydi).
 *
 * @param quantity - kiritilgan zaxira miqdori
 * @param saleType - 'unit' (butun son, ceil) yoki 'weight' (kg, 3 kasr)
 */
export function computeLowStockThreshold(
  quantity: number,
  saleType: "unit" | "weight"
): number {
  if (!quantity || quantity <= 0) return 0;
  const raw = quantity * LOW_STOCK_RATIO;
  if (saleType === "weight") {
    return Math.round(raw * 1000) / 1000; // 1 gramm aniqlik
  }
  return Math.ceil(raw); // donali: kamida 1
}

/**
 * Barcode normalizatsiyasi — saqlashda HAM qidirishda HAM bir xil ishlatiladi.
 * Bo'sh joy/ko'rinmas belgilarni olib tashlaydi, faqat harf-raqamni qoldiradi.
 * EAN-13 boshlovchi nollari string sifatida saqlangani uchun yo'qolmaydi.
 */
export function normalizeBarcode(raw: string): string {
  return raw.replace(/[^0-9A-Za-z]/g, "").trim();
}

/**
 * Bitta skanlangan kod uchun ekvivalent barcode variantlarini qaytaradi.
 *
 * Sabab: EAN-13 ning chapdagi ALOHIDA turgan birinchi raqami chiziq sifatida
 * emas, parite naqshida kodlanadi. Skaner (ML Kit/BarcodeDetector) ko'pincha
 * EAN-13 ni 12 xonali UPC-A deb o'qiydi (yoki aksincha) — yetakchi "0" tushib
 * qoladi. UPC-A = yetakchi nolli EAN-13. Shu sabab 12↔13 xonali shakllarни
 * tenglashtiramiz, aks holda lookup mahsulotni topa olmaydi ("birinchi raqam").
 *
 * Qaytadi: normallashgan kod + (mavjud bo'lsa) muqobil 12/13 xonali shakl.
 * Faqat raqamli kodlarga taalluqli; CODE128/QR kabilar o'zgarmaydi.
 */
export function barcodeVariants(raw: string): string[] {
  const norm = normalizeBarcode(raw);
  const out = new Set<string>();
  if (norm) out.add(norm);

  if (/^\d+$/.test(norm)) {
    // UPC-A (12) → EAN-13 (yetakchi nol bilan)
    if (norm.length === 12) out.add("0" + norm);
    // EAN-13 (13, yetakchi nol) → UPC-A (12)
    if (norm.length === 13 && norm.startsWith("0")) out.add(norm.slice(1));
  }

  return Array.from(out);
}
