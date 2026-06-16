-- ShopScan V2 — Sprint 2 (F-2): Vizual (CLIP) qidiruvni butunlay olib tashlash
-- Bu migratsiya vizual qidiruvga oid barcha DB obyektlarini o'chiradi va
-- mahsulot rasmini IXTIYORIY qiladi.
--
-- Supabase SQL Editor da yoki `supabase db push` bilan bajaring.
-- DIQQAT: bu QAYTARIB BO'LMAYDIGAN amal (image_embedding ma'lumotlari o'chadi).

-- 1) match_products RPC funksiyasi (vizual qidiruv) — o'chiriladi
DROP FUNCTION IF EXISTS match_products(uuid, vector, integer, double precision);

-- 2) product_embeddings jadvali — indekslari va RLS siyosati bilan birga o'chiriladi
DROP TABLE IF EXISTS product_embeddings CASCADE;

-- 3) products.image_embedding ustuni va uning HNSW indeksi — o'chiriladi
DROP INDEX IF EXISTS idx_products_embedding;
ALTER TABLE products DROP COLUMN IF EXISTS image_embedding;

-- 4) Mahsulot rasmi endi IXTIYORIY (image_url NOT NULL constraint olib tashlanadi)
ALTER TABLE products ALTER COLUMN image_url DROP NOT NULL;

-- 5) Eski 'visual' usulli sotuvlarni 'manual' ga ko'chirish
--    (enum'dagi 'visual' qiymati Postgres'da osongina drop qilinmaydi — qoldiriladi,
--     lekin endi hech qayerda ishlatilmaydi)
UPDATE sales SET search_method = 'manual' WHERE search_method = 'visual';

-- Eslatma: barcode UNIQUE indeksi (uq_products_shop_barcode) SAQLANADI — u F-1 uchun kerak.
