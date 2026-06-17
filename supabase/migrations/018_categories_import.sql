-- ShopScan V3 — Sprint 5: Kategoriyalar + ommaviy mahsulot import (Excel/CSV)
--
-- 1) categories — do'kon ichida kategoriyalar (nom case-insensitive UNIQUE)
-- 2) products.category_id — ixtiyoriy kategoriya (kategoriya o'chsa → SET NULL)
-- 3) import_products() — Excel/CSV dan ommaviy qo'shish (atomar, has_perm gate,
--    kategoriyani nom bo'yicha topadi/yaratadi, barcode to'qnashuvini o'tkazib yuboradi)
--
-- O'qish: do'kon a'zosi (kassir ham sotuv/katalogda kategoriyani ko'radi).
-- Yozish: 'manage_products' ruxsati (ega = doim).
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–017 ishga tushirilgan bo'lsin. Atomar.

BEGIN;

-- =====================================================
-- 1) categories — kategoriyalar
-- =====================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_shop ON categories(shop_id);
-- Do'kon ichida nom takrorlanmasin (katta-kichik harf farqsiz)
CREATE UNIQUE INDEX uq_categories_shop_name ON categories(shop_id, lower(name));

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- O'qish: a'zo (kassir ham katalog/sotuvda kategoriyani ko'radi)
CREATE POLICY "categories_member_select" ON categories
  FOR SELECT USING (is_shop_member(shop_id));
-- Yozish: manage_products ruxsati (ega uchun ham true)
CREATE POLICY "categories_write_perm" ON categories
  FOR ALL USING (has_perm(shop_id, 'manage_products'))
  WITH CHECK (has_perm(shop_id, 'manage_products'));

-- =====================================================
-- 2) products.category_id — ixtiyoriy kategoriya
-- =====================================================
ALTER TABLE products
  ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE category_id IS NOT NULL;

-- =====================================================
-- 3) import_products — ommaviy qo'shish (atomar)
--    p_rows: [{ name, sale_type('unit'|'weight'), cost_price, selling_price,
--               quantity, low_stock_alert, barcode|null, category|null }, ...]
--    low_stock_alert client tomonda computeLowStockThreshold (20%) bilan hisoblanadi.
--    Yaroqsiz qator yoki barcode to'qnashuvi → skip (xato emas), hisobotda ko'rinadi.
-- =====================================================
CREATE OR REPLACE FUNCTION import_products(p_shop_id UUID, p_rows JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row JSONB;
  v_name TEXT;
  v_sale_type TEXT;
  v_cost DECIMAL(12,2);
  v_selling DECIMAL(12,2);
  v_qty DECIMAL(12,3);
  v_low DECIMAL(12,3);
  v_barcode TEXT;
  v_cat_name TEXT;
  v_cat_id UUID;
  v_inserted INT := 0;
  v_skipped INT := 0;
  v_cats_created INT := 0;
BEGIN
  IF NOT has_perm(p_shop_id, 'manage_products') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  IF p_rows IS NULL OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'Import qatorlari yo''q';
  END IF;
  IF jsonb_array_length(p_rows) > 2000 THEN
    RAISE EXCEPTION 'Bir importda 2000 tadan ko''p qator bo''lmasin';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_name := NULLIF(TRIM(v_row->>'name'), '');
    v_sale_type := v_row->>'sale_type';
    v_cost := NULLIF(v_row->>'cost_price', '')::DECIMAL;
    v_selling := NULLIF(v_row->>'selling_price', '')::DECIMAL;
    v_qty := NULLIF(v_row->>'quantity', '')::DECIMAL;
    v_low := COALESCE(NULLIF(v_row->>'low_stock_alert', '')::DECIMAL, 0);
    v_barcode := NULLIF(TRIM(v_row->>'barcode'), '');
    v_cat_name := NULLIF(TRIM(v_row->>'category'), '');

    -- Server-side mudofaa: yaroqsiz qatorni o'tkazib yuboramiz
    IF v_name IS NULL
       OR v_sale_type NOT IN ('unit', 'weight')
       OR v_cost IS NULL OR v_cost < 0
       OR v_selling IS NULL OR v_selling < 0
       OR v_qty IS NULL OR v_qty < 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Barcode to'qnashuvi (do'kon ichida UNIQUE) — DB'dagi VA shu importdagi
    -- oldingi qatorlar bilan (insert tranzaksiya ichida ko'rinadi) tekshiriladi
    IF v_barcode IS NOT NULL AND EXISTS (
      SELECT 1 FROM products WHERE shop_id = p_shop_id AND barcode = v_barcode
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Kategoriya: nom bo'yicha topish yoki yaratish
    v_cat_id := NULL;
    IF v_cat_name IS NOT NULL THEN
      SELECT id INTO v_cat_id FROM categories
      WHERE shop_id = p_shop_id AND lower(name) = lower(v_cat_name);
      IF v_cat_id IS NULL THEN
        INSERT INTO categories (shop_id, name) VALUES (p_shop_id, v_cat_name)
        RETURNING id INTO v_cat_id;
        v_cats_created := v_cats_created + 1;
      END IF;
    END IF;

    INSERT INTO products (
      shop_id, name, sale_type, cost_price, selling_price,
      quantity, low_stock_alert, barcode, image_url, category_id, is_active
    ) VALUES (
      p_shop_id, v_name, v_sale_type::sale_type_enum, v_cost, v_selling,
      v_qty, v_low, v_barcode, NULL, v_cat_id, true
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'skipped', v_skipped,
    'categories_created', v_cats_created
  );
END;
$$;

COMMIT;
