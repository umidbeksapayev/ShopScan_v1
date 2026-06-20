import type { FiscalProviderType } from "@/types/database";
import type { FiscalProvider } from "./types";
import { paymeFiscalProvider } from "./payme";

export * from "./types";

/**
 * Fiskal provayder reyestri (factory). Yangi provayder qo'shilganda shu yerga
 * adapteri kiritiladi. Tanlanmagan/ulanmagan provayder → null.
 *
 * ⚠️ S8a: faqat Payme stub ro'yxatga olingan. CLICK/Multikassa S8b+.
 */
const PROVIDERS: Partial<Record<FiscalProviderType, FiscalProvider>> = {
  payme: paymeFiscalProvider,
};

/** Tanlangan provayder turiga mos adapterni qaytaradi (yo'q bo'lsa null). */
export function getFiscalProvider(
  type: FiscalProviderType | null | undefined
): FiscalProvider | null {
  if (!type) return null;
  return PROVIDERS[type] ?? null;
}
