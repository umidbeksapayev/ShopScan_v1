import { createClient } from "@/lib/supabase/server";
import type { Shop } from "@/types/database";

/**
 * Joriy foydalanuvchining do'konini qaytaradi (server-side).
 * shop_id ni olishning yagona manbai — boshqa server kodlar shuni ishlatadi.
 */
export async function getCurrentShop(): Promise<Shop | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (error) return null;
  return data as Shop;
}
