import { createClient } from "@/lib/supabase/client";
import type {
  Shop,
  MemberRole,
  MemberPermissions,
  PermissionKey,
  ShopMemberRow,
} from "@/types/database";

export interface Membership {
  shop: Shop;
  role: MemberRole;
  permissions: MemberPermissions;
}

/**
 * Ruxsat tekshiruvi (sof funksiya). Ega → har doim true; kassir → faqat
 * yoqilgan ruxsat. UI va testda ishlatiladi (DB tomonida has_perm bilan mos).
 */
export function canDo(
  role: MemberRole | undefined,
  permissions: MemberPermissions | undefined,
  perm: PermissionKey
): boolean {
  if (!role) return false;
  if (role === "owner") return true;
  return permissions?.[perm] === true;
}

/**
 * Joriy foydalanuvchining BARCHA a'zoliklari (do'kon + rol + ruxsatlar).
 * Eng yangi qo'shilgani birinchi (kassir sifatida qo'shilgan do'kon o'z
 * avtomatik do'konidan oldin keladi) — default faol do'kon shu bo'ladi.
 */
export async function getMyMemberships(): Promise<Membership[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("shop_members")
    .select("role, permissions, shop:shops(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((d) => d.shop)
    .map((d) => ({
      shop: d.shop as unknown as Shop,
      role: d.role as MemberRole,
      permissions: (d.permissions ?? {}) as MemberPermissions,
    }));
}

/** Xodimlar ro'yxati (email + rol + ruxsat) — faqat ega. */
export async function listShopMembers(shopId: string): Promise<ShopMemberRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_shop_members", {
    p_shop_id: shopId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShopMemberRow[];
}

/** Email orqali xodim biriktirish (mavjud foydalanuvchi). */
export async function addShopMember(
  shopId: string,
  email: string,
  role: MemberRole = "cashier"
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_shop_member", {
    p_shop_id: shopId,
    p_email: email.trim(),
    p_role: role,
  });
  if (error) throw new Error(error.message);
}

export async function removeShopMember(
  shopId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("remove_shop_member", {
    p_shop_id: shopId,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export async function setMemberPermissions(
  shopId: string,
  userId: string,
  permissions: MemberPermissions
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_member_permissions", {
    p_shop_id: shopId,
    p_user_id: userId,
    p_permissions: permissions,
  });
  if (error) throw new Error(error.message);
}
