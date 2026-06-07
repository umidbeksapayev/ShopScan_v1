-- Sotuv tranzaksiyasi uchun funksiya (atomar operatsiya)
-- Bu funksiya: 1) inventarni kamaytiradi 2) sotuv yozuvi qo'shadi
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
  -- Mahsulotni FOR UPDATE bilan olish (race condition oldini olish)
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id AND shop_id = p_shop_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mahsulot topilmadi';
  END IF;

  -- Yetarli miqdor borligini tekshirish
  IF v_product.quantity < p_quantity_sold THEN
    RAISE EXCEPTION 'Yetarli miqdor yo''q. Mavjud: % %',
      v_product.quantity,
      CASE WHEN v_product.sale_type = 'unit' THEN 'dona' ELSE 'kg' END;
  END IF;

  -- Inventarni kamaytirish
  UPDATE products
  SET quantity = quantity - p_quantity_sold
  WHERE id = p_product_id;

  -- Sotuv yozuvi qo'shish (snapshot narxlar bilan)
  INSERT INTO sales (
    shop_id, product_id, sale_type,
    quantity_sold,
    cost_price_snapshot, selling_price_snapshot,
    total_revenue, total_profit,
    search_method
  ) VALUES (
    p_shop_id, p_product_id, v_product.sale_type,
    p_quantity_sold,
    v_product.cost_price, v_product.selling_price,
    v_product.selling_price * p_quantity_sold,
    (v_product.selling_price - v_product.cost_price) * p_quantity_sold,
    p_search_method
  ) RETURNING id INTO v_sale_id;

  RETURN v_sale_id;
END;
$$;
