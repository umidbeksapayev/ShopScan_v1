"use client";

import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks/use-online-status";

/** Internet uzilganda ko'rinadigan ingichka banner (dashboard layout tepasida). */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useTranslation();
  if (online) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-white">
      <WifiOff className="h-4 w-4 shrink-0" />
      {t("offline.banner")}
    </div>
  );
}
