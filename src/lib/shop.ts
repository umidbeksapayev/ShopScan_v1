import { createClient } from "@/lib/supabase/server";
import type { Shop } from "@/types/database";

/**
 * Joriy foydalanuvchining do'konini qaytaradi (server-side, a'zolik orqali).
 * Ega ham, kassir ham shu orqali o'z do'konini oladi.
 */
export async function getCurrentShop(): Promise<Shop | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("shop_members")
    .select("shop:shops(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data?.shop) return null;
  return data.shop as unknown as Shop;
}
