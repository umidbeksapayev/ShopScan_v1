-- 024: OFD / Fiskal chek poydevori (S8a — provayderdan mustaqil)
--
-- O'zbekiston qonuni: har sotuv uchun QR kodli fiskal chek (ChEK) real vaqtda
-- OFD (Fiskal Ma'lumotlar Operatori) orqali Soliq qo'mitasiga yuborilishi shart.
-- Bu migration FAQAT ma'lumotlar modeli poydevorini quradi — real chek yuborish
-- (Payme/CLICK API) S8b'da, sandbox kredensialdan keyin ulanadi.
--
-- Orqaga mos: barcha yangi ustunlar nullable / DEFAULT bilan. fiscal_enabled
-- DEFAULT false → mavjud sotuv oqimi umuman o'zgarmaydi/buzilmaydi.
--
-- Maxfiylik: Payme/CLICK API kaliti `shops`ga ochiq QO'YILMAYDI — alohida
-- `fiscal_credentials` jadvalida (SELECT RLS yo'q → client o'qiy olmaydi),
-- xuddi cost_price maxfiyligi qoidasi kabi. Faqat server (service-role /
-- SECURITY DEFINER) o'qiydi.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–023 ishga tushirilgan bo'lsin. Atomar.

BEGIN;

-- =====================================================
-- 1) products — fiskal maydonlar (har biri ixtiyoriy)
--    mxik_code: MXIK/IKPU tovar tasnif kodi (fiskal chek uchun shart)
--    package_code: qadoq kodi (MXIK bilan birga ishlatiladi)
--    vat_percent: QQS stavkasi (YaTT/soddalashtirilgan rejimda 0 bo'lishi mumkin)
-- =====================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS mxik_code    TEXT,
  ADD COLUMN IF NOT EXISTS package_code TEXT,
  ADD COLUMN IF NOT EXISTS vat_percent  SMALLINT NOT NULL DEFAULT 0
    CHECK (vat_percent BETWEEN 0 AND 100);

-- =====================================================
-- 2) shops — fiskal sozlamalar (faqat MAXFIY BO'LMAGAN identifikatorlar)
--    Maxfiy API kaliti bu yerda EMAS — fiscal_credentials'da.
-- =====================================================
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS fiscal_enabled     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fiscal_provider    TEXT
    CHECK (fiscal_provider IS NULL OR fiscal_provider IN ('payme', 'click', 'multikassa')),
  ADD COLUMN IF NOT EXISTS fiscal_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS fiscal_terminal_id TEXT,
  ADD COLUMN IF NOT EXISTS tax_inn            TEXT;   -- STIR/INN

-- =====================================================
-- 3) fiscal_credentials — MAXFIY kalitlar (client O'QIY OLMAYDI)
--    RLS yoqilgan, lekin SELECT policy YO'Q → faqat service-role/DEFINER o'qiydi.
--    Ega yoza oladi (kalitni kiritadi), lekin qaytarib o'qiy olmaydi.
-- =====================================================
CREATE TABLE IF NOT EXISTS fiscal_credentials (
  shop_id    UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  provider   TEXT NOT NULL,
  secret_key TEXT,            -- Payme/CLICK maxfiy kaliti
  extra      JSONB,           -- provayderga xos qo'shimcha (login, kassa_id, ...)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fiscal_credentials ENABLE ROW LEVEL SECURITY;
-- Ega faqat YOZA oladi (INSERT/UPDATE/DELETE) — SELECT policy ataylab yo'q.
CREATE POLICY "fiscal_cred_owner_insert" ON fiscal_credentials
  FOR INSERT WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "fiscal_cred_owner_update" ON fiscal_credentials
  FOR UPDATE USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "fiscal_cred_owner_delete" ON fiscal_credentials
  FOR DELETE USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- Ega kalit o'rnatilgan-yo'qligini SELECT'siz tekshiradi (sozlamada "ulangan" belgisi).
CREATE OR REPLACE FUNCTION fiscal_has_credentials(p_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM fiscal_credentials fc
    JOIN shops s ON s.id = fc.shop_id
    WHERE fc.shop_id = p_shop_id
      AND s.owner_id = auth.uid()
      AND fc.secret_key IS NOT NULL
  );
$$;

-- =====================================================
-- 4) fiscal_receipts — chek yozuvlari (offline navbatga mos)
--    Bir sotuv (sales) = bir fiskal chek. status: pending→sent/failed.
--    Sotuv darhol o'tadi; fiskalizatsiya 'pending' bo'lib qoladi va
--    reconnect/retry'da yuboriladi (019 idempotency patterniga o'xshash).
-- =====================================================
DO $$ BEGIN
  CREATE TYPE fiscal_status_enum AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS fiscal_receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sale_id        UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  provider       TEXT,
  status         fiscal_status_enum NOT NULL DEFAULT 'pending',
  fiscal_sign    TEXT,        -- provayderdan qaytgan fiskal belgi (ФП)
  receipt_number TEXT,        -- chek raqami
  qr_url         TEXT,        -- chekdagi QR (tekshirish havolasi)
  payload        JSONB,       -- yuborilgan ma'lumot (audit/qayta yuborish)
  response       JSONB,       -- provayder javobi (audit)
  error          TEXT,        -- oxirgi xato matni (failed bo'lsa)
  retry_count    INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at        TIMESTAMPTZ
);

-- Bir sotuvga bitta chek (idempotentlik — qayta yuborishda dublikat bo'lmasin)
CREATE UNIQUE INDEX IF NOT EXISTS uq_fiscal_receipts_sale ON fiscal_receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_shop ON fiscal_receipts(shop_id);
-- Yuborilmagan cheklarni tez topish (reconnect sync uchun)
CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_pending
  ON fiscal_receipts(shop_id, status) WHERE status <> 'sent';

ALTER TABLE fiscal_receipts ENABLE ROW LEVEL SECURITY;
-- O'qish: do'kon a'zosi (kassir chekni ko'radi/qayta chop etadi)
CREATE POLICY "fiscal_receipts_member_select" ON fiscal_receipts
  FOR SELECT USING (is_shop_member(shop_id));
-- Yozish: do'kon a'zosi (sotuv jarayoni a'zo tomonidan boshlanadi).
-- S8b'da server (DEFINER/service-role) ham yozishi mumkin — u RLS'ni chetlab o'tadi.
CREATE POLICY "fiscal_receipts_member_write" ON fiscal_receipts
  FOR ALL USING (is_shop_member(shop_id))
  WITH CHECK (is_shop_member(shop_id));

-- =====================================================
-- 5) import_products — MXIK/QQS ustunlarini qabul qiladi (orqaga mos)
--    Yangi ixtiyoriy maydonlar: mxik_code, package_code, vat_percent.
--    Mavjud importlar (bu maydonlarsiz) avvalgidek ishlaydi.
-- =====================================================
CREATE OR REPLACE FUNCTION import_products(p_shop_id UUID, p_rows JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row JSONB;
  v_name TEXT;
  v_sale_type TEXT;
  v_cost DECIMAL(12,2);
  v_selling DECIMAL(12,2);
  v_qty DECIMAL(12,3);
  v_low DECIMAL(12,3);
  v_barcode TEXT;
  v_cat_name TEXT;
  v_cat_id UUID;
  v_mxik TEXT;
  v_package TEXT;
  v_vat SMALLINT;
  v_inserted INT := 0;
  v_skipped INT := 0;
  v_cats_created INT := 0;
BEGIN
  IF NOT has_perm(p_shop_id, 'manage_products') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  IF p_rows IS NULL OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'Import qatorlari yo''q';
  END IF;
  IF jsonb_array_length(p_rows) > 2000 THEN
    RAISE EXCEPTION 'Bir importda 2000 tadan ko''p qator bo''lmasin';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_name := NULLIF(TRIM(v_row->>'name'), '');
    v_sale_type := v_row->>'sale_type';
    v_cost := NULLIF(v_row->>'cost_price', '')::DECIMAL;
    v_selling := NULLIF(v_row->>'selling_price', '')::DECIMAL;
    v_qty := NULLIF(v_row->>'quantity', '')::DECIMAL;
    v_low := COALESCE(NULLIF(v_row->>'low_stock_alert', '')::DECIMAL, 0);
    v_barcode := NULLIF(TRIM(v_row->>'barcode'), '');
    v_cat_name := NULLIF(TRIM(v_row->>'category'), '');
    v_mxik := NULLIF(TRIM(v_row->>'mxik_code'), '');
    v_package := NULLIF(TRIM(v_row->>'package_code'), '');
    -- QQS: bo'sh/yaroqsiz → 0; 0–100 oralig'iga qisiladi
    v_vat := LEAST(GREATEST(COALESCE(NULLIF(v_row->>'vat_percent', '')::SMALLINT, 0), 0), 100);

    -- Server-side mudofaa: yaroqsiz qatorni o'tkazib yuboramiz
    IF v_name IS NULL
       OR v_sale_type NOT IN ('unit', 'weight')
       OR v_cost IS NULL OR v_cost < 0
       OR v_selling IS NULL OR v_selling < 0
       OR v_qty IS NULL OR v_qty < 0 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Barcode to'qnashuvi (do'kon ichida UNIQUE)
    IF v_barcode IS NOT NULL AND EXISTS (
      SELECT 1 FROM products WHERE shop_id = p_shop_id AND barcode = v_barcode
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Kategoriya: nom bo'yicha topish yoki yaratish
    v_cat_id := NULL;
    IF v_cat_name IS NOT NULL THEN
      SELECT id INTO v_cat_id FROM categories
      WHERE shop_id = p_shop_id AND lower(name) = lower(v_cat_name);
      IF v_cat_id IS NULL THEN
        INSERT INTO categories (shop_id, name) VALUES (p_shop_id, v_cat_name)
        RETURNING id INTO v_cat_id;
        v_cats_created := v_cats_created + 1;
      END IF;
    END IF;

    INSERT INTO products (
      shop_id, name, sale_type, cost_price, selling_price,
      quantity, low_stock_alert, barcode, image_url, category_id, is_active,
      mxik_code, package_code, vat_percent
    ) VALUES (
      p_shop_id, v_name, v_sale_type::sale_type_enum, v_cost, v_selling,
      v_qty, v_low, v_barcode, NULL, v_cat_id, true,
      v_mxik, v_package, v_vat
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'skipped', v_skipped,
    'categories_created', v_cats_created
  );
END;
$$;

COMMIT;
