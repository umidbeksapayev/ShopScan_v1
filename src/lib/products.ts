import { createClient } from "@/lib/supabase/client";
import { normalizeBarcode } from "@/lib/utils";
import type { Product, SaleType } from "@/types/database";
import type { ImportPayloadRow } from "@/lib/import-products";

export interface ProductFilters {
  search?: string;
  saleType?: SaleType | "all";
  /** Kategoriya filtri: kategoriya id, "all" (barchasi) yoki "none" (kategoriyasiz). */
  categoryId?: string | "all" | "none";
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
  category_id?: string | null;
  /** Fiskal (ixtiyoriy) — migration 024. */
  mxik_code?: string | null;
  package_code?: string | null;
  vat_percent?: number;
}

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, "shop_id">
> & { id: string };

/**
 * Faol mahsulotlar ro'yxati (RLS avtomatik shop_id bo'yicha filtrlaydi).
 */
export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select("*, category:categories(name)")
    .eq("is_active", true);

  if (filters.shopId) {
    query = query.eq("shop_id", filters.shopId);
  }
  if (filters.search && filters.search.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }
  if (filters.saleType && filters.saleType !== "all") {
    query = query.eq("sale_type", filters.saleType);
  }
  if (filters.categoryId && filters.categoryId !== "all") {
    query =
      filters.categoryId === "none"
        ? query.is("category_id", null)
        : query.eq("category_id", filters.categoryId);
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
      category_id: input.category_id ?? null,
      mxik_code: input.mxik_code ?? null,
      package_code: input.package_code ?? null,
      vat_percent: input.vat_percent ?? 0,
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

/** Do'kondagi mavjud barcode'lar (import preview'da dublikat belgilash uchun). */
export async function listExistingBarcodes(shopId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("barcode")
    .eq("shop_id", shopId)
    .not("barcode", "is", null);
  if (error) throw new Error(error.message);
  return new Set(
    (data ?? []).map((r) => (r as { barcode: string | null }).barcode).filter(Boolean) as string[]
  );
}

export interface ImportResult {
  inserted: number;
  skipped: number;
  categories_created: number;
}

/** Ommaviy import (import_products RPC — atomar, server-tomon validatsiya). */
export async function importProducts(
  shopId: string,
  rows: ImportPayloadRow[]
): Promise<ImportResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("import_products", {
    p_shop_id: shopId,
    p_rows: rows,
  });
  if (error) throw new Error(error.message);
  return data as ImportResult;
}
