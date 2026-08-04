-- 032: Mobil push bildirishnomalar (P1) — Expo push tokenlari
--
-- Hozirgacha mobil ilovada FAQAT lokal eslatma bor edi (`expo-notifications`
-- scheduleNotificationAsync) — u ilova ichida rejalashtiriladi va serverdagi
-- haqiqiy holatni bilmaydi. Kunlik xulosa esa faqat Telegram orqali yuborilardi,
-- ya'ni Telegramni ulamagan ega hech qanday xabar olmasdi.
--
-- Bu migratsiya push kanalini qo'shadi: ilova qurilma tokenini yozadi, cron
-- (`/api/cron/owner-summary`) Telegram bilan YONMA-YON push ham yuboradi.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–031 ishga tushirilgan bo'lsin.

BEGIN;

-- =====================================================
-- 1) push_tokens — qurilma tokenlari
--    Bitta foydalanuvchida bir nechta qurilma bo'lishi mumkin, shuning uchun
--    kalit `token` (qurilmaga xos), `user_id` emas.
-- =====================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id    UUID REFERENCES shops(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL DEFAULT 'unknown' CHECK (platform IN ('ios', 'android', 'unknown')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_shop ON push_tokens(shop_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Foydalanuvchi FAQAT o'z tokenlarini boshqaradi. O'qish ham o'zi uchun —
-- boshqa birovning qurilma tokenini bilish kerak emas (cron service_role bilan o'qiydi).
CREATE POLICY "push_tokens_own_select" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_tokens_own_insert" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_tokens_own_update" ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_tokens_own_delete" ON push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2) get_push_summaries — slot bo'yicha egalar + ularning push tokenlari
--
--    `get_owner_summaries` (027) bilan bir xil hisob-kitob, ikkita farq bilan:
--      • Telegram chat_id TALAB QILINMAYDI — push mustaqil kanal;
--      • chat_id o'rniga egadagi push tokenlar massivi qaytadi.
--    Bitta do'kon bir nechta qurilmaga ega bo'lishi mumkin (telefon + planshet).
-- =====================================================
CREATE OR REPLACE FUNCTION get_push_summaries(p_slot TEXT)
RETURNS TABLE (
  shop_id UUID, shop_name TEXT, tokens TEXT[],
  total_debt DECIMAL(12,2), debtor_count INT, overdue_count INT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    sh.id,
    sh.name,
    ARRAY(
      SELECT pt.token FROM push_tokens pt WHERE pt.user_id = sh.owner_id
    ),
    COALESCE(SUM(CASE WHEN cb.bal > 0 THEN cb.bal ELSE 0 END), 0)::DECIMAL(12,2),
    COUNT(*) FILTER (WHERE cb.bal > 0)::INT,
    COUNT(*) FILTER (WHERE cb.bal > 0 AND cb.due_date IS NOT NULL AND cb.due_date < CURRENT_DATE)::INT
  FROM shops sh
  LEFT JOIN LATERAL (
    SELECT
      c.due_date AS due_date,
      (
        COALESCE((SELECT SUM(s.total_revenue - s.paid_amount) FROM sales s WHERE s.customer_id = c.id), 0)
        - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id), 0)
      ) AS bal
    FROM customers c
    WHERE c.shop_id = sh.id
  ) cb ON true
  WHERE sh.summary_time = p_slot
    AND EXISTS (SELECT 1 FROM push_tokens pt WHERE pt.user_id = sh.owner_id)
  GROUP BY sh.id, sh.name, sh.owner_id;
$$;

-- Server-only — anon/auth EMAS (027 dagi bilan bir xil qoida)
REVOKE ALL ON FUNCTION get_push_summaries(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_push_summaries(TEXT) TO service_role;

-- =====================================================
-- 3) notification_log.channel endi 'push' ham qabul qiladi.
--    Ustunda CHECK yo'q (025 da erkin TEXT) — shuning uchun DDL kerak emas,
--    faqat izoh yangilanadi.
-- =====================================================
COMMENT ON COLUMN notification_log.channel IS 'telegram | sms | push';

COMMIT;
