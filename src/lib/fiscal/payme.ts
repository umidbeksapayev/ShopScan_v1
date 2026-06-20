import {
  FiscalNotImplementedError,
  type FiscalProvider,
  type FiscalProviderConfig,
  type FiscalReceiptInput,
  type FiscalReceiptResult,
} from "./types";

/**
 * Payme (Smart Pay) fiskal adapteri — STUB (S8a).
 *
 * S8b'da quyidagilar to'ldiriladi (sandbox kredensialdan keyin):
 *  - Payme fiskalizatsiya endpoint(lar)i va autentifikatsiyasi
 *  - FiscalReceiptInput → Payme JSON sxemasiga map (items[].SPIC/MXIK,
 *    PackageCode, VAT, GoodPrice, ...)
 *  - Javobdan fiscalSign / receiptNumber / qrUrl ajratish
 *  - Xato/timeout → qayta urinish (fiscal_receipts.status='failed', retry_count)
 *
 * ⚠️ Hozir chaqirilsa ataylab FiscalNotImplementedError tashlaydi — jim ishlamaydi.
 */
export const paymeFiscalProvider: FiscalProvider = {
  type: "payme",

  async fiscalize(
    _input: FiscalReceiptInput,
    _config: FiscalProviderConfig
  ): Promise<FiscalReceiptResult> {
    throw new FiscalNotImplementedError("payme");
  },
};
