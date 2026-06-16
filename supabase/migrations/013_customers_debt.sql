-- ShopScan V3 — Sprint 1 (F3-1): Nasiya / Qarz daftari
-- Mijozlar + qarz hisobi + to'lovlar. Qog'oz "qarz daftari" o'rnini bosadi.
--
-- Qarz balansi = Σ(sotuv qarzi: total_revenue − paid_amount) − Σ(mijoz to'lovlari)
--   • Mijozsiz sotuv  → paid_amount = total_revenue (naqd, qarz yo'q)
--   • Mijoz bilan      → qisman to'lov mumkin, qolgani qarzga yoziladi
--
-- Supabase SQL Editor da bajaring. DIQQAT: avval 001–012 ishga tushirilgan bo'lsin.

-- =====================================================
-- 1) customers — mijozlar
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_shop_id ON customers(shop_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_shop_owner_only" ON customers
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 2) customer_payments — qarz to'lovlari (qaytarib berishlar)
-- =====================================================
CREATE TABLE customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id, paid_at DESC);
CREATE INDEX idx_customer_payments_shop ON customer_payments(shop_id);

ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_payments_shop_owner_only" ON customer_payments
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 3) sales (sarlavha) ga qarz ustunlari
-- =====================================================
ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Eski sotuvlar to'liq to'langan deb hisoblanadi (naqd)
UPDATE sales SET paid_amount = total_revenue;

CREATE INDEX idx_sales_customer ON sales(customer_id) WHERE customer_id IS NOT NULL;

-- =====================================================
-- 4) process_sale_cart — mijoz + qisman to'lovni qo'llaydi
--    (overload chalkashligi bo'lmasligi uchun eski versiya DROP qilinadi)
-- =====================================================
DROP FUNCTION IF EXISTS process_sale_cart(UUID, JSONB, search_method_enum);

CREATE OR REPLACE FUNCTION process_sale_cart(
  p_shop_id UUID,
  p_items JSONB,
  p_search_method search_method_enum DEFAULT 'manual',
  p_customer_id UUID DEFAULT NULL,
  p_paid_amount DECIMAL(12,2) DEFAULT NULL
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
  v_paid DECIMAL(12,2);
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

  -- Mijoz berilgan bo'lsa — shu do'konga tegishliligini tekshiramiz
  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM customers WHERE id = p_customer_id AND shop_id = p_shop_id
  ) THEN
    RAISE EXCEPTION 'Mijoz topilmadi';
  END IF;

  -- Sarlavhani avval yaratamiz (sale_items FK uchun)
  INSERT INTO sales (shop_id, customer_id, total_revenue, total_profit, item_count, paid_amount, search_method, sold_at)
  VALUES (p_shop_id, p_customer_id, 0, 0, 0, 0, p_search_method, v_now)
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

  -- To'langan summa: mijozsiz → to'liq; mijoz bilan → kiritilgan (0..total ga cheklangan)
  IF p_customer_id IS NULL THEN
    v_paid := v_total_revenue;
  ELSE
    v_paid := LEAST(GREATEST(COALESCE(p_paid_amount, v_total_revenue), 0), v_total_revenue);
  END IF;

  UPDATE sales
  SET total_revenue = v_total_revenue,
      total_profit = v_total_profit,
      item_count = v_item_count,
      paid_amount = v_paid
  WHERE id = v_sale_id;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'item_count', v_item_count,
    'total_revenue', v_total_revenue,
    'total_profit', v_total_profit,
    'paid_amount', v_paid,
    'debt', v_total_revenue - v_paid
  );
END;
$$;

-- =====================================================
-- 5) record_customer_payment — qarz to'lovini qabul qilish (atomar)
-- =====================================================
CREATE OR REPLACE FUNCTION record_customer_payment(
  p_shop_id UUID,
  p_customer_id UUID,
  p_amount DECIMAL(12,2),
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL(12,2);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM shops WHERE id = p_shop_id AND owner_id = auth.uid()
  ) THEN
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

-- =====================================================
-- 6) get_customers_with_balance — ro'yxat uchun (har mijoz + joriy balans)
-- =====================================================
CREATE OR REPLACE FUNCTION get_customers_with_balance(p_shop_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  note TEXT,
  created_at TIMESTAMPTZ,
  balance DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM shops WHERE id = p_shop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  -- Ichki subquery: RETURNS TABLE ustun nomlari (balance, id...) PL/pgSQL
  -- o'zgaruvchilari bilan to'qnashmasligi uchun barcha murojaatlar qualified.
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
