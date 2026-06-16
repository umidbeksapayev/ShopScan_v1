import { createClient } from "@/lib/supabase/client";

/** Qaytarish mumkin bo'lgan miqdor (sotilgan − allaqachon qaytarilgan). Sof funksiya. */
export function returnableQty(soldQty: number, alreadyReturned: number): number {
  return Math.max(0, soldQty - alreadyReturned);
}

export interface ReturnLineInput {
  sale_item_id: string;
  quantity: number;
}

export interface ProcessReturnInput {
  shopId: string;
  saleId: string;
  items: ReturnLineInput[];
  reason?: string | null;
}

export interface ProcessReturnResult {
  return_id: string;
  total_refund: number;
  total_profit: number;
}

/** Sotuvni (to'liq/qisman) qaytarish — process_return RPC (atomar). */
export async function processReturn(
  input: ProcessReturnInput
): Promise<ProcessReturnResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("process_return", {
    p_shop_id: input.shopId,
    p_sale_id: input.saleId,
    p_items: input.items,
    p_reason: input.reason ?? null,
  });
  if (error) throw new Error(error.message);
  return data as ProcessReturnResult;
}

/** Sotuv bo'yicha har bir sale_item uchun allaqachon qaytarilgan jami miqdor. */
export async function getReturnedQuantities(
  saleId: string
): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("return_items")
    .select("sale_item_id, quantity")
    .eq("sale_id", saleId);
  if (error) throw new Error(error.message);

  const map: Record<string, number> = {};
  for (const row of (data ?? []) as { sale_item_id: string; quantity: number }[]) {
    map[row.sale_item_id] = (map[row.sale_item_id] ?? 0) + row.quantity;
  }
  return map;
}
