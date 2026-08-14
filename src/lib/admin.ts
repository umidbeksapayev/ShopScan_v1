import { createClient } from "@/lib/supabase/client";

export interface AdminOverview {
  users_count: number;
  shops_count: number;
  products_count: number;
  sales_count: number;
  total_revenue: number;
}

export interface AdminShop {
  shop_id: string;
  name: string;
  owner_email: string;
  created_at: string;
  product_count: number;
  sales_count: number;
  revenue: number;
}

/** Umumiy admin ko'rsatkichlari (admin_overview RPC — super_admin gated). */
export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_overview");
  if (error) throw new Error(error.message);
  return data as AdminOverview;
}

/** Barcha do'konlar + egasi + statistika (admin_shops RPC — super_admin gated). */
export async function getAdminShops(): Promise<AdminShop[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_shops");
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminShop[];
}

export type PlanCode = "free" | "pro" | "ultra";
export type BillingPeriod = "month" | "year";

/**
 * Do'kon tarifini qo'lda belgilaydi (041_subscriptions.sql →
 * `admin_set_plan` RPC, super_admin gated). MVP'da to'lov ilovada YO'Q —
 * mijoz Telegram/qo'ng'iroq orqali so'raydi, admin shu forma bilan tasdiqlab
 * yoqadi.
 */
export async function setAdminPlan(params: {
  shopId: string;
  planCode: PlanCode;
  period: BillingPeriod;
  months: number;
  note?: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_set_plan", {
    p_shop_id: params.shopId,
    p_plan_code: params.planCode,
    p_period: params.period,
    p_months: params.months,
    p_note: params.note || null,
  });
  if (error) throw new Error(error.message);
}
