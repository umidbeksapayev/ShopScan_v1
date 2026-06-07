-- ShopScan — BARCHA migratsiyalar (IDEMPOTENT versiya)
-- Bu skriptni xohlagancha qayta ishga tushirsa bo'ladi — mavjud obyektlarni buzmaydi.
-- Supabase SQL Editor ga to'liq copy-paste qiling va RUN bosing.

-- =====================================================
-- pgvector
-- =====================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- shops
-- =====================================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ENUM: sale_type
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_type_enum') THEN
    CREATE TYPE sale_type_enum AS ENUM ('unit', 'weight');
  END IF;
END $$;

-- =====================================================
-- products
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sale_type sale_type_enum NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL CHECK (cost_price >= 0),
  selling_price DECIMAL(12,2) NOT NULL CHECK (selling_price >= 0),
  profit_per_unit DECIMAL(12,2) GENERATED ALWAYS AS (selling_price - cost_price) STORED,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_alert DECIMAL(12,3) NOT NULL DEFAULT 5,
  barcode TEXT,
  image_url TEXT NOT NULL,
  image_embedding VECTOR(512),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_embedding ON products
  USING hnsw (image_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- =====================================================
-- ENUM: search_method
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'search_method_enum') THEN
    CREATE TYPE search_method_enum AS ENUM ('barcode', 'visual', 'manual');
  END IF;
END $$;

-- =====================================================
-- sales
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sale_type sale_type_enum NOT NULL,
  quantity_sold DECIMAL(12,3) NOT NULL CHECK (quantity_sold > 0),
  cost_price_snapshot DECIMAL(12,2) NOT NULL,
  selling_price_snapshot DECIMAL(12,2) NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL,
  total_profit DECIMAL(12,2) NOT NULL,
  search_method search_method_enum NOT NULL DEFAULT 'manual',
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(shop_id, sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shops_owner_only" ON shops;
CREATE POLICY "shops_owner_only" ON shops
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "products_shop_owner_only" ON products;
CREATE POLICY "products_shop_owner_only" ON products
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "sales_shop_owner_only" ON sales;
CREATE POLICY "sales_shop_owner_only" ON sales
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- process_sale() — bitta mahsulot atomar sotuv
-- =====================================================
CREATE OR REPLACE FUNCTION process_sale(
  p_product_id UUID,
  p_shop_id UUID,
  p_quantity_sold DECIMAL,
  p_search_method search_method_enum
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_sale_id UUID;
BEGIN
  SELECT * INTO v_product FROM products
  WHERE id = p_product_id AND shop_id = p_shop_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mahsulot topilmadi';
  END IF;

  IF v_product.quantity < p_quantity_sold THEN
    RAISE EXCEPTION 'Yetarli miqdor yo''q. Mavjud: % %',
      v_product.quantity,
      CASE WHEN v_product.sale_type = 'unit' THEN 'dona' ELSE 'kg' END;
  END IF;

  UPDATE products SET quantity = quantity - p_quantity_sold WHERE id = p_product_id;

  INSERT INTO sales (
    shop_id, product_id, sale_type, quantity_sold,
    cost_price_snapshot, selling_price_snapshot,
    total_revenue, total_profit, search_method
  ) VALUES (
    p_shop_id, p_product_id, v_product.sale_type, p_quantity_sold,
    v_product.cost_price, v_product.selling_price,
    v_product.selling_price * p_quantity_sold,
    (v_product.selling_price - v_product.cost_price) * p_quantity_sold,
    p_search_method
  ) RETURNING id INTO v_sale_id;

  RETURN v_sale_id;
END;
$$;

-- =====================================================
-- Storage bucket (public) + RLS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.shops WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
CREATE POLICY "product_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.shops WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.shops WHERE owner_id = auth.uid())
  );

-- =====================================================
-- Ro'yxatdan o'tishda do'kon avto-yaratish (trigger)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shops (owner_id, name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'shop_name'), ''), 'Mening do''konim')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- process_sale_cart() — savat (ko'p mahsulot) atomar sotuv
-- =====================================================
CREATE OR REPLACE FUNCTION process_sale_cart(
  p_shop_id UUID,
  p_items JSONB,
  p_search_method search_method_enum DEFAULT 'manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_product products%ROWTYPE;
  v_qty DECIMAL(12,3);
  v_sale_id UUID;
  v_sale_ids UUID[] := '{}';
  v_total_revenue DECIMAL(12,2) := 0;
  v_total_profit DECIMAL(12,2) := 0;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Savat bo''sh';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DECIMAL;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Noto''g''ri miqdor';
    END IF;

    SELECT * INTO v_product FROM products
    WHERE id = (v_item->>'product_id')::UUID AND shop_id = p_shop_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mahsulot topilmadi: %', v_item->>'product_id';
    END IF;

    IF v_product.quantity < v_qty THEN
      RAISE EXCEPTION 'Yetarli miqdor yo''q: "%" (mavjud: % %)',
        v_product.name, v_product.quantity,
        CASE WHEN v_product.sale_type = 'unit' THEN 'dona' ELSE 'kg' END;
    END IF;

    UPDATE products SET quantity = quantity - v_qty WHERE id = v_product.id;

    INSERT INTO sales (
      shop_id, product_id, sale_type, quantity_sold,
      cost_price_snapshot, selling_price_snapshot,
      total_revenue, total_profit, search_method
    ) VALUES (
      p_shop_id, v_product.id, v_product.sale_type, v_qty,
      v_product.cost_price, v_product.selling_price,
      v_product.selling_price * v_qty,
      (v_product.selling_price - v_product.cost_price) * v_qty,
      p_search_method
    ) RETURNING id INTO v_sale_id;

    v_sale_ids := array_append(v_sale_ids, v_sale_id);
    v_total_revenue := v_total_revenue + (v_product.selling_price * v_qty);
    v_total_profit := v_total_profit + ((v_product.selling_price - v_product.cost_price) * v_qty);
  END LOOP;

  RETURN jsonb_build_object(
    'sale_ids', to_jsonb(v_sale_ids),
    'item_count', jsonb_array_length(p_items),
    'total_revenue', v_total_revenue,
    'total_profit', v_total_profit
  );
END;
$$;

-- =====================================================
-- match_products() — Sprint 4: CLIP vizual qidiruv (pgvector + HNSW)
-- Rasmga eng o'xshash mahsulotlarni topadi. Kosinus: 1 - (a <=> b).
-- =====================================================
CREATE OR REPLACE FUNCTION match_products(
  p_shop_id UUID,
  p_embedding VECTOR(512),
  p_match_count INT DEFAULT 3,
  p_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id UUID,
  shop_id UUID,
  name TEXT,
  sale_type sale_type_enum,
  cost_price DECIMAL(12,2),
  selling_price DECIMAL(12,2),
  profit_per_unit DECIMAL(12,2),
  quantity DECIMAL(12,3),
  low_stock_alert DECIMAL(12,3),
  barcode TEXT,
  image_url TEXT,
  image_embedding VECTOR(512),
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.shop_id, p.name, p.sale_type, p.cost_price, p.selling_price,
    p.profit_per_unit, p.quantity, p.low_stock_alert, p.barcode, p.image_url,
    p.image_embedding, p.is_active, p.created_at,
    (1 - (p.image_embedding <=> p_embedding))::FLOAT AS similarity
  FROM products p
  WHERE p.shop_id = p_shop_id
    AND p.is_active = true
    AND p.quantity > 0
    AND p.image_embedding IS NOT NULL
    AND (1 - (p.image_embedding <=> p_embedding)) >= p_threshold
  ORDER BY p.image_embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$;
