import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

/**
 * Rasmni public bucket ga yuklaydi va public URL qaytaradi.
 * Papka konvensiyasi: "{shopId}/{uuid}.{ext}" — Storage RLS shop_id papkasini tekshiradi.
 */
export async function uploadProductImage(
  file: File | Blob,
  shopId: string
): Promise<string> {
  const supabase = createClient();
  const ext = file instanceof File ? file.name.split(".").pop() ?? "webp" : "webp";
  const path = `${shopId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/webp",
  });

  if (error) throw new Error(`Rasm yuklashda xato: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Public URL dan storage path ni ajratib, rasmni o'chiradi.
 */
export async function deleteProductImage(publicUrl: string): Promise<void> {
  const supabase = createClient();
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
