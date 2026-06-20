-- 026: Avtomatik nasiya eslatma tanlovi (S10b) — cron uchun
--
-- Har kuni Vercel Cron /api/cron/debt-reminders ni chaqiradi → bu funksiya
-- eslatma yuborilishi kerak bo'lgan qarzdorlarni qaytaradi:
--   • Telegram bog'langan (telegram_chat_id IS NOT NULL)
--   • reminders_enabled = true
--   • muddati kelgan yoki o'tgan (due_date <= CURRENT_DATE)
--   • balans > 0
--   • oxirgi p_throttle_days kunda (default 5) eslatma YUBORILMAGAN (kunlik spam bo'lmasin)
--
-- FAQAT service_role chaqiradi (cron route). Anon/auth EMAS.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–025. Orqaga mos (faqat yangi funksiya).

BEGIN;

CREATE OR REPLACE FUNCTION get_due_reminders(p_throttle_days INT DEFAULT 5)
RETURNS TABLE (
  customer_id UUID, shop_id UUID, shop_name TEXT,
  telegram_chat_id BIGINT, balance DECIMAL(12,2), due_date DATE
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT q.cid, q.sid, q.sname, q.chat, q.bal, q.dd
  FROM (
    SELECT
      c.id AS cid, c.shop_id AS sid, sh.name AS sname,
      c.telegram_chat_id AS chat, c.due_date AS dd,
      (
        COALESCE((SELECT SUM(s.total_revenue - s.paid_amount) FROM sales s WHERE s.customer_id = c.id), 0)
        - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id), 0)
      ) AS bal
    FROM customers c
    JOIN shops sh ON sh.id = c.shop_id
    WHERE c.telegram_chat_id IS NOT NULL
      AND c.reminders_enabled = true
      AND c.due_date IS NOT NULL
      AND c.due_date <= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM notification_log nl
        WHERE nl.customer_id = c.id
          AND nl.channel = 'telegram'
          AND nl.kind = 'reminder'
          AND nl.status = 'sent'
          AND nl.sent_at >= now() - make_interval(days => p_throttle_days)
      )
  ) q
  WHERE q.bal > 0
  ORDER BY q.dd ASC;
$$;

REVOKE ALL ON FUNCTION get_due_reminders(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_due_reminders(INT) TO service_role;

COMMIT;
