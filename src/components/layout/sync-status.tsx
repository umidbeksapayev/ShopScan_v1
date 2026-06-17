"use client";

import { useState } from "react";
import { Loader2, CloudOff, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { useOfflineSyncStore } from "@/stores/offline-sync-store";
import { countByStatus } from "@/lib/offline-queue";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Offline sotuv navbati holati (offline banner ostida). Sinxronlash dvigatelini
 * ishga tushiradi va navbat/xato sonini ko'rsatadi; `failed` sotuvlarni dialogda
 * qayta urinish / bekor qilish mumkin.
 */
export function SyncStatus() {
  useOfflineSync(); // sinxronlash dvigateli (online bo'lganda replay)
  const { t } = useTranslation();
  const sales = useOfflineSyncStore((s) => s.sales);
  const syncing = useOfflineSyncStore((s) => s.syncing);
  const retry = useOfflineSyncStore((s) => s.retry);
  const remove = useOfflineSyncStore((s) => s.remove);
  const [open, setOpen] = useState(false);

  const { pending, failed } = countByStatus(sales);
  if (pending === 0 && failed === 0) return null;

  const failedSales = sales.filter((s) => s.status === "failed");

  return (
    <>
      <div className="flex items-center justify-center gap-2 bg-sky-600 px-4 py-1.5 text-center text-sm font-medium text-white">
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            {t("sync.syncing", { count: pending })}
          </>
        ) : failed > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 underline-offset-2 hover:underline"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("sync.failedStrip", { count: failed })}
          </button>
        ) : (
          <>
            <CloudOff className="h-4 w-4 shrink-0" />
            {t("sync.queued", { count: pending })}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sync.failedTitle")}</DialogTitle>
            <DialogDescription>{t("sync.failedHint")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto">
            {failedSales.map((s) => (
              <div key={s.clientId} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(s.totalRevenue)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </span>
                </div>
                {s.error && <p className="mt-1 text-xs text-destructive">{s.error}</p>}
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => retry(s.clientId)}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" /> {t("sync.retry")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(s.clientId)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> {t("sync.discard")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
