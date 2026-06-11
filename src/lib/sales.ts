import { createClient } from "@/lib/supabase/client";
import { normalizeBarcode } from "@/lib/utils";
import type { Product, SearchMethod } from "@/types/database";

/**
 * Barcode bo'yicha mahsulot(lar)ni topadi.
 * Bir nechta mos kelsa, eng yangi 3 tagacha qaytaradi (foydalanuvchi tanlaydi).
 * Faqat faol va qoldig'i bor mahsulotlar.
 */
export async function findProductsByBarcode(barcode: string): Promise<Product[]> {
  const supabase = createClient();
  const normalized = normalizeBarcode(barcode);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", normalized)
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

/**
 * Vizual qidiruv (CLIP): kameradan olingan rasmga eng o'xshash mahsulotlarni topadi.
 * Embedding BRAUZERDA hisoblanadi (Transformers.js), keyin match_products RPC chaqiriladi.
 * Bepul — API/token/to'lov kerak emas.
 * @param shopId - joriy do'kon id'si
 * @param imageDataUri - "data:image/...;base64,..." formatida
 */
export async function searchProductsByImage(
  shopId: string,
  imageDataUri: string
): Promise<Product[]> {
  const { embedImage } = await import("@/lib/clip-browser");
  const embedding = await embedImage(imageDataUri);

  const supabase = createClient();
  const { data, error } = await supabase.rpc("match_products", {
    p_shop_id: shopId,
    p_embedding: JSON.stringify(embedding),
    p_match_count: 3,
    // Past o'xshashlikdagi (bog'liq bo'lmagan) natijalarni chiqarib tashlaymiz
    p_threshold: 0.2,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export interface CartSaleItem {
  product_id: string;
  quantity: number;
}

export interface CartSaleResult {
  sale_ids: string[];
  item_count: number;
  total_revenue: number;
  total_profit: number;
}

/**
 * Savatdagi barcha mahsulotlarni atomar sotadi (process_sale_cart RPC).
 */
export async function processCartSale(
  shopId: string,
  items: CartSaleItem[],
  method: SearchMethod
): Promise<CartSaleResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("process_sale_cart", {
    p_shop_id: shopId,
    p_items: items,
    p_search_method: method,
  });

  if (error) throw new Error(error.message);
  return data as CartSaleResult;
}
