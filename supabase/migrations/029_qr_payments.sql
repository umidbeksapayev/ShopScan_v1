-- 029: QR to'lov / ekvayring poydevori (v5 S1 — provayderdan mustaqil)
--
-- Maqsad: checkout'da mijozdan Payme/Click/Uzum QR orqali REAL pul olish.
-- Bu FISKALIZATSIYA (024) dan butunlay boshqa narsa: 024 = sotuvni soliqqa
-- yuborish; 029 = mijozdan pul yechib olish (ekvayring).
--
-- "A variant" — pul HAR DO'KON EGASINING o'z merchant hisobiga tushadi.
-- uscan pulni ushlamaydi; faqat egasi bergan merchant_id bilan QR yasaydi va
-- provayder webhook'ini eshitadi. (idokon/billz/yespos ham shu yo'ldan ketgan.)
--
-- Oqim (hold → tasdiq → sotuv):
--   1) Kassir "QR to'lov" tanlaydi → payment_intents (status=pending) yoziladi.
--   2) Ekranda QR (provayder checkout havolasi) ko'rsatiladi.
--   3) Mijoz to'laydi → provayder bizning webhook'imizni chaqiradi →
--      intent.status='paid'.
--   4) Klient (autentifikatsiyalangan kassir) 'paid'ni ko'radi va MAVJUD
--      process_sale_cart'ni idempotent client_id bilan chaqirib sotuvni
--      yakunlaydi (qoldiq faqat shu payt kamayadi). Webhook process_sale_cart
--      chaqirmaydi → service-role / RLS muammosi yo'q.
--
-- Maxfiylik: merchant secret kaliti `shops`ga QO'YILMAYDI — alohida
-- `payment_credentials` jadvalida (SELECT RLS yo'q → client o'qiy olmaydi),
-- xuddi 024 fiscal_credentials qoidasi kabi.
--
-- Orqaga mos: barcha ustunlar nullable / DEFAULT. acquiring_enabled DEFAULT
-- false → mavjud checkout umuman o'zgarmaydi. Bu migration ishga tushmasa ham
-- kod QR usulini ko'rsatmaydi (provayder yoqilmagan).
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–028 ishga tushirilgan bo'lsin. Atomar.

BEGIN;

-- =====================================================
-- 1) shops — ekvayring sozlamalari (faqat MAXFIY BO'LMAGAN identifikatorlar)
--    Maxfiy kalit bu yerda EMAS — payment_credentials'da.
-- =====================================================
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS acquiring_enabled     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acquiring_provider    TEXT
    CHECK (acquiring_provider IS NULL OR acquiring_provider IN ('payme', 'click', 'uzum')),
  ADD COLUMN IF NOT EXISTS acquiring_merchant_id TEXT;

-- =====================================================
-- 2) payment_credentials — MAXFIY merchant kaliti (client O'QIY OLMAYDI)
--    RLS yoqilgan, lekin SELECT policy YO'Q → faqat service-role/DEFINER o'qiydi.
--    Ega yoza oladi (kalitni kiritadi), lekin qaytarib o'qiy olmaydi.
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_credentials (
  shop_id    UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  provider   TEXT NOT NULL,
  secret_key TEXT,            -- Payme Merchant API kaliti (webhook Basic-auth paroli)
  extra      JSONB,           -- provayderga xos (Click: service_id/merchant_user_id, ...)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payment_credentials ENABLE ROW LEVEL SECURITY;
-- Ega faqat YOZA oladi (INSERT/UPDATE/DELETE) — SELECT policy ataylab yo'q.
CREATE POLICY "payment_cred_owner_insert" ON payment_credentials
  FOR INSERT WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "payment_cred_owner_update" ON payment_credentials
  FOR UPDATE USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));
CREATE POLICY "payment_cred_owner_delete" ON payment_credentials
  FOR DELETE USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- Ega kalit o'rnatilgan-yo'qligini SELECT'siz tekshiradi ("ulangan" belgisi).
CREATE OR REPLACE FUNCTION acquiring_has_credentials(p_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM payment_credentials pc
    JOIN shops s ON s.id = pc.shop_id
    WHERE pc.shop_id = p_shop_id
      AND s.owner_id = auth.uid()
      AND pc.secret_key IS NOT NULL
  );
$$;

-- =====================================================
-- 3) payment_intents — bir QR to'lov urinishi (= bir provayder buyurtmasi)
--    status: pending → paid | canceled | failed | expired
--    Payme Merchant API holatini (state/timestamps) shu qatorda saqlaymiz
--    (1 intent : 1 provayder tranzaksiyasi).
-- =====================================================
DO $$ BEGIN
  CREATE TYPE payment_intent_status_enum AS ENUM
    ('pending', 'paid', 'canceled', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payment_intents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  amount        DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  status        payment_intent_status_enum NOT NULL DEFAULT 'pending',
  -- Sotuvni yakunlash uchun savat surati: [{"product_id": "...", "quantity": n}]
  cart_snapshot JSONB NOT NULL,
  search_method TEXT NOT NULL DEFAULT 'manual',
  -- Klient process_sale_cart'ni shu kalit bilan idempotent yakunlaydi.
  client_id     TEXT NOT NULL,
  -- Sotuv yozilgani (reconciliation): klient 'paid'dan keyin true qiladi.
  finalized     BOOLEAN NOT NULL DEFAULT false,
  finalized_at  TIMESTAMPTZ,
  -- Provayder (Payme) tranzaksiya holati — webhook to'ldiradi
  provider_txn_id      TEXT,
  provider_state       SMALLINT,   -- Payme: 1=created, 2=performed, -1/-2=canceled
  provider_create_time BIGINT,     -- ms
  provider_perform_time BIGINT,
  provider_cancel_time BIGINT,
  provider_reason      SMALLINT,   -- bekor qilish sababi
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at       TIMESTAMPTZ,
  canceled_at   TIMESTAMPTZ
);

-- Idempotentlik: bir client_id'ga bitta intent (klient takror yuborsa dublikat bo'lmasin)
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_intents_client
  ON payment_intents(shop_id, client_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_shop ON payment_intents(shop_id);
-- Provayder tranzaksiyasini tez topish (webhook CheckTransaction uchun)
CREATE INDEX IF NOT EXISTS idx_payment_intents_txn
  ON payment_intents(provider_txn_id) WHERE provider_txn_id IS NOT NULL;

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
-- O'qish + yaratish: do'kon a'zosi (kassir QR boshlaydi, holatni kuzatadi).
-- Holatni 'paid'ga o'tkazishni FAQAT webhook (service-role) qiladi — RLS'dan tashqari.
CREATE POLICY "payment_intents_member_select" ON payment_intents
  FOR SELECT USING (is_shop_member(shop_id));
CREATE POLICY "payment_intents_member_insert" ON payment_intents
  FOR INSERT WITH CHECK (is_shop_member(shop_id));

-- Klient 'paid' intentni "yakunlangan" deb belgilaydi (boshqa ustunlarga tegmaydi).
-- Keng UPDATE policy o'rniga tor DEFINER RPC — a'zo summani/holatni buzolmaydi.
CREATE OR REPLACE FUNCTION acquiring_mark_finalized(p_intent_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE payment_intents
  SET finalized = true, finalized_at = now(), updated_at = now()
  WHERE id = p_intent_id
    AND is_shop_member(shop_id)   -- faqat o'z do'koni
    AND status = 'paid';          -- faqat to'langanini
END;
$$;

COMMIT;
