import type { AcquiringProvider, CheckoutUrlParams } from "./types";

/**
 * Payme (Paycom) ekvayring adapteri — checkout QR havolasi.
 *
 * Payme "Initsializatsiya orqali" usuli: to'lov sahifasi havolasi
 * `https://checkout.paycom.uz/<base64>` ko'rinishida bo'ladi, bu yerda base64
 * `m=<merchant>;ac.order_id=<intent>;a=<tiyin>;c=<return>;l=<lang>` ni kodlaydi.
 * Mijoz shu havoladan yasalgan QR'ni skanerlaydi.
 *
 * Hujjat: https://developer.help.paycom.uz/initsializatsiya-platezhey/
 */

const CHECKOUT_BASE = "https://checkout.paycom.uz/";

/** Isomorfik base64 (server: Buffer, brauzer: btoa). */
function toBase64(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf-8").toString("base64");
  }
  return btoa(unescape(encodeURIComponent(input)));
}

/** so'm (DECIMAL) → tiyin (butun son). Payme summalari tiyinda. */
export function somToTiyin(amount: number): number {
  return Math.round(amount * 100);
}

export const paymeAcquiringProvider: AcquiringProvider = {
  type: "payme",

  buildCheckoutUrl(params: CheckoutUrlParams): string {
    const { intentId, amount, merchantId, returnUrl, lang = "uz" } = params;
    const parts = [
      `m=${merchantId}`,
      `ac.order_id=${intentId}`,
      `a=${somToTiyin(amount)}`,
    ];
    if (returnUrl) parts.push(`c=${returnUrl}`);
    parts.push(`l=${lang}`);
    return CHECKOUT_BASE + toBase64(parts.join(";"));
  },
};
