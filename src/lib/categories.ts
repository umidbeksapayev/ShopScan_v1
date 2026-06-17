import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryWithCount } from "@/types/database";

/**
 * Do'kon kategoriyalari + har biriga tegishli mahsulotlar soni.
 * RLS o'qishni avtomatik do'kon a'zoligi bo'yicha cheklaydi; shopId filtri
 * a'zo bir nechta do'konda bo'lsa faol do'konni ajratadi.
 */
export async function listCategories(shopId?: string): Promise<CategoryWithCount[]> {
  const supabase = createClient();
  let query = supabase
    .from("categories")
    .select("id, shop_id, name, created_at, products(count)")
    .order("name", { ascending: true });

  if (shopId) query = query.eq("shop_id", shopId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => {
    // Supabase nested-count: products → [{ count: N }]
    const rel = (c as { products?: { count: number }[] }).products;
    const product_count = Array.isArray(rel) && rel[0] ? rel[0].count : 0;
    return {
      id: c.id,
      shop_id: c.shop_id,
      name: c.name,
      created_at: c.created_at,
      product_count,
    };
  });
}

export async function createCategory(shopId: string, name: string): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ shop_id: shopId, name: name.trim() })
    .select("id, shop_id, name, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function renameCategory(id: string, name: string): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ name: name.trim() })
    .eq("id", id)
    .select("id, shop_id, name, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

/** Kategoriyani o'chiradi; tegishli mahsulotlarning category_id → NULL (FK ON DELETE SET NULL). */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
