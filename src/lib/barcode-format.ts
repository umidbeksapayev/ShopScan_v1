/**
 * Barcode format yordamchilari — SOF (jsbarcode/DOM'siz). Ham A4 (labels.ts),
 * ham termal (native-printer.ts) yo'llari shu yerdan oladi.
 */

export interface LabelData {
  name: string;
  /** selling_price (so'm). */
  price: number;
  /** Mahsulot barcode'i (yo'q bo'lsa — barcode chizilmaydi). */
  barcode: string | null;
  /** Do'kon nomi (ixtiyoriy). */
  shopName?: string;
}

export type BarcodeFormat = "EAN13" | "CODE128";

/** EAN-13 nazorat raqamini tekshiradi (noto'g'ri kod printerda buzilmasligi uchun). */
export function isValidEan13(v: string): boolean {
  if (!/^\d{13}$/.test(v)) return false;
  const d = v.split("").map(Number);
  const sum = d.slice(0, 12).reduce((s, n, i) => s + n * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === d[12];
}

/** Barcode formatini tanlaydi: haqiqiy EAN-13 bo'lsa EAN13, aks holda CODE128. */
export function pickBarcodeFormat(value: string): BarcodeFormat {
  return isValidEan13(value) ? "EAN13" : "CODE128";
}
