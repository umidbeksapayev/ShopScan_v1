"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { LANG_STORAGE_KEY } from "@/i18n/config";

/**
 * i18n provider. Birinchi render server bilan bir xil (default uz-Latn) bo'lib,
 * mount'dan keyin localStorage'dagi til qo'llanadi — hydration mismatch bo'lmaydi.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && stored !== i18n.language) {
      i18n.changeLanguage(stored);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
