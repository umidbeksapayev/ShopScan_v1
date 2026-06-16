import { createClient } from "@/lib/supabase/client";
import type { DashboardStats, Sale, Product } from "@/types/database";

export interface SalesTrendPoint {
  day: string; // "YYYY-MM-DD"
  revenue: number;
  profit: number;
  sales_count: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  image_url: string | null;
  sale_type: "unit" | "weight";
  units_sold: number;
  revenue: number;
  profit: number;
}

/** Bugungi tushum / foyda / sotuvlar soni + kam qoldiq mahsulotlar soni. */
export async function getDashboardStats(shopId: string): Promise<DashboardStats> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    p_shop_id: shopId,
  });
  if (error) throw new Error(error.message);
  return data as DashboardStats;
}

/** Oxirgi N kun kunlik tushum/foyda trendi (bo'sh kunlar 0). */
export async function getSalesTrend(
  shopId: string,
  days = 7
): Promise<SalesTrendPoint[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_sales_trend", {
    p_shop_id: shopId,
    p_days: days,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as SalesTrendPoint[];
}

/** Oxirgi N kun eng ko'p tushum keltirgan mahsulotlar. */
export async function getTopProducts(
  shopId: string,
  days = 30,
  limit = 5
): Promise<TopProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_top_products", {
    p_shop_id: shopId,
    p_days: days,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as TopProduct[];
}

/** Kam qolgan mahsulotlar (quantity <= low_stock_alert). RLS faqat o'z do'koni. */
export async function getLowStockProducts(): Promise<Product[]> {
  const supabase = createClient();
  // Supabase ustun-ustun taqqoslashni qo'llamaydi → faol mahsulotlarni olib client'da filtrlaymiz
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("quantity", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as Product[]).filter(
    (p) => p.quantity <= p.low_stock_alert
  );
}

/** Sotuv tarixi — eng yangi sotuvlar (mahsulot nomi/rasmi bilan). */
export async function getSalesHistory(limit = 50): Promise<Sale[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*, product:products(name, image_url, sale_type)")
    .order("sold_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Sale[];
}
