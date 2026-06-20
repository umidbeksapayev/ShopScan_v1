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

/**
 * Yorliqlarда DOIM CODE128 ishlatamiz: raqamlar ZICH joylashadi (telefon
 * ishonchli o'qiydi). EAN-13 raqamlarni tarqoq chizadi → noto'g'ri skan xavfi.
 * CODE128 ham EAN-13 raqamlarini xuddi o'sha qiymat bilan kodlaydi → checkout'da
 * skan baribir mahsulotga mos keladi.
 */
export const LABEL_BARCODE_FORMAT: BarcodeFormat = "CODE128";

/** EAN-13 nazorat raqamini tekshiradi (kerak bo'lsa). */
export function isValidEan13(v: string): boolean {
  if (!/^\d{13}$/.test(v)) return false;
  const d = v.split("").map(Number);
  const sum = d.slice(0, 12).reduce((s, n, i) => s + n * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === d[12];
}

/**
 * Barcode'siz mahsulot uchun ICHKI barcode generatsiya qiladi.
 * 8 xonali, "2" bilan boshlanadi (do'kon-ichki diapazon). Qisqa kod = CODE128'da
 * KENG chiziqlar = ishonchli skan. Do'kon ichida UNIQUE bo'lishi DB'da tekshiriladi.
 */
export function generateInternalBarcode(): string {
  return String(20000000 + Math.floor(Math.random() * 10000000)); // 20000000–29999999
}
