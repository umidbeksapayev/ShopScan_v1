import { createClient } from "@/lib/supabase/client";
import { normalizeBarcode } from "@/lib/utils";
import type { Product, SaleType } from "@/types/database";

export interface ProductFilters {
  search?: string;
  saleType?: SaleType | "all";
  sortBy?: "created_at" | "name" | "selling_price" | "quantity";
  sortDir?: "asc" | "desc";
  /** Faol do'kon bo'yicha qat'iy filtr (a'zo bir nechta do'konda bo'lsa kerak). */
  shopId?: string;
}

export interface CreateProductInput {
  shop_id: string;
  name: string;
  sale_type: SaleType;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_alert: number;
  barcode?: string | null;
  image_url: string | null;
}

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, "shop_id">
> & { id: string };

/**
 * Faol mahsulotlar ro'yxati (RLS avtomatik shop_id bo'yicha filtrlaydi).
 */
export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = createClient();
  let query = supabase.from("products").select("*").eq("is_active", true);

  if (filters.shopId) {
    query = query.eq("shop_id", filters.shopId);
  }
  if (filters.search && filters.search.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }
  if (filters.saleType && filters.saleType !== "all") {
    query = query.eq("sale_type", filters.saleType);
  }

  const sortBy = filters.sortBy ?? "created_at";
  const ascending = (filters.sortDir ?? "desc") === "asc";
  query = query.order(sortBy, { ascending });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      shop_id: input.shop_id,
      name: input.name,
      sale_type: input.sale_type,
      cost_price: input.cost_price,
      selling_price: input.selling_price,
      quantity: input.quantity,
      low_stock_alert: input.low_stock_alert,
      barcode: input.barcode ? normalizeBarcode(input.barcode) : null,
      image_url: input.image_url,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  const supabase = createClient();
  const { id, ...fields } = input;
  // Barcode normalizatsiyasi (bo'sh string → null)
  if ("barcode" in fields) {
    fields.barcode = fields.barcode ? normalizeBarcode(fields.barcode) : null;
  }
  const { data, error } = await supabase
    .from("products")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

/**
 * Mahsulotni o'chirmasdan arxivlaydi (is_active = false).
 */
export async function archiveProduct(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
