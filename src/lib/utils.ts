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
