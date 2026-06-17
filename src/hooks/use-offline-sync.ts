"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useOfflineSyncStore } from "@/stores/offline-sync-store";
import { processCartSale } from "@/lib/sales";

/**
 * Offline sotuv navbatini sinxronlash dvigateli. Online bo'lganda navbatdagi
 * sotuvlarni KETMA-KET process_sale_cart orqali yuboradi (client_id bilan →
 * idempotent). Muvaffaqiyat → navbatdan o'chadi; xato (masalan inventar
 * yetmaydi) → `failed` belgilanadi (qo'lda hal qilinadi). Bitta martada bitta
 * sinxronlash (runningRef).
 */
export function useOfflineSync() {
  const online = useOnlineStatus();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const sales = useOfflineSyncStore((s) => s.sales);
  const hydrated = useOfflineSyncStore((s) => s.hydrated);
  const hydrate = useOfflineSyncStore((s) => s.hydrate);
  const remove = useOfflineSyncStore((s) => s.remove);
  const fail = useOfflineSyncStore((s) => s.fail);
  const setSyncing = useOfflineSyncStore((s) => s.setSyncing);
  const runningRef = useRef(false);

  // Ilova ochilganda navbatni IDB'dan yuklaymiz
  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!online || !hydrated || runningRef.current) return;
    const pending = sales.filter((s) => s.status === "pending");
    if (pending.length === 0) return;

    runningRef.current = true;
    setSyncing(true);

    (async () => {
      let ok = 0;
      let failed = 0;
      for (const sale of pending) {
        try {
          await processCartSale(sale.shopId, sale.items, sale.method, {
            customerId: sale.customerId,
            paidAmount: sale.paidAmount,
            clientId: sale.clientId,
          });
          await remove(sale.clientId);
          ok++;
        } catch (err) {
          await fail(sale.clientId, err instanceof Error ? err.message : String(err));
          failed++;
        }
      }

      setSyncing(false);
      runningRef.current = false;

      if (ok > 0) {
        qc.invalidateQueries({ queryKey: ["products"] });
        qc.invalidateQueries({ queryKey: ["sales"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
        toast.success(t("sync.synced", { count: ok }));
      }
      if (failed > 0) {
        toast.error(t("sync.failedToast", { count: failed }));
      }
    })();
  }, [online, hydrated, sales, qc, t, remove, fail, setSyncing]);
}
