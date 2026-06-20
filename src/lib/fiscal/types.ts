import type { FiscalProviderType } from "@/types/database";

/**
 * Fiskal (OFD) abstraksiya qatlami — provayderdan mustaqil shartnoma (S8a).
 *
 * Maqsad: sotuv oqimi qaysi provayder (Payme/CLICK/...) ishlatilishidan
 * qat'i nazar bir xil interfeysga murojaat qiladi. Har provayder o'z
 * adapterini (`FiscalProvider`) implementatsiya qiladi.
 *
 * ⚠️ S8a — bu faqat shartnoma + stub. Real chek yuborish (Payme API) S8b'da,
 * sandbox kredensialdan keyin ulanadi. Hozircha sotuv oqimiga ULANMAGAN.
 */

/** Bitta chek qatori (fiskal talab qiladigan maydonlar). */
export interface FiscalReceiptItem {
  name: string;
  /** MXIK/IKPU tasnif kodi — fiskal uchun shart. */
  mxikCode: string | null;
  packageCode: string | null;
  /** Birlik narxi (so'm, eng kichik birlikda emas — DECIMAL). */
  price: number;
  /** Miqdor (dona uchun butun, kg uchun 3 kasr). */
  quantity: number;
  /** Qator yakuniy summasi (price × quantity). */
  total: number;
  /** QQS stavkasi (foiz, 0 = QQSsiz). */
  vatPercent: number;
}

/** Chek to'lov turi (fiskal hisobotda ajratiladi). */
export type FiscalPaymentType = "cash" | "card" | "qr";

/** Fiskalizatsiya uchun kirish ma'lumoti (bir sotuv = bir chek). */
export interface FiscalReceiptInput {
  shopId: string;
  saleId: string;
  items: FiscalReceiptItem[];
  /** Umumiy summa (so'm). */
  totalAmount: number;
  paymentType: FiscalPaymentType;
  /** Idempotentlik kaliti (offline qayta yuborishda dublikatni oldini oladi). */
  clientId?: string | null;
}

/** Provayder javobi (muvaffaqiyatli fiskalizatsiya). */
export interface FiscalReceiptResult {
  fiscalSign: string;
  receiptNumber: string;
  /** Chekdagi QR (tekshirish havolasi). */
  qrUrl: string;
  /** Provayderdan qaytgan to'liq javob (audit uchun). */
  raw: Record<string, unknown>;
}

/** Provayder maxfiy konfiguratsiyasi (server tomonda olinadi). */
export interface FiscalProviderConfig {
  merchantId: string | null;
  terminalId: string | null;
  secretKey: string;
  extra?: Record<string, unknown> | null;
}

/** Har bir OFD provayderi shu shartnomani implementatsiya qiladi. */
export interface FiscalProvider {
  readonly type: FiscalProviderType;
  /** Chekni fiskalizatsiya qiladi va fiskal belgi + QR qaytaradi. */
  fiscalize(
    input: FiscalReceiptInput,
    config: FiscalProviderConfig
  ): Promise<FiscalReceiptResult>;
}

/** Provayder hali ulanmagan (sandbox kutilmoqda) — aniq xato. */
export class FiscalNotImplementedError extends Error {
  constructor(provider: FiscalProviderType) {
    super(
      `Fiskal provayder "${provider}" hali ulanmagan (S8b — sandbox kredensial kutilmoqda).`
    );
    this.name = "FiscalNotImplementedError";
  }
}
