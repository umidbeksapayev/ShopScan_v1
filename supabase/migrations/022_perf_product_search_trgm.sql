-- ShopScan — Performance P1: Mahsulot qidiruvini tezlashtirish (pg_trgm)
--
-- MUAMMO: listProducts() va searchProductsByName() mahsulotni
-- `name ILIKE '%term%'` bilan qidiradi. Naqsh oldida `%` bo'lgani uchun
-- oddiy btree indeks ISHLAMAYDI → har qidiruvda do'kon mahsulotlari seq scan.
-- Katalog kattalashgani sayin sotuv ekranidagi qidiruv sekinlashadi.
--
-- YECHIM: pg_trgm trigram GIN indeks. `gin_trgm_ops` LIKE va ILIKE '%...%'
-- uchun indeks qidiruvga ruxsat beradi.
--
-- Xavfsiz: faqat EXTENSION + additiv INDEX. Mantiq/RLS/access tegmaydi.

BEGIN;

-- Trigram qidiruv kengaytmasi (Supabase'da mavjud)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- `name ILIKE '%...%'` uchun trigram indeks
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gin (name gin_trgm_ops);

COMMIT;
