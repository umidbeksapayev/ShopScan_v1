-- ShopScan — Savat (cart) orqali atomar ko'p mahsulotli sotuv
-- Bir nechta mahsulotni BITTA tranzaksiyada sotadi: hammasi muvaffaqiyatli yoki hammasi bekor.
-- Har bir element uchun: inventar tekshiruvi + kamaytirish + snapshot narxlar bilan sales yozuvi.
--
-- p_items format (jsonb massiv): [{"product_id": "uuid", "quantity": 2}, ...]

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

  -- Har bir savat elementi bo'yicha
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

    -- Yetarli miqdor borligini tekshirish
    IF v_product.quantity < v_qty THEN
      RAISE EXCEPTION 'Yetarli miqdor yo''q: "%" (mavjud: % %)',
        v_product.name,
        v_product.quantity,
        CASE WHEN v_product.sale_type = 'unit' THEN 'dona' ELSE 'kg' END;
    END IF;

    -- Inventarni kamaytirish
    UPDATE products
    SET quantity = quantity - v_qty
    WHERE id = v_product.id;

    -- Sotuv yozuvi (snapshot narxlar bilan)
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
