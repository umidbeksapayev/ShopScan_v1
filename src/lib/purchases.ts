import { createClient } from "@/lib/supabase/client";
import type { Purchase } from "@/types/database";

/**
 * O'rtacha (weighted average) tan narx — process_purchase SQL bilan bir xil.
 * Sof funksiya (UI preview va testda ishlatiladi).
 */
export function weightedAvgCost(
  oldQty: number,
  oldCost: number,
  inQty: number,
  inCost: number
): number {
  const totalQty = oldQty + inQty;
  if (totalQty <= 0) return inCost;
  return (oldQty * oldCost + inQty * inCost) / totalQty;
}

/** Bitta kirim qatori jami. */
export function lineTotal(qty: number, cost: number): number {
  return qty * cost;
}

export interface PurchaseLineInput {
  product_id: string;
  quantity: number;
  cost_price: number;
}

export interface ProcessPurchaseInput {
  shopId: string;
  supplierId?: string | null;
  items: PurchaseLineInput[];
  note?: string | null;
}

export interface ProcessPurchaseResult {
  purchase_id: string;
  total: number;
}

/** Mahsulot kirimi — process_purchase RPC (atomar: inventar +qty, o'rtacha tan narx). */
export async function processPurchase(
  input: ProcessPurchaseInput
): Promise<ProcessPurchaseResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("process_purchase", {
    p_shop_id: input.shopId,
    p_supplier_id: input.supplierId ?? null,
    p_items: input.items,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as ProcessPurchaseResult;
}

/** Kirim tarixi (ta'minotchi nomi + qatorlar bilan). */
export async function getPurchases(
  shopId: string,
  limit = 50
): Promise<Purchase[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select(
      "*, supplier:suppliers(name), items:purchase_items(*, product:products(name, image_url, sale_type))"
    )
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Purchase[];
}
