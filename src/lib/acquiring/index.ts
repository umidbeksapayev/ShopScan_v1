import type { AcquiringProviderType } from "@/types/database";
import type { AcquiringProvider } from "./types";
import { paymeAcquiringProvider } from "./payme";

export * from "./types";

/**
 * Ekvayring provayder reyestri (factory). Yangi provayder qo'shilganda shu yerga
 * adapteri kiritiladi — xuddi lib/fiscal naqshidek.
 *
 * ⚠️ v5 S1: faqat Payme ulangan. Click/Uzum keyingi sprintda shu yerga qo'shiladi.
 */
const PROVIDERS: Partial<Record<AcquiringProviderType, AcquiringProvider>> = {
  payme: paymeAcquiringProvider,
};

/** Tanlangan provayder turiga mos adapterni qaytaradi (yo'q bo'lsa null). */
export function getAcquiringProvider(
  type: AcquiringProviderType | null | undefined
): AcquiringProvider | null {
  if (!type) return null;
  return PROVIDERS[type] ?? null;
}

/** Hozir ulangan (ishlaydigan) provayderlar ro'yxati — UI uchun. */
export function enabledAcquiringProviders(): AcquiringProviderType[] {
  return Object.keys(PROVIDERS) as AcquiringProviderType[];
}
