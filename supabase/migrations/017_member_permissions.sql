-- ShopScan V3 — Sprint 4b (F3-5): Kassir uchun moslashuvchan ruxsatlar
--
-- Egasi har bir kassirga funksiyalarni alohida yoqadi/o'chiradi.
-- Ruxsatlar: manage_products, purchase, returns, manage_debt, view_reports, view_cost
-- Ega = barcha ruxsatlar (implicit). Kassir default = hammasi o'chiq (faqat sotuv).
--
-- DB darajasida majburlanadi (RLS + RPC). Avval 016 bo'lsin. Atomar.

BEGIN;

-- =====================================================
-- 1) Ruxsatlar ustuni + helper
-- =====================================================
ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION has_perm(p_shop_id UUID, p_perm TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid()
      AND (role = 'owner' OR COALESCE((permissions->>p_perm)::boolean, false))
  );
$$;

-- Egasi kassir ruxsatlarini o'rnatadi (egani o'zgartirib bo'lmaydi)
CREATE OR REPLACE FUNCTION set_member_permissions(p_shop_id UUID, p_user_id UUID, p_permissions JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_shop_owner(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  UPDATE shop_members
  SET permissions = COALESCE(p_permissions, '{}'::jsonb)
  WHERE shop_id = p_shop_id AND user_id = p_user_id AND role <> 'owner';
END;
$$;

-- =====================================================
-- 2) RLS: owner-only → ruxsatga asoslangan (has_perm owner uchun ham true)
-- =====================================================
DROP POLICY IF EXISTS "products_owner_write" ON products;
CREATE POLICY "products_write_perm" ON products
  FOR ALL USING (has_perm(shop_id, 'manage_products'))
  WITH CHECK (has_perm(shop_id, 'manage_products'));

DROP POLICY IF EXISTS "suppliers_owner_all" ON suppliers;
CREATE POLICY "suppliers_perm" ON suppliers
  FOR ALL USING (has_perm(shop_id, 'purchase')) WITH CHECK (has_perm(shop_id, 'purchase'));

DROP POLICY IF EXISTS "purchases_owner_all" ON purchases;
CREATE POLICY "purchases_perm" ON purchases
  FOR ALL USING (has_perm(shop_id, 'purchase')) WITH CHECK (has_perm(shop_id, 'purchase'));

DROP POLICY IF EXISTS "purchase_items_owner_all" ON purchase_items;
CREATE POLICY "purchase_items_perm" ON purchase_items
  FOR ALL USING (has_perm(shop_id, 'purchase')) WITH CHECK (has_perm(shop_id, 'purchase'));

DROP POLICY IF EXISTS "returns_owner_all" ON returns;
CREATE POLICY "returns_perm" ON returns
  FOR ALL USING (has_perm(shop_id, 'returns')) WITH CHECK (has_perm(shop_id, 'returns'));

DROP POLICY IF EXISTS "return_items_owner_all" ON return_items;
CREATE POLICY "return_items_perm" ON return_items
  FOR ALL USING (has_perm(shop_id, 'returns')) WITH CHECK (has_perm(shop_id, 'returns'));

DROP POLICY IF EXISTS "customer_payments_owner_all" ON customer_payments;
CREATE POLICY "customer_payments_perm" ON customer_payments
  FOR ALL USING (has_perm(shop_id, 'manage_debt')) WITH CHECK (has_perm(shop_id, 'manage_debt'));

-- =====================================================
-- 3) RPC'lar — egalik tekshiruvi → has_perm
-- =====================================================

-- 3a) process_purchase → 'purchase'
CREATE OR REPLACE FUNCTION process_purchase(
  p_shop_id UUID,
  p_supplier_id UUID,
  p_items JSONB,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item JSONB;
  v_product products%ROWTYPE;
  v_qty DECIMAL(12,3);
  v_cost DECIMAL(12,2);
  v_purchase_id UUID;
  v_total DECIMAL(12,2) := 0;
  v_new_cost DECIMAL(12,2);
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Kirim qatorlari yo''q';
  END IF;
  IF NOT has_perm(p_shop_id, 'purchase') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  IF p_supplier_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM suppliers WHERE id = p_supplier_id AND shop_id = p_shop_id
  ) THEN
    RAISE EXCEPTION 'Ta''minotchi topilmadi';
  END IF;

  INSERT INTO purchases (shop_id, supplier_id, total, note)
  VALUES (p_shop_id, p_supplier_id, 0, p_note)
  RETURNING id INTO v_purchase_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DECIMAL;
    v_cost := (v_item->>'cost_price')::DECIMAL;
    IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Noto''g''ri miqdor'; END IF;
    IF v_cost IS NULL OR v_cost < 0 THEN RAISE EXCEPTION 'Noto''g''ri tan narx'; END IF;

    SELECT * INTO v_product FROM products
    WHERE id = (v_item->>'product_id')::UUID AND shop_id = p_shop_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Mahsulot topilmadi'; END IF;

    v_new_cost := ROUND(
      ((v_product.quantity * v_product.cost_price) + (v_qty * v_cost))
        / (v_product.quantity + v_qty), 2);

    UPDATE products SET quantity = quantity + v_qty, cost_price = v_new_cost
    WHERE id = v_product.id;

    INSERT INTO purchase_items (purchase_id, product_id, shop_id, quantity, cost_price)
    VALUES (v_purchase_id, v_product.id, p_shop_id, v_qty, v_cost);

    v_total := v_total + (v_qty * v_cost);
  END LOOP;

  UPDATE purchases SET total = v_total WHERE id = v_purchase_id;
  RETURN jsonb_build_object('purchase_id', v_purchase_id, 'total', v_total);
END;
$$;

-- 3b) process_return → 'returns'
CREATE OR REPLACE FUNCTION process_return(
  p_shop_id UUID,
  p_sale_id UUID,
  p_items JSONB,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
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
  IF NOT has_perm(p_shop_id, 'returns') THEN
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
    CONTINUE WHEN v_qty IS NULL OR v_qty <= 0;

    SELECT * INTO v_si FROM sale_items
    WHERE id = (v_item->>'sale_item_id')::UUID
      AND sale_id = p_sale_id AND shop_id = p_shop_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sotuv qatori topilmadi'; END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_already
    FROM return_items WHERE sale_item_id = v_si.id;
    IF v_already + v_qty > v_si.quantity_sold THEN
      RAISE EXCEPTION 'Qaytarish miqdori sotilgandan oshib ketdi';
    END IF;

    v_refund := v_si.selling_price_snapshot * v_qty;
    v_profit := (v_si.selling_price_snapshot - v_si.cost_price_snapshot) * v_qty;

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

  IF v_total_refund = 0 THEN
    DELETE FROM returns WHERE id = v_return_id;
    RAISE EXCEPTION 'Qaytariladigan mahsulot tanlanmadi';
  END IF;

  UPDATE returns SET total_refund = v_total_refund, total_profit = v_total_profit
  WHERE id = v_return_id;

  RETURN jsonb_build_object(
    'return_id', v_return_id,
    'total_refund', v_total_refund,
    'total_profit', v_total_profit
  );
END;
$$;

-- 3c) record_customer_payment → 'manage_debt'
CREATE OR REPLACE FUNCTION record_customer_payment(
  p_shop_id UUID,
  p_customer_id UUID,
  p_amount DECIMAL(12,2),
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance DECIMAL(12,2);
BEGIN
  IF NOT has_perm(p_shop_id, 'manage_debt') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM customers WHERE id = p_customer_id AND shop_id = p_shop_id
  ) THEN
    RAISE EXCEPTION 'Mijoz topilmadi';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'To''lov summasi noto''g''ri';
  END IF;

  INSERT INTO customer_payments (shop_id, customer_id, amount, note)
  VALUES (p_shop_id, p_customer_id, p_amount, p_note);

  SELECT (
    COALESCE((SELECT SUM(s.total_revenue - s.paid_amount) FROM sales s WHERE s.customer_id = p_customer_id), 0)
    - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = p_customer_id), 0)
  )::DECIMAL(12,2) INTO v_balance;

  RETURN jsonb_build_object('balance', v_balance);
END;
$$;

-- 3d) get_customers_with_balance → 'manage_debt'
CREATE OR REPLACE FUNCTION get_customers_with_balance(p_shop_id UUID)
RETURNS TABLE (
  id UUID, name TEXT, phone TEXT, note TEXT, created_at TIMESTAMPTZ, balance DECIMAL(12,2)
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
BEGIN
  IF NOT has_perm(p_shop_id, 'manage_debt') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  RETURN QUERY
  SELECT q.id, q.name, q.phone, q.note, q.created_at, q.balance
  FROM (
    SELECT
      c.id, c.name, c.phone, c.note, c.created_at,
      (
        COALESCE((SELECT SUM(s.total_revenue - s.paid_amount) FROM sales s WHERE s.customer_id = c.id), 0)
        - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id), 0)
      )::DECIMAL(12,2) AS balance
    FROM customers c
    WHERE c.shop_id = p_shop_id
  ) q
  ORDER BY q.balance DESC, q.created_at DESC;
END;
$$;

-- 3e) Hisobot RPC'lari → 'view_reports' (oldin guard yo'q edi — kassirdan foyda yashirinadi)
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_shop_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_revenue DECIMAL(12,2); v_profit DECIMAL(12,2); v_count INT; v_low INT;
  v_ret_refund DECIMAL(12,2); v_ret_profit DECIMAL(12,2);
BEGIN
  IF NOT has_perm(p_shop_id, 'view_reports') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  SELECT COALESCE(SUM(total_revenue), 0), COALESCE(SUM(total_profit), 0), COUNT(*)
  INTO v_revenue, v_profit, v_count
  FROM sales WHERE shop_id = p_shop_id
    AND (sold_at AT TIME ZONE 'Asia/Tashkent')::date = v_today;

  SELECT COALESCE(SUM(r.total_refund), 0), COALESCE(SUM(r.total_profit), 0)
  INTO v_ret_refund, v_ret_profit
  FROM returns r JOIN sales s ON s.id = r.sale_id
  WHERE r.shop_id = p_shop_id
    AND (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date = v_today;

  SELECT COUNT(*) INTO v_low FROM products
  WHERE shop_id = p_shop_id AND is_active = true AND quantity <= low_stock_alert;

  RETURN jsonb_build_object(
    'today_revenue', v_revenue - v_ret_refund,
    'today_profit', v_profit - v_ret_profit,
    'today_sales_count', v_count,
    'low_stock_count', v_low
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_sales_trend(p_shop_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (day DATE, revenue DECIMAL(12,2), profit DECIMAL(12,2), sales_count INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
BEGIN
  IF NOT has_perm(p_shop_id, 'view_reports') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      (now() AT TIME ZONE 'Asia/Tashkent')::date - (p_days - 1),
      (now() AT TIME ZONE 'Asia/Tashkent')::date, INTERVAL '1 day')::date AS day
  ),
  sold AS (
    SELECT (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
           SUM(s.total_revenue) AS revenue, SUM(s.total_profit) AS profit, COUNT(*) AS cnt
    FROM sales s WHERE s.shop_id = p_shop_id GROUP BY 1
  ),
  ret AS (
    SELECT (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
           SUM(r.total_refund) AS refund, SUM(r.total_profit) AS profit
    FROM returns r JOIN sales s ON s.id = r.sale_id
    WHERE r.shop_id = p_shop_id GROUP BY 1
  )
  SELECT d.day,
    (COALESCE(sold.revenue, 0) - COALESCE(ret.refund, 0))::DECIMAL(12,2),
    (COALESCE(sold.profit, 0) - COALESCE(ret.profit, 0))::DECIMAL(12,2),
    COALESCE(sold.cnt, 0)::INT
  FROM days d
  LEFT JOIN sold ON sold.day = d.day
  LEFT JOIN ret ON ret.day = d.day
  ORDER BY d.day;
END;
$$;

CREATE OR REPLACE FUNCTION get_top_products(p_shop_id UUID, p_days INT DEFAULT 30, p_limit INT DEFAULT 5)
RETURNS TABLE (
  product_id UUID, name TEXT, image_url TEXT, sale_type sale_type_enum,
  units_sold DECIMAL(12,3), revenue DECIMAL(12,2), profit DECIMAL(12,2)
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
BEGIN
  IF NOT has_perm(p_shop_id, 'view_reports') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  RETURN QUERY
  WITH sold AS (
    SELECT si.product_id, SUM(si.quantity_sold) AS qty,
           SUM(si.total_revenue) AS rev, SUM(si.total_profit) AS prof
    FROM sale_items si WHERE si.shop_id = p_shop_id
      AND (si.sold_at AT TIME ZONE 'Asia/Tashkent')::date
          > (now() AT TIME ZONE 'Asia/Tashkent')::date - p_days
    GROUP BY si.product_id
  ),
  ret AS (
    SELECT ri.product_id, SUM(ri.quantity) AS qty,
           SUM(ri.refund_amount) AS rev, SUM(ri.profit_amount) AS prof
    FROM return_items ri JOIN sales s ON s.id = ri.sale_id
    WHERE ri.shop_id = p_shop_id
      AND (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date
          > (now() AT TIME ZONE 'Asia/Tashkent')::date - p_days
    GROUP BY ri.product_id
  )
  SELECT p.id, p.name, p.image_url, p.sale_type,
    (COALESCE(sold.qty, 0) - COALESCE(ret.qty, 0))::DECIMAL(12,3),
    (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0))::DECIMAL(12,2),
    (COALESCE(sold.prof, 0) - COALESCE(ret.prof, 0))::DECIMAL(12,2)
  FROM sold JOIN products p ON p.id = sold.product_id
  LEFT JOIN ret ON ret.product_id = sold.product_id
  ORDER BY (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0)) DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 4) list_shop_members — egasi xodimlarni (email + rol + ruxsat) ko'radi
-- =====================================================
CREATE OR REPLACE FUNCTION list_shop_members(p_shop_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_shop_owner(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  RETURN QUERY
  SELECT m.user_id, u.email::TEXT, m.role, m.permissions, m.created_at
  FROM shop_members m
  JOIN auth.users u ON u.id = m.user_id
  WHERE m.shop_id = p_shop_id
  ORDER BY (m.role = 'owner') DESC, m.created_at;
END;
$$;

COMMIT;
