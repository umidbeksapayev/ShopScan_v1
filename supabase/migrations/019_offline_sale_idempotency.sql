-- ShopScan V3 — Sprint 6b: Internetsiz sotuv uchun idempotent sync
--
-- Offline sotuvlar IndexedDB navbatiga yoziladi; ulanish tiklangach
-- process_sale_cart orqali ketma-ket yuboriladi (replay). Agar replay paytida
-- mijoz yoki tarmoq uzilib qayta yuborilsa — sotuv IKKI MARTA yozilmasligi kerak.
--
-- Yechim: har sotuvga client tomonidan generatsiya qilingan client_id (UUID).
-- Shu client_id bilan sotuv allaqachon mavjud bo'lsa — qayta yozilmaydi, mavjudi
-- qaytariladi. UNIQUE(shop_id, client_id) — DB darajasidagi kafolat.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–018 ishga tushirilgan bo'lsin. Atomar.

BEGIN;

-- =====================================================
-- 1) sales.client_id — offline sotuvning lokal identifikatori (idempotentlik)
-- =====================================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_shop_client
  ON sales(shop_id, client_id) WHERE client_id IS NOT NULL;

-- =====================================================
-- 2) process_sale_cart — p_client_id qo'shildi (idempotent replay)
--    Eski 5-argli versiya DROP (overload chalkashligini oldini olish)
-- =====================================================
DROP FUNCTION IF EXISTS process_sale_cart(UUID, JSONB, search_method_enum, UUID, DECIMAL);

CREATE OR REPLACE FUNCTION process_sale_cart(
  p_shop_id UUID,
  p_items JSONB,
  p_search_method search_method_enum DEFAULT 'manual',
  p_customer_id UUID DEFAULT NULL,
  p_paid_amount DECIMAL(12,2) DEFAULT NULL,
  p_client_id UUID DEFAULT NULL
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
    shop_id, customer_id, cashier_id, client_id,
    total_revenue, total_profit, item_count, paid_amount, search_method, sold_at
  )
  VALUES (p_shop_id, p_customer_id, auth.uid(), p_client_id, 0, 0, 0, 0, p_search_method, v_now)
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

COMMIT;
