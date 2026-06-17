-- ShopScan V3 — Sprint 3 (F3-3): Kirim / Ta'minotchi
--
-- Mahsulot kirimi (stock-in): inventar +qty, tan narx YANGILANADI (o'rtacha narx).
-- profit_per_unit GENERATED ustun — cost_price o'zgarsa avtomatik qayta hisoblanadi.
--
-- Supabase SQL Editor da bajaring. DIQQAT: avval 001–014 ishga tushirilgan bo'lsin.

-- =====================================================
-- 1) suppliers — ta'minotchilar
-- =====================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_shop ON suppliers(shop_id);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_shop_owner_only" ON suppliers
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 2) purchases — kirim sarlavhasi
-- =====================================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_shop ON purchases(shop_id, created_at DESC);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_shop_owner_only" ON purchases
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 3) purchase_items — kirim qatorlari
-- =====================================================
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_items_shop_owner_only" ON purchase_items
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 4) process_purchase — atomar kirim
--    p_items: [{ "product_id": uuid, "quantity": number, "cost_price": number }]
-- =====================================================
CREATE OR REPLACE FUNCTION process_purchase(
  p_shop_id UUID,
  p_supplier_id UUID,
  p_items JSONB,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  IF NOT EXISTS (
    SELECT 1 FROM shops WHERE id = p_shop_id AND owner_id = auth.uid()
  ) THEN
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
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Noto''g''ri miqdor';
    END IF;
    IF v_cost IS NULL OR v_cost < 0 THEN
      RAISE EXCEPTION 'Noto''g''ri tan narx';
    END IF;

    -- Mahsulotni qulflaymiz
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID AND shop_id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mahsulot topilmadi';
    END IF;

    -- O'rtacha (weighted average) tan narx
    v_new_cost := ROUND(
      ((v_product.quantity * v_product.cost_price) + (v_qty * v_cost))
        / (v_product.quantity + v_qty),
      2
    );

    UPDATE products
    SET quantity = quantity + v_qty,
        cost_price = v_new_cost
    WHERE id = v_product.id;

    INSERT INTO purchase_items (purchase_id, product_id, shop_id, quantity, cost_price)
    VALUES (v_purchase_id, v_product.id, p_shop_id, v_qty, v_cost);

    v_total := v_total + (v_qty * v_cost);
  END LOOP;

  UPDATE purchases SET total = v_total WHERE id = v_purchase_id;

  RETURN jsonb_build_object('purchase_id', v_purchase_id, 'total', v_total);
END;
$$;
