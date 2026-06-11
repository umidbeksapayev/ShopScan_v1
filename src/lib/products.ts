import { createClient } from "@/lib/supabase/client";
import { normalizeBarcode } from "@/lib/utils";
import type { Product, SaleType } from "@/types/database";

export interface ProductFilters {
  search?: string;
  saleType?: SaleType | "all";
  sortBy?: "created_at" | "name" | "selling_price" | "quantity";
  sortDir?: "asc" | "desc";
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
  image_url: string;
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

/**
 * Mahsulot rasmidan CLIP embedding hisoblab, product_embeddings jadvaliga qo'shadi.
 * Bitta mahsulotga bir nechta rasm (multi-image) — har biri alohida qator.
 * RLS faqat egasiga ruxsat beradi. CLIP lib lazy-load qilinadi.
 * @param productId - mahsulot id'si
 * @param shopId - do'kon id'si
 * @param source - Blob (yangi yuklangan) yoki image_url (string, backfill uchun)
 * @param imageUrl - saqlanadigan rasm URL (ixtiyoriy)
 */
export async function addProductEmbedding(
  productId: string,
  shopId: string,
  source: Blob | string,
  imageUrl?: string | null
): Promise<void> {
  const { embedImage } = await import("@/lib/clip-browser");
  const embedding = await embedImage(source);

  const supabase = createClient();
  const { error } = await supabase.from("product_embeddings").insert({
    product_id: productId,
    shop_id: shopId,
    image_url: imageUrl ?? null,
    embedding: JSON.stringify(embedding),
  });
  if (error) throw new Error(error.message);
}

/** Mahsulotning barcha embeddinglarini o'chiradi (rasm yangilanganda qayta indekslash uchun). */
export async function clearProductEmbeddings(productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("product_embeddings")
    .delete()
    .eq("product_id", productId);
  if (error) throw new Error(error.message);
}

/**
 * Bir nechta rasmni ketma-ket indekslaydi (multi-image).
 * @param images - {source, imageUrl} ro'yxati
 */
export async function indexProductImages(
  productId: string,
  shopId: string,
  images: { source: Blob | string; imageUrl?: string | null }[]
): Promise<void> {
  for (const img of images) {
    await addProductEmbedding(productId, shopId, img.source, img.imageUrl ?? null);
  }
}

/** Hali indekslanmagan (product_embeddings'da qatori yo'q) faol mahsulotlar. */
export async function getUnindexedProducts(): Promise<
  Pick<Product, "id" | "image_url">[]
> {
  const supabase = createClient();
  const [prodsRes, embsRes] = await Promise.all([
    supabase.from("products").select("id, image_url").eq("is_active", true),
    supabase.from("product_embeddings").select("product_id"),
  ]);
  if (prodsRes.error) throw new Error(prodsRes.error.message);
  if (embsRes.error) throw new Error(embsRes.error.message);

  const indexed = new Set(
    (embsRes.data ?? []).map((e: { product_id: string }) => e.product_id)
  );
  return ((prodsRes.data ?? []) as Pick<Product, "id" | "image_url">[]).filter(
    (p) => !indexed.has(p.id)
  );
}
