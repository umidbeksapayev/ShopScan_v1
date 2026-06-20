import type { AcquiringProviderType } from "@/types/database";

/**
 * Ekvayring (QR to'lov) abstraksiya qatlami — provayderdan mustaqil shartnoma.
 *
 * Maqsad: checkout oqimi Payme/Click/Uzum'dan qaysi biri ishlatilishidan
 * qat'i nazar bir xil interfeysga murojaat qiladi. Har provayder o'z adapterini
 * (`AcquiringProvider`) implementatsiya qiladi (xuddi lib/fiscal naqshidek).
 *
 * ⚠️ Pul HAR DO'KONNING o'z merchant hisobiga tushadi ("A variant") — uscan
 * pulni ushlamaydi. Adapter faqat egasi bergan merchant_id bilan QR yasaydi.
 */

/** Checkout QR havolasini yasash uchun kirish. */
export interface CheckoutUrlParams {
  /** payment_intents.id — provayder buyurtma identifikatori (ac.order_id). */
  intentId: string;
  /** To'lov summasi (so'm, DECIMAL — tiyinga adapter ichida o'tkaziladi). */
  amount: number;
  /** Egasining provayderdagi merchant/kassa id'si. */
  merchantId: string;
  /** To'lovdan keyin mijoz qaytadigan havola (ixtiyoriy). */
  returnUrl?: string | null;
  /** Til (Payme: uz/ru/en). */
  lang?: "uz" | "ru" | "en";
}

/** Har bir ekvayring provayderi shu shartnomani implementatsiya qiladi. */
export interface AcquiringProvider {
  readonly type: AcquiringProviderType;
  /**
   * Mijoz skanerlaydigan checkout havolasini qaytaradi (QR shu havoladan yasaladi).
   * Maxfiy kalit KERAK EMAS — faqat merchant_id (ochiq) bilan ishlaydi.
   */
  buildCheckoutUrl(params: CheckoutUrlParams): string;
}

/** Provayder hali ulanmagan (sandbox kutilmoqda) — aniq xato. */
export class AcquiringNotImplementedError extends Error {
  constructor(provider: AcquiringProviderType) {
    super(`Ekvayring provayder "${provider}" hali ulanmagan.`);
    this.name = "AcquiringNotImplementedError";
  }
}
