-- ShopScan V3 — Sprint 6 (mobile): Kassa/smena yopish (Z-hisobot)
--
-- Kun oxirida kassir kassadagi naqd pulni sanab, KUTILGAN naqd bilan
-- solishtiradi va farqni (kamomad/ortiqcha) qayd etadi. Kutilgan naqd oxirgi
-- yopilishdan (birinchi marta — Toshkent "bugun" boshidan) hozirgacha:
--     + naqd sotuvlar (paid_amount, payment_method IN cash/debt — nasiya
--       sotuvining boshlang'ich to'lovi naqd olingan deb hisoblanadi)
--     + nasiya to'lovlari (customer_payments — naqd deb olinadi, 013/017
--       konvensiya: record_customer_payment usul saqlamaydi)
--     − qaytarishlar (returns.total_refund — naqd qaytarilgan deb olinadi)
--
-- YANGI USTUN: sales.payment_method — shu paytgacha to'lov usuli DB'da
-- saqlanmasdi (client faqat UI/chek uchun ishlatardi). Eski qatorlar NULL =
-- naqd deb olinadi (013: "mijozsiz sotuv → naqd" konvensiyasiga mos).
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–029 ishga tushirilgan bo'lsin. Atomar.

BEGIN;

-- =====================================================
-- 1) sales.payment_method — to'lov usuli (NULL = eski qator = naqd)
-- =====================================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT
  CHECK (payment_method IN ('cash', 'card', 'qr', 'debt'));

-- =====================================================
-- 2) process_sale_cart — p_payment_method qo'shildi
--    (overload chalkashligi bo'lmasligi uchun eski 6-argli versiya DROP)
-- =====================================================
DROP FUNCTION IF EXISTS process_sale_cart(UUID, JSONB, search_method_enum, UUID, DECIMAL, UUID);

CREATE OR REPLACE FUNCTION process_sale_cart(
  p_shop_id UUID,
  p_items JSONB,
  p_search_method search_method_enum DEFAULT 'manual',
  p_customer_id UUID DEFAULT NULL,
  p_paid_amount DECIMAL(12,2) DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL
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
  v_dup JSONB;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Savat bo''sh';
  END IF;

  -- A'zolik tekshiruvi (ega yoki kassir sota oladi)
  IF NOT is_shop_member(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  IF p_payment_method IS NOT NULL
     AND p_payment_method NOT IN ('cash', 'card', 'qr', 'debt') THEN
    RAISE EXCEPTION 'Noto''g''ri to''lov usuli: %', p_payment_method;
  END IF;

  -- Idempotentlik: shu client_id bilan sotuv allaqachon yozilgan bo'lsa,
  -- qayta yozmaymiz — mavjudini qaytaramiz (offline replay xavfsiz).
  IF p_client_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'sale_id', s.id,
      'item_count', s.item_count,
      'total_revenue', s.total_revenue,
      'total_profit', s.total_profit,
      'paid_amount', s.paid_amount,
      'debt', s.total_revenue - s.paid_amount,
      'duplicate', true
    ) INTO v_dup
    FROM sales s
    WHERE s.shop_id = p_shop_id AND s.client_id = p_client_id;
    IF v_dup IS NOT NULL THEN
      RETURN v_dup;
    END IF;
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM customers WHERE id = p_customer_id AND shop_id = p_shop_id
  ) THEN
    RAISE EXCEPTION 'Mijoz topilmadi';
  END IF;

  INSERT INTO sales (
    shop_id, customer_id, cashier_id, client_id, payment_method,
    total_revenue, total_profit, item_count, paid_amount, search_method, sold_at
  )
  VALUES (p_shop_id, p_customer_id, auth.uid(), p_client_id, p_payment_method,
          0, 0, 0, 0, p_search_method, v_now)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::DECIMAL;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Noto''g''ri miqdor';
    END IF;

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
-- 3) cash_closures — kassa yopilishlari (Z-hisobot yozuvlari)
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  expected_cash DECIMAL(14,2) NOT NULL,
  counted_cash DECIMAL(14,2) NOT NULL CHECK (counted_cash >= 0),
  -- Farq: + ortiqcha, − kamomad
  difference DECIMAL(14,2) GENERATED ALWAYS AS (counted_cash - expected_cash) STORED,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_closures_shop ON cash_closures(shop_id, created_at DESC);

ALTER TABLE cash_closures ENABLE ROW LEVEL SECURITY;

-- O'qish: do'kon a'zosi (naqd tushum maxfiy emas — kassir kassani o'zi sanaydi;
-- cost_price/foyda bu jadvalda YO'Q). Yozish FAQAT close_cash_shift RPC orqali
-- (expected_cash'ni server hisoblaydi — client soxtalashtira olmaydi).
CREATE POLICY "cash_closures_member_select" ON cash_closures
  FOR SELECT USING (is_shop_member(shop_id));

-- O'chirish: faqat egasi (xato yozilgan yopilishni tozalash uchun).
CREATE POLICY "cash_closures_owner_delete" ON cash_closures
  FOR DELETE USING (is_shop_owner(shop_id));

-- =====================================================
-- 4) get_expected_cash — kutilgan naqd (oxirgi yopilishdan beri)
-- =====================================================
CREATE OR REPLACE FUNCTION get_expected_cash(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from TIMESTAMPTZ;
  v_to TIMESTAMPTZ := now();
  v_cash_sales DECIMAL(14,2);
  v_debt_payments DECIMAL(14,2);
  v_refunds DECIMAL(14,2);
BEGIN
  IF NOT is_shop_member(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  -- Davr boshi: oxirgi yopilish; hech qachon yopilmagan bo'lsa — Toshkent
  -- "bugun" boshi (021 dagi sargable UTC-chegara shakli).
  SELECT MAX(period_end) INTO v_from FROM cash_closures WHERE shop_id = p_shop_id;
  IF v_from IS NULL THEN
    v_from := (((now() AT TIME ZONE 'Asia/Tashkent')::date)::timestamp) AT TIME ZONE 'Asia/Tashkent';
  END IF;

  -- Naqd tushum: cash + debt (nasiya boshlang'ich to'lovi naqd deb olinadi);
  -- NULL = 030 dan oldingi qatorlar = naqd. Karta/QR kassaga tushmaydi.
  SELECT COALESCE(SUM(s.paid_amount), 0) INTO v_cash_sales
  FROM sales s
  WHERE s.shop_id = p_shop_id
    AND s.sold_at >= v_from AND s.sold_at < v_to
    AND COALESCE(s.payment_method, 'cash') IN ('cash', 'debt');

  SELECT COALESCE(SUM(cp.amount), 0) INTO v_debt_payments
  FROM customer_payments cp
  WHERE cp.shop_id = p_shop_id
    AND cp.paid_at >= v_from AND cp.paid_at < v_to;

  SELECT COALESCE(SUM(r.total_refund), 0) INTO v_refunds
  FROM returns r
  WHERE r.shop_id = p_shop_id
    AND r.created_at >= v_from AND r.created_at < v_to;

  RETURN jsonb_build_object(
    'from', v_from,
    'to', v_to,
    'cash_sales', v_cash_sales,
    'debt_payments', v_debt_payments,
    'refunds', v_refunds,
    'expected_cash', v_cash_sales + v_debt_payments - v_refunds
  );
END;
$$;

-- =====================================================
-- 5) close_cash_shift — kassani yopish (atomar, server hisoblaydi)
-- =====================================================
CREATE OR REPLACE FUNCTION close_cash_shift(
  p_shop_id UUID,
  p_counted_cash DECIMAL(14,2),
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exp JSONB;
  v_row cash_closures%ROWTYPE;
BEGIN
  IF NOT is_shop_member(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  IF p_counted_cash IS NULL OR p_counted_cash < 0 THEN
    RAISE EXCEPTION 'Noto''g''ri summa';
  END IF;

  -- Parallel yopishni serial qiladi (ikki kassir bir vaqtda yopsa davr
  -- chegaralari ustma-ust tushmasin).
  PERFORM 1 FROM shops WHERE id = p_shop_id FOR UPDATE;

  v_exp := get_expected_cash(p_shop_id);

  INSERT INTO cash_closures (
    shop_id, cashier_id, period_start, period_end,
    expected_cash, counted_cash, note
  ) VALUES (
    p_shop_id, auth.uid(),
    (v_exp->>'from')::TIMESTAMPTZ, (v_exp->>'to')::TIMESTAMPTZ,
    (v_exp->>'expected_cash')::DECIMAL, p_counted_cash, NULLIF(TRIM(p_note), '')
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'period_start', v_row.period_start,
    'period_end', v_row.period_end,
    'expected_cash', v_row.expected_cash,
    'counted_cash', v_row.counted_cash,
    'difference', v_row.difference,
    'note', v_row.note,
    'created_at', v_row.created_at,
    'cash_sales', v_exp->'cash_sales',
    'debt_payments', v_exp->'debt_payments',
    'refunds', v_exp->'refunds'
  );
END;
$$;

COMMIT;
