import { get, set } from "idb-keyval";
import type { SearchMethod } from "@/types/database";
import type { ReceiptLineItem } from "@/lib/receipt-print";
import type { CartSaleItem } from "@/lib/sales";

/** Internetsiz amalga oshirilgan, sinxronlashni kutayotgan sotuv. */
export interface QueuedSale {
  /** Lokal UUID — process_sale_cart p_client_id (idempotent replay). */
  clientId: string;
  shopId: string;
  items: CartSaleItem[];
  method: SearchMethod;
  customerId: string | null;
  paidAmount: number | null;
  // Chek + navbat ro'yxati uchun snapshot (savat tozalangach ham ko'rsatiladi)
  receiptItems: ReceiptLineItem[];
  totalRevenue: number;
  customerName: string | null;
  createdAt: string;
  status: "pending" | "failed";
  error?: string;
}

const QUEUE_KEY = "shopscan-offline-sales";

// ============================================================
// Sof (IDB'siz) ro'yxat operatsiyalari — unit-test qilinadi
// ============================================================

/** Qo'shadi yoki shu clientId mavjud bo'lsa almashtiradi. */
export function upsertSale(list: QueuedSale[], sale: QueuedSale): QueuedSale[] {
  const idx = list.findIndex((s) => s.clientId === sale.clientId);
  if (idx === -1) return [...list, sale];
  const copy = [...list];
  copy[idx] = sale;
  return copy;
}

export function removeSale(list: QueuedSale[], clientId: string): QueuedSale[] {
  return list.filter((s) => s.clientId !== clientId);
}

export function patchSale(
  list: QueuedSale[],
  clientId: string,
  patch: Partial<QueuedSale>
): QueuedSale[] {
  return list.map((s) => (s.clientId === clientId ? { ...s, ...patch } : s));
}

export function countByStatus(list: QueuedSale[]): { pending: number; failed: number } {
  let pending = 0;
  let failed = 0;
  for (const s of list) {
    if (s.status === "pending") pending++;
    else if (s.status === "failed") failed++;
  }
  return { pending, failed };
}

// ============================================================
// IndexedDB (idb-keyval) — navbatni saqlash/o'qish
// ============================================================

export async function loadQueue(): Promise<QueuedSale[]> {
  const data = await get<QueuedSale[]>(QUEUE_KEY);
  return Array.isArray(data) ? data : [];
}

export async function persistQueue(list: QueuedSale[]): Promise<void> {
  await set(QUEUE_KEY, list);
}
