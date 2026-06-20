-- 027: Egaga kunlik xulosa (S10b) — egani Telegram'ga ulash + xulosa tanlovi
--
-- Ega @uscanUZ_bot'ga deep-link (t.me/uscanUZ_bot?start=<token>) orqali ulanadi.
-- Ega xulosa vaqtini tanlaydi: 'morning' (07:00) | 'evening' (00:00) | 'off'.
-- Cron har slot uchun get_owner_summaries bilan egalarni topib, qarz xulosasini yuboradi.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–026. Orqaga mos.

BEGIN;

-- =====================================================
-- 1) shops — egasining Telegram'i + xulosa vaqti
-- =====================================================
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS owner_telegram_chat_id BIGINT,
  ADD COLUMN IF NOT EXISTS summary_time TEXT NOT NULL DEFAULT 'off'
    CHECK (summary_time IN ('morning', 'evening', 'off'));

-- =====================================================
-- 2) telegram_link_tokens — egani ulash uchun bir martalik token
--    RLS yoqilgan, policy YO'Q → faqat service_role / DEFINER funksiyalar kiradi
--    (token shops'ga yozilmaydi — membership select(*) orqali kassirga oshkor bo'lmasin).
-- =====================================================
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE telegram_link_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3) create_owner_link_token — ega ulash tokenini oladi (auth, owner-gated)
--    Har chaqiruvda eski token o'chiriladi (bitta amaldagi token).
-- =====================================================
CREATE OR REPLACE FUNCTION create_owner_link_token(p_shop_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM shops WHERE id = p_shop_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  DELETE FROM telegram_link_tokens WHERE shop_id = p_shop_id;
  INSERT INTO telegram_link_tokens (shop_id) VALUES (p_shop_id) RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

-- =====================================================
-- 4) link_owner_telegram — bot deep-link: token → ega chat_id (faqat service_role)
-- =====================================================
CREATE OR REPLACE FUNCTION link_owner_telegram(p_token UUID, p_chat_id BIGINT)
RETURNS TABLE (out_shop_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop UUID;
  v_name TEXT;
BEGIN
  SELECT t.shop_id INTO v_shop FROM telegram_link_tokens t WHERE t.token = p_token;
  IF v_shop IS NULL THEN
    RETURN;  -- yaroqsiz/eskirgan token
  END IF;
  UPDATE shops SET owner_telegram_chat_id = p_chat_id WHERE id = v_shop;
  DELETE FROM telegram_link_tokens WHERE shop_id = v_shop;
  SELECT name INTO v_name FROM shops WHERE id = v_shop;
  RETURN QUERY SELECT v_name;
END;
$$;

-- =====================================================
-- 5) get_owner_summaries — slot bo'yicha ulagan egalar + qarz xulosasi (service_role)
-- =====================================================
CREATE OR REPLACE FUNCTION get_owner_summaries(p_slot TEXT)
RETURNS TABLE (
  shop_id UUID, owner_chat_id BIGINT, shop_name TEXT,
  total_debt DECIMAL(12,2), debtor_count INT, overdue_count INT, reminders_today INT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    sh.id,
    sh.owner_telegram_chat_id,
    sh.name,
    COALESCE(SUM(CASE WHEN cb.bal > 0 THEN cb.bal ELSE 0 END), 0)::DECIMAL(12,2),
    COUNT(*) FILTER (WHERE cb.bal > 0)::INT,
    COUNT(*) FILTER (WHERE cb.bal > 0 AND cb.due_date IS NOT NULL AND cb.due_date < CURRENT_DATE)::INT,
    COALESCE((
      SELECT COUNT(*) FROM notification_log nl
      WHERE nl.shop_id = sh.id AND nl.kind = 'reminder'
        AND nl.status = 'sent' AND nl.sent_at::date = CURRENT_DATE
    ), 0)::INT
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
    AND sh.owner_telegram_chat_id IS NOT NULL
  GROUP BY sh.id, sh.owner_telegram_chat_id, sh.name;
$$;

-- Server-only funksiyalar — anon/auth EMAS
REVOKE ALL ON FUNCTION link_owner_telegram(UUID, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_owner_summaries(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION link_owner_telegram(UUID, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION get_owner_summaries(TEXT) TO service_role;

COMMIT;
