-- 028: Foydalanuvchi fikr-mulohazasi (Taklif / Shikoyat / Xato)
--
-- Ilovadan yuborilgan fikr DB'ga saqlanadi (yo'qolmasin) + admin Telegram'iga
-- yuboriladi (server route orqali). O'qish — faqat admin (kelajakda panel);
-- yozish — har autentifikatsiyalangan foydalanuvchi o'z fikrini.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–027. Orqaga mos.

BEGIN;

CREATE TABLE IF NOT EXISTS feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    UUID REFERENCES shops(id) ON DELETE SET NULL,
  user_id    UUID NOT NULL,
  email      TEXT,
  category   TEXT NOT NULL CHECK (category IN ('suggestion', 'complaint', 'bug')),
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- Yozish: foydalanuvchi faqat o'z fikrini (user_id = auth.uid()).
-- O'qish policy YO'Q → oddiy foydalanuvchi o'qiy olmaydi (admin service_role bilan).
CREATE POLICY "feedback_insert_own" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
