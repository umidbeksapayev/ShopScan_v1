"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdateAvailable } from "@/hooks/use-app-update";

/**
 * Native APK eskirgan bo'lsa "yangilanish bor" banneri (yangi APK havolasi).
 * Faqat native + server versiyasi > o'rnatilgan bo'lganda ko'rinadi.
 */
export function UpdateBanner() {
  const { t } = useTranslation();
  const { available, apkUrl } = useUpdateAvailable();
  const [dismissed, setDismissed] = useState(false);

  if (!available || !apkUrl || dismissed) return null;

  return (
    <div className="flex items-center gap-2 bg-brand-gradient px-4 py-2 text-sm text-primary-foreground">
      <Download className="h-4 w-4 shrink-0" />
      <span className="flex-1">{t("app.updateAvailable")}</span>
      <a
        href={apkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg bg-white/20 px-3 py-1 font-medium transition-colors hover:bg-white/30"
      >
        {t("app.updateBtn")}
      </a>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("app.dismiss")}
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
