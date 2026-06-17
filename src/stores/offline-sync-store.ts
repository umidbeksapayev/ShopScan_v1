import { create } from "zustand";
import {
  type QueuedSale,
  loadQueue,
  persistQueue,
  upsertSale,
  removeSale,
  patchSale,
} from "@/lib/offline-queue";

interface OfflineSyncState {
  sales: QueuedSale[];
  syncing: boolean;
  hydrated: boolean;
  /** IDB'dan navbatni yuklaydi (ilova ochilganda bir marta). */
  hydrate: () => Promise<void>;
  /** Yangi offline sotuvni navbatga qo'shadi. */
  enqueue: (sale: QueuedSale) => Promise<void>;
  /** Muvaffaqiyatli sinxronlangandan keyin o'chiradi. */
  remove: (clientId: string) => Promise<void>;
  /** Sinxronlash xatosi (masalan inventar yetmaydi). */
  fail: (clientId: string, error: string) => Promise<void>;
  /** Qayta urinish — `failed` → `pending`. */
  retry: (clientId: string) => Promise<void>;
  setSyncing: (v: boolean) => void;
}

async function commit(
  set: (partial: Partial<OfflineSyncState>) => void,
  sales: QueuedSale[]
) {
  set({ sales });
  await persistQueue(sales);
}

export const useOfflineSyncStore = create<OfflineSyncState>((set, getStore) => ({
  sales: [],
  syncing: false,
  hydrated: false,

  hydrate: async () => {
    if (getStore().hydrated) return;
    const sales = await loadQueue();
    set({ sales, hydrated: true });
  },

  enqueue: async (sale) => {
    await commit(set, upsertSale(getStore().sales, sale));
  },

  remove: async (clientId) => {
    await commit(set, removeSale(getStore().sales, clientId));
  },

  fail: async (clientId, error) => {
    await commit(set, patchSale(getStore().sales, clientId, { status: "failed", error }));
  },

  retry: async (clientId) => {
    await commit(
      set,
      patchSale(getStore().sales, clientId, { status: "pending", error: undefined })
    );
  },

  setSyncing: (syncing) => set({ syncing }),
}));
