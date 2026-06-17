-- ShopScan V3 — Sprint 4 (F3-5): Ko'p kassir + rollar (2 rol: owner / cashier)
--
-- RLS modelini `shops.owner_id` dan `shop_members` ga ko'chiradi. Endi do'kon
-- ma'lumotlariga A'ZO bo'lgan foydalanuvchilar kiradi (ega yoki kassir).
-- Kassir: faqat sotuv + o'z sotuvlari + mijoz tanlash. Tan narx/foyda/kirim/
-- ta'minotchi/qaytarish/hisobot/sozlama — FAQAT ega.
--
-- ⚠️ ENG XAVFLI MIGRATSIYA. Atomar (BEGIN/COMMIT). Avval 001–015 bo'lsin.
-- Bajarilgach: EGA hamma narsani avvalgidek ko'radi (u ham a'zo).

BEGIN;

-- =====================================================
-- 1) shop_members — do'kon a'zolari (ega + kassirlar)
-- =====================================================
CREATE TABLE shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'cashier')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);

CREATE INDEX idx_shop_members_user ON shop_members(user_id);
CREATE INDEX idx_shop_members_shop ON shop_members(shop_id);

-- Mavjud egalarni a'zo qilib backfill (busiz ega kira olmay qoladi)
INSERT INTO shop_members (shop_id, user_id, role)
SELECT id, owner_id, 'owner' FROM shops
ON CONFLICT (shop_id, user_id) DO NOTHING;

-- =====================================================
-- 2) Helper funksiyalar (SECURITY DEFINER → RLS rekursiyasidan qochish)
-- =====================================================
CREATE OR REPLACE FUNCTION is_shop_member(p_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM shop_members WHERE shop_id = p_shop_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_shop_owner(p_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM shop_members
    WHERE shop_id = p_shop_id AND user_id = auth.uid() AND role = 'owner'
  );
$$;

-- =====================================================
-- 3) shop_members RLS
-- =====================================================
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_members_select" ON shop_members
  FOR SELECT USING (user_id = auth.uid() OR is_shop_owner(shop_id));
CREATE POLICY "shop_members_owner_write" ON shop_members
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));

-- =====================================================
-- 4) sales.cashier_id — kim sotdi
-- =====================================================
ALTER TABLE sales ADD COLUMN cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX idx_sales_cashier ON sales(cashier_id);

-- =====================================================
-- 5) RLS qayta yozish — eski owner-only siyosatlarni a'zolik modeliga
-- =====================================================
-- shops: a'zo o'qiydi, ega tahrirlaydi
DROP POLICY IF EXISTS "shops_owner_only" ON shops;
CREATE POLICY "shops_member_select" ON shops
  FOR SELECT USING (is_shop_member(id));
CREATE POLICY "shops_owner_write" ON shops
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- products: a'zo o'qiydi (sotuv uchun), faqat ega yozadi
DROP POLICY IF EXISTS "products_shop_owner_only" ON products;
CREATE POLICY "products_member_select" ON products
  FOR SELECT USING (is_shop_member(shop_id));
CREATE POLICY "products_owner_write" ON products
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));

-- sales: ega hammasini, kassir o'zinikini o'qiydi (yozish process_sale_cart orqali)
DROP POLICY IF EXISTS "sales_shop_owner_only" ON sales;
CREATE POLICY "sales_member_select" ON sales
  FOR SELECT USING (
    is_shop_member(shop_id) AND (is_shop_owner(shop_id) OR cashier_id = auth.uid())
  );

-- sale_items: ega hammasini, kassir o'z sotuvi qatorlarini
DROP POLICY IF EXISTS "sale_items_shop_owner_only" ON sale_items;
CREATE POLICY "sale_items_member_select" ON sale_items
  FOR SELECT USING (
    is_shop_member(shop_id) AND (
      is_shop_owner(shop_id)
      OR EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_items.sale_id AND s.cashier_id = auth.uid())
    )
  );

-- customers: a'zo (kassir nasiya sotuvida mijoz tanlash/qo'shish)
DROP POLICY IF EXISTS "customers_shop_owner_only" ON customers;
CREATE POLICY "customers_member_all" ON customers
  FOR ALL USING (is_shop_member(shop_id)) WITH CHECK (is_shop_member(shop_id));

-- customer_payments: faqat ega
DROP POLICY IF EXISTS "customer_payments_shop_owner_only" ON customer_payments;
CREATE POLICY "customer_payments_owner_all" ON customer_payments
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));

-- returns / return_items: faqat ega
DROP POLICY IF EXISTS "returns_shop_owner_only" ON returns;
CREATE POLICY "returns_owner_all" ON returns
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));
DROP POLICY IF EXISTS "return_items_shop_owner_only" ON return_items;
CREATE POLICY "return_items_owner_all" ON return_items
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));

-- suppliers / purchases / purchase_items: faqat ega (tan narx)
DROP POLICY IF EXISTS "suppliers_shop_owner_only" ON suppliers;
CREATE POLICY "suppliers_owner_all" ON suppliers
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));
DROP POLICY IF EXISTS "purchases_shop_owner_only" ON purchases;
CREATE POLICY "purchases_owner_all" ON purchases
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));
DROP POLICY IF EXISTS "purchase_items_shop_owner_only" ON purchase_items;
CREATE POLICY "purchase_items_owner_all" ON purchase_items
  FOR ALL USING (is_shop_owner(shop_id)) WITH CHECK (is_shop_owner(shop_id));

-- =====================================================
-- 6) Signup trigger — yangi egaga shop_members yozuvi ham
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop_id UUID;
BEGIN
  INSERT INTO public.shops (owner_id, name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'shop_name'), ''), 'Mening do''konim')
  )
  RETURNING id INTO v_shop_id;

  INSERT INTO public.shop_members (shop_id, user_id, role)
  VALUES (v_shop_id, NEW.id, 'owner')
  ON CONFLICT (shop_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 7) process_sale_cart — a'zolik tekshiruvi + cashier_id
-- =====================================================
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

  -- A'zolik tekshiruvi (ega yoki kassir sota oladi)
  IF NOT is_shop_member(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM customers WHERE id = p_customer_id AND shop_id = p_shop_id
  ) THEN
    RAISE EXCEPTION 'Mijoz topilmadi';
  END IF;

  INSERT INTO sales (shop_id, customer_id, cashier_id, total_revenue, total_profit, item_count, paid_amount, search_method, sold_at)
  VALUES (p_shop_id, p_customer_id, auth.uid(), 0, 0, 0, 0, p_search_method, v_now)
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
-- 8) Eski, ishlatilmaydigan process_sale (yagona, egalik tekshiruvisiz) — o'chiramiz
-- =====================================================
DROP FUNCTION IF EXISTS process_sale(UUID, UUID, DECIMAL, search_method_enum);

-- =====================================================
-- 9) Xodim boshqaruvi RPC'lari (egasi email orqali biriktiradi/o'chiradi)
-- =====================================================
CREATE OR REPLACE FUNCTION add_shop_member(p_shop_id UUID, p_email TEXT, p_role TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT is_shop_owner(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  IF p_role NOT IN ('owner', 'cashier') THEN
    RAISE EXCEPTION 'Noto''g''ri rol';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email));
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Bu email bilan foydalanuvchi topilmadi. Avval ro''yxatdan o''tsin.';
  END IF;

  INSERT INTO shop_members (shop_id, user_id, role)
  VALUES (p_shop_id, v_user_id, p_role)
  ON CONFLICT (shop_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object('user_id', v_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION remove_shop_member(p_shop_id UUID, p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_shop_owner(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  -- Egani o'chirib bo'lmaydi
  DELETE FROM shop_members
  WHERE shop_id = p_shop_id AND user_id = p_user_id AND role <> 'owner';
END;
$$;

COMMIT;
