-- ShopScan — Mahsulot rasmlari uchun Storage bucket
-- Qaror (R3): PUBLIC bucket — rasmlar public URL orqali ko'rinadi (signed URL kerak emas).
-- Yuklash/o'zgartirish/o'chirish faqat o'z do'koni papkasiga ruxsat etiladi.
-- Papka konvensiyasi: "{shop_id}/{fayl_nomi}"

-- Bucket yaratish (public = true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Storage RLS siyosatlari
-- =====================

-- SELECT: public bucket bo'lgani uchun o'qish hammaga ochiq (CDN orqali)
DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- INSERT: faqat autentifikatsiyalangan foydalanuvchi o'zining do'kon papkasiga
DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: faqat o'z do'koni papkasidagi fayllar
DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
CREATE POLICY "product_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
    )
  );

-- DELETE: faqat o'z do'koni papkasidagi fayllar
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.shops WHERE owner_id = auth.uid()
    )
  );
