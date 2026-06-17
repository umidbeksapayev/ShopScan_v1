import { createClient } from "@/lib/supabase/client";
import { normalizeBarcode } from "@/lib/utils";
import type { Product, SearchMethod } from "@/types/database";

/**
 * Barcode bo'yicha mahsulot(lar)ni topadi.
 * Bir nechta mos kelsa, eng yangi 3 tagacha qaytaradi (foydalanuvchi tanlaydi).
 * Faqat faol va qoldig'i bor mahsulotlar.
 */
export async function findProductsByBarcode(
  barcode: string,
  shopId: string
): Promise<Product[]> {
  const supabase = createClient();
  const normalized = normalizeBarcode(barcode);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", normalized)
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .gt("quantity", 0)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

/**
 * Nom bo'yicha qo'lda qidiruv (barcode topilmaganda fallback — FR-22).
 */
export async function searchProductsByName(term: string): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${term.trim()}%`)
    .eq("is_active", true)
    .gt("quantity", 0)
    .limit(10);

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export interface CartSaleItem {
  product_id: string;
  quantity: number;
}

export interface CartSaleResult {
  sale_id: string;
  item_count: number;
  total_revenue: number;
  total_profit: number;
  paid_amount: number;
  debt: number;
}

export interface ProcessCartOptions {
  /** Nasiya sotuv uchun mijoz (null → naqd sotuv). */
  customerId?: string | null;
  /** To'langan summa (null → to'liq to'lov). Mijozsiz sotuvda e'tiborga olinmaydi. */
  paidAmount?: number | null;
  /** Lokal sotuv id (offline navbat replay'ida idempotentlik — ikki marta yozilmaydi). */
  clientId?: string | null;
}

/**
 * Savatdagi barcha mahsulotlarni atomar sotadi (process_sale_cart RPC).
 * Mijoz + qisman to'lov berilsa — qolgani qarzga yoziladi.
 */
export async function processCartSale(
  shopId: string,
  items: CartSaleItem[],
  method: SearchMethod,
  options: ProcessCartOptions = {}
): Promise<CartSaleResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("process_sale_cart", {
    p_shop_id: shopId,
    p_items: items,
    p_search_method: method,
    p_customer_id: options.customerId ?? null,
    p_paid_amount: options.paidAmount ?? null,
    p_client_id: options.clientId ?? null,
  });

  if (error) throw new Error(error.message);
  return data as CartSaleResult;
}
