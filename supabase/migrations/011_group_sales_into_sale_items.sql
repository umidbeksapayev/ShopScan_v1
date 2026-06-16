-- ShopScan V2 — Sprint 3 (F-4): Sotuv tarixini guruhlash
-- "Bitta sotuv = bitta yozuv". Joriy tekis `sales` jadvali `sale_items` ga aylanadi,
-- yangi `sales` (sarlavha) jadvali qo'shiladi. Eski yozuvlar har biri 1-mahsulotli
-- sotuvga ko'chiriladi (asl savat guruhi tiklanmaydi).
--
-- Supabase SQL Editor da bajaring. DIQQAT: avval 010 ni ishga tushirgan bo'ling.

-- =====================================================
-- 1) Joriy `sales` (tekis qatorlar) -> `sale_items`
-- =====================================================
ALTER TABLE sales RENAME TO sale_items;

-- Index/PK nomlarini yangilaymiz (yangi `sales` bilan to'qnashmasligi uchun;
-- index nomlari Postgres'da schema bo'yicha unikal).
ALTER INDEX IF EXISTS sales_pkey RENAME TO sale_items_pkey;
ALTER INDEX IF EXISTS idx_sales_shop_id RENAME TO idx_sale_items_shop_id;
ALTER INDEX IF EXISTS idx_sales_sold_at RENAME TO idx_sale_items_sold_at;
ALTER INDEX IF EXISTS idx_sales_product_id RENAME TO idx_sale_items_product_id;

-- sale_id ustuni (hozircha nullable — backfill uchun)
ALTER TABLE sale_items ADD COLUMN sale_id UUID;

-- =====================================================
-- 2) Yangi `sales` (sarlavha) jadvali
-- =====================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
  item_count INT NOT NULL DEFAULT 0,
  search_method search_method_enum NOT NULL DEFAULT 'manual',
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_shop_id ON sales(shop_id);
CREATE INDEX idx_sales_sold_at ON sales(shop_id, sold_at DESC);

-- =====================================================
-- 3) Eski yozuvlarni migratsiya (har bir item -> 1 sarlavha, id qayta ishlatiladi)
-- =====================================================
INSERT INTO sales (id, shop_id, total_revenue, total_profit, item_count, search_method, sold_at)
SELECT id, shop_id, total_revenue, total_profit, 1, search_method, sold_at
FROM sale_items;

UPDATE sale_items SET sale_id = id;

-- sale_id majburiy + FK
ALTER TABLE sale_items ALTER COLUMN sale_id SET NOT NULL;
ALTER TABLE sale_items
  ADD CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);

-- =====================================================
-- 4) RLS
-- =====================================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_shop_owner_only" ON sales
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- sale_items policy nomini aniqlashtiramiz (rename'dan keyin eski "sales_..." nom qolgan edi)
DROP POLICY IF EXISTS "sales_shop_owner_only" ON sale_items;
CREATE POLICY "sale_items_shop_owner_only" ON sale_items
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 5) process_sale_cart — sarlavha + qatorlar (atomar)
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
  v_now TIMESTAMPTZ := now();
  v_total_revenue DECIMAL(12,2) := 0;
  v_total_profit DECIMAL(12,2) := 0;
  v_item_count INT := 0;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Savat bo''sh';
  END IF;

  -- Egalik tekshiruvi (client SECURITY DEFINER orqali chaqiradi)
  IF NOT EXISTS (
    SELECT 1 FROM shops WHERE id = p_shop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  -- Sarlavhani avval yaratamiz (sale_items FK uchun)
  INSERT INTO sales (shop_id, total_revenue, total_profit, item_count, search_method, sold_at)
  VALUES (p_shop_id, 0, 0, 0, p_search_method, v_now)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DECIMAL;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Noto''g''ri miqdor';
    END IF;

    -- Mahsulotni qulflab olish (race condition oldini olish)
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
      AND shop_id = p_shop_id
      AND is_active = true
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

    INSERT INTO sale_items (
      sale_id, shop_id, product_id, sale_type, quantity_sold,
      cost_price_snapshot, selling_price_snapshot,
      total_revenue, total_profit, search_method, sold_at
    ) VALUES (
      v_sale_id, p_shop_id, v_product.id, v_product.sale_type, v_qty,
      v_product.cost_price, v_product.selling_price,
      v_product.selling_price * v_qty,
      (v_product.selling_price - v_product.cost_price) * v_qty,
      p_search_method, v_now
    );

    v_total_revenue := v_total_revenue + (v_product.selling_price * v_qty);
    v_total_profit := v_total_profit + ((v_product.selling_price - v_product.cost_price) * v_qty);
    v_item_count := v_item_count + 1;
  END LOOP;

  -- Sarlavha jami qiymatlarini yangilash
  UPDATE sales
  SET total_revenue = v_total_revenue,
      total_profit = v_total_profit,
      item_count = v_item_count
  WHERE id = v_sale_id;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'item_count', v_item_count,
    'total_revenue', v_total_revenue,
    'total_profit', v_total_profit
  );
END;
$$;

-- =====================================================
-- 6) get_top_products — endi sale_items (qator darajasi) ustidan
--    (get_dashboard_stats va get_sales_trend o'zgarmaydi: ular `sales` sarlavhasini
--     o'qiydi — bir xil ustun nomlari; "sotuvlar soni" endi tranzaksiyalar sonini bildiradi.)
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_products(
  p_shop_id UUID,
  p_days INT DEFAULT 30,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  product_id UUID,
  name TEXT,
  image_url TEXT,
  sale_type sale_type_enum,
  units_sold DECIMAL(12,3),
  revenue DECIMAL(12,2),
  profit DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.image_url, p.sale_type,
    SUM(s.quantity_sold)::DECIMAL(12,3) AS units_sold,
    SUM(s.total_revenue)::DECIMAL(12,2) AS revenue,
    SUM(s.total_profit)::DECIMAL(12,2) AS profit
  FROM sale_items s
  JOIN products p ON p.id = s.product_id
  WHERE s.shop_id = p_shop_id
    AND (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date
        > (now() AT TIME ZONE 'Asia/Tashkent')::date - p_days
  GROUP BY p.id, p.name, p.image_url, p.sale_type
  ORDER BY SUM(s.total_revenue) DESC
  LIMIT p_limit;
END;
$$;
