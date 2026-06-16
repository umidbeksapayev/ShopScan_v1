-- ShopScan V3 — Sprint 2 (F3-2): Sotuvni qaytarish (return / refund)
--
-- Sotuvni (to'liq yoki qisman) qaytarish: inventar tiklanadi, qaytarish yozuvi
-- saqlanadi, ikki marta qaytarish oldini olinadi. Hisobot RPC'lari NET qiymat
-- qaytaradi (tushum/foyda − qaytarishlar, qaytarilgan sana bo'yicha).
--
-- Supabase SQL Editor da bajaring. DIQQAT: avval 001–013 ishga tushirilgan bo'lsin.

-- =====================================================
-- 1) returns — qaytarish sarlavhasi
-- =====================================================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  total_refund DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_profit DECIMAL(12,2) NOT NULL DEFAULT 0, -- qaytarilgan (teskari) foyda
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_returns_shop ON returns(shop_id, created_at DESC);
CREATE INDEX idx_returns_sale ON returns(sale_id);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "returns_shop_owner_only" ON returns
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 2) return_items — qaytarilgan qatorlar
-- =====================================================
CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL,
  refund_amount DECIMAL(12,2) NOT NULL,
  profit_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_return_items_return ON return_items(return_id);
CREATE INDEX idx_return_items_sale_item ON return_items(sale_item_id);
CREATE INDEX idx_return_items_sale ON return_items(sale_id);
CREATE INDEX idx_return_items_product ON return_items(product_id);

ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "return_items_shop_owner_only" ON return_items
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 3) process_return — atomar qaytarish
--    p_items: [{ "sale_item_id": uuid, "quantity": number }]
-- =====================================================
CREATE OR REPLACE FUNCTION process_return(
  p_shop_id UUID,
  p_sale_id UUID,
  p_items JSONB,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_si sale_items%ROWTYPE;
  v_qty DECIMAL(12,3);
  v_already DECIMAL(12,3);
  v_return_id UUID;
  v_refund DECIMAL(12,2);
  v_profit DECIMAL(12,2);
  v_total_refund DECIMAL(12,2) := 0;
  v_total_profit DECIMAL(12,2) := 0;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Qaytariladigan mahsulot yo''q';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM shops WHERE id = p_shop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM sales WHERE id = p_sale_id AND shop_id = p_shop_id
  ) THEN
    RAISE EXCEPTION 'Sotuv topilmadi';
  END IF;

  INSERT INTO returns (shop_id, sale_id, total_refund, total_profit, reason)
  VALUES (p_shop_id, p_sale_id, 0, 0, p_reason)
  RETURNING id INTO v_return_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DECIMAL;
    CONTINUE WHEN v_qty IS NULL OR v_qty <= 0; -- bo'sh qatorlarni o'tkazib yuboramiz

    -- Sotuv qatorini qulflaymiz
    SELECT * INTO v_si
    FROM sale_items
    WHERE id = (v_item->>'sale_item_id')::UUID
      AND sale_id = p_sale_id
      AND shop_id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sotuv qatori topilmadi';
    END IF;

    -- Shu qator bo'yicha allaqachon qaytarilgan miqdor
    SELECT COALESCE(SUM(quantity), 0) INTO v_already
    FROM return_items WHERE sale_item_id = v_si.id;

    IF v_already + v_qty > v_si.quantity_sold THEN
      RAISE EXCEPTION 'Qaytarish miqdori sotilgandan oshib ketdi';
    END IF;

    -- Snapshot narxlar bo'yicha refund va teskari foyda
    v_refund := v_si.selling_price_snapshot * v_qty;
    v_profit := (v_si.selling_price_snapshot - v_si.cost_price_snapshot) * v_qty;

    -- Inventarni tiklash
    UPDATE products SET quantity = quantity + v_qty WHERE id = v_si.product_id;

    INSERT INTO return_items (
      return_id, sale_item_id, product_id, shop_id, sale_id,
      quantity, refund_amount, profit_amount
    ) VALUES (
      v_return_id, v_si.id, v_si.product_id, p_shop_id, p_sale_id,
      v_qty, v_refund, v_profit
    );

    v_total_refund := v_total_refund + v_refund;
    v_total_profit := v_total_profit + v_profit;
  END LOOP;

  -- Hech narsa qaytarilmagan bo'lsa — bo'sh sarlavhani o'chiramiz
  IF v_total_refund = 0 THEN
    DELETE FROM returns WHERE id = v_return_id;
    RAISE EXCEPTION 'Qaytariladigan mahsulot tanlanmadi';
  END IF;

  UPDATE returns
  SET total_refund = v_total_refund, total_profit = v_total_profit
  WHERE id = v_return_id;

  RETURN jsonb_build_object(
    'return_id', v_return_id,
    'total_refund', v_total_refund,
    'total_profit', v_total_profit
  );
END;
$$;

-- =====================================================
-- 4) Hisobot RPC'lari — NET (qaytarishlar ayiriladi)
-- =====================================================

-- 4a) get_dashboard_stats — bugungi NET tushum/foyda
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_revenue DECIMAL(12,2);
  v_profit DECIMAL(12,2);
  v_count INT;
  v_low INT;
  v_ret_refund DECIMAL(12,2);
  v_ret_profit DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(total_revenue), 0), COALESCE(SUM(total_profit), 0), COUNT(*)
  INTO v_revenue, v_profit, v_count
  FROM sales
  WHERE shop_id = p_shop_id
    AND (sold_at AT TIME ZONE 'Asia/Tashkent')::date = v_today;

  SELECT COALESCE(SUM(total_refund), 0), COALESCE(SUM(total_profit), 0)
  INTO v_ret_refund, v_ret_profit
  FROM returns
  WHERE shop_id = p_shop_id
    AND (created_at AT TIME ZONE 'Asia/Tashkent')::date = v_today;

  SELECT COUNT(*) INTO v_low
  FROM products
  WHERE shop_id = p_shop_id AND is_active = true
    AND quantity <= low_stock_alert;

  RETURN jsonb_build_object(
    'today_revenue', v_revenue - v_ret_refund,
    'today_profit', v_profit - v_ret_profit,
    'today_sales_count', v_count,
    'low_stock_count', v_low
  );
END;
$$;

-- 4b) get_sales_trend — oxirgi N kun NET tushum/foyda
CREATE OR REPLACE FUNCTION get_sales_trend(p_shop_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (
  day DATE,
  revenue DECIMAL(12,2),
  profit DECIMAL(12,2),
  sales_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      (now() AT TIME ZONE 'Asia/Tashkent')::date - (p_days - 1),
      (now() AT TIME ZONE 'Asia/Tashkent')::date,
      INTERVAL '1 day'
    )::date AS day
  ),
  sold AS (
    SELECT (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
           SUM(s.total_revenue) AS revenue,
           SUM(s.total_profit) AS profit,
           COUNT(*) AS cnt
    FROM sales s
    WHERE s.shop_id = p_shop_id
    GROUP BY 1
  ),
  ret AS (
    SELECT (r.created_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
           SUM(r.total_refund) AS refund,
           SUM(r.total_profit) AS profit
    FROM returns r
    WHERE r.shop_id = p_shop_id
    GROUP BY 1
  )
  SELECT
    d.day,
    (COALESCE(sold.revenue, 0) - COALESCE(ret.refund, 0))::DECIMAL(12,2),
    (COALESCE(sold.profit, 0) - COALESCE(ret.profit, 0))::DECIMAL(12,2),
    COALESCE(sold.cnt, 0)::INT
  FROM days d
  LEFT JOIN sold ON sold.day = d.day
  LEFT JOIN ret ON ret.day = d.day
  ORDER BY d.day;
END;
$$;

-- 4c) get_top_products — oxirgi N kun NET (qaytarilgan mahsulotlar ayiriladi)
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
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH sold AS (
    SELECT si.product_id,
           SUM(si.quantity_sold) AS qty,
           SUM(si.total_revenue) AS rev,
           SUM(si.total_profit) AS prof
    FROM sale_items si
    WHERE si.shop_id = p_shop_id
      AND (si.sold_at AT TIME ZONE 'Asia/Tashkent')::date
          > (now() AT TIME ZONE 'Asia/Tashkent')::date - p_days
    GROUP BY si.product_id
  ),
  ret AS (
    SELECT ri.product_id,
           SUM(ri.quantity) AS qty,
           SUM(ri.refund_amount) AS rev,
           SUM(ri.profit_amount) AS prof
    FROM return_items ri
    WHERE ri.shop_id = p_shop_id
      AND (ri.created_at AT TIME ZONE 'Asia/Tashkent')::date
          > (now() AT TIME ZONE 'Asia/Tashkent')::date - p_days
    GROUP BY ri.product_id
  )
  SELECT
    p.id, p.name, p.image_url, p.sale_type,
    (COALESCE(sold.qty, 0) - COALESCE(ret.qty, 0))::DECIMAL(12,3),
    (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0))::DECIMAL(12,2),
    (COALESCE(sold.prof, 0) - COALESCE(ret.prof, 0))::DECIMAL(12,2)
  FROM sold
  JOIN products p ON p.id = sold.product_id
  LEFT JOIN ret ON ret.product_id = sold.product_id
  ORDER BY (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0)) DESC
  LIMIT p_limit;
END;
$$;
