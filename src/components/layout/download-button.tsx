"use client";

import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsNative, useAppVersion } from "@/hooks/use-app-update";

/**
 * Topbar'dagi "Android ilovasini yuklab olish" belgisi.
 * Faqat WEB'da ko'rinadi — native APK ichida (allaqachon o'rnatilgan) yashiriladi.
 */
export function DownloadButton() {
  const { t } = useTranslation();
  const native = useIsNative();
  const { data } = useAppVersion();

  if (native || !data?.apkUrl) return null;

  return (
    <a
      href={data.apkUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("app.download")}
      title={t("app.download")}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Download className="h-5 w-5" />
    </a>
  );
}
