-- 025: Nasiya eslatma (S10a) — Telegram bog'lanish + muddat + bildirishnoma jurnali
--
-- Mavjud nasiya (013) ustiga: qarz to'lash MUDDATI (due_date), mijozni markaziy
-- uscan Telegram botiga bog'lash (telegram_chat_id) va yuborilgan eslatmalar jurnali.
-- Avtomatik yuborish (cron) S10b'da; bu yerda poydevor + qo'lda yuborish.
--
-- Arxitektura: BITTA markaziy uscan boti (har do'kon uchun alohida emas). Mijoz
-- telefon raqamini ulashadi → shu raqamli mijoz(lar) chat_id'ga bog'lanadi →
-- bot qarzni ko'rsatadi va eslatma yuboradi. SERVER (service_role) bot tomonida
-- ishlaydi; link_telegram/get_chat_debts faqat service_role uchun ochiq.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–024 ishga tushirilgan bo'lsin. Orqaga mos.

BEGIN;

-- =====================================================
-- 1) customers — eslatma maydonlari
-- =====================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS due_date          DATE,
  ADD COLUMN IF NOT EXISTS telegram_chat_id  BIGINT,
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT true;

-- Telefon bo'yicha qidiruv (webhook: telefon → mijoz) va chat bo'yicha (bot javobi)
CREATE INDEX IF NOT EXISTS idx_customers_phone
  ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_tg
  ON customers(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- =====================================================
-- 2) notification_log — yuborilgan bildirishnomalar (ikki marta yubormaslik + audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL,   -- 'telegram' | 'sms'
  kind        TEXT NOT NULL,   -- 'reminder' | 'manual'
  status      TEXT NOT NULL,   -- 'sent' | 'failed'
  error       TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notiflog_shop ON notification_log(shop_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notiflog_customer ON notification_log(customer_id, sent_at DESC);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
-- O'qish/yozish: manage_debt ruxsati (ega = doim). Server cron service_role bilan
-- RLS'ni chetlab o'tadi (alohida policy shart emas).
CREATE POLICY "notiflog_member_select" ON notification_log
  FOR SELECT USING (has_perm(shop_id, 'manage_debt'));
CREATE POLICY "notiflog_member_insert" ON notification_log
  FOR INSERT WITH CHECK (has_perm(shop_id, 'manage_debt'));

-- =====================================================
-- 3) link_telegram — telefon bo'yicha mijoz(lar)ni chat_id'ga bog'lash
--    Telefon mosligi: faqat raqamlar, oxirgi 9 ta (milliy raqam) bo'yicha —
--    "+998 90 123 45 67", "998901234567", "90 1234567" hammasi mos keladi.
--    FAQAT service_role chaqiradi (server webhook).
-- =====================================================
CREATE OR REPLACE FUNCTION link_telegram(p_phone TEXT, p_chat_id BIGINT)
RETURNS TABLE (out_customer_id UUID, out_shop_id UUID, out_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_digits TEXT;
BEGIN
  v_digits := right(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), 9);
  IF length(v_digits) < 9 THEN
    RETURN;  -- yaroqsiz raqam → bog'lash yo'q
  END IF;
  RETURN QUERY
  UPDATE customers c
     SET telegram_chat_id = p_chat_id
   WHERE c.phone IS NOT NULL
     AND right(regexp_replace(c.phone, '\D', '', 'g'), 9) = v_digits
  RETURNING c.id, c.shop_id, c.name;
END;
$$;

-- =====================================================
-- 4) get_chat_debts — chat_id'ga bog'langan mijozlarning do'kon kesimida qarzi
--    (faqat balans > 0). Bot "qarzim" buyrug'i + eslatma matni uchun.
--    FAQAT service_role chaqiradi.
-- =====================================================
CREATE OR REPLACE FUNCTION get_chat_debts(p_chat_id BIGINT)
RETURNS TABLE (shop_id UUID, shop_name TEXT, balance DECIMAL(12,2), due_date DATE)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT q.sid, q.sname, SUM(q.bal)::DECIMAL(12,2), MIN(q.dd)
  FROM (
    SELECT
      c.shop_id AS sid,
      sh.name   AS sname,
      c.due_date AS dd,
      (
        COALESCE((SELECT SUM(s.total_revenue - s.paid_amount) FROM sales s WHERE s.customer_id = c.id), 0)
        - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id), 0)
      ) AS bal
    FROM customers c
    JOIN shops sh ON sh.id = c.shop_id
    WHERE c.telegram_chat_id = p_chat_id
  ) q
  GROUP BY q.sid, q.sname
  HAVING SUM(q.bal) > 0
  ORDER BY SUM(q.bal) DESC;
$$;

-- Bog'lash/qarz funksiyalari faqat server (service_role) uchun — anon/auth EMAS
REVOKE ALL ON FUNCTION link_telegram(TEXT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_chat_debts(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION link_telegram(TEXT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION get_chat_debts(BIGINT) TO service_role;

-- =====================================================
-- 5) get_customers_with_balance — due_date + telegram_linked + reminders_enabled qo'shildi
--    (return type o'zgargani uchun avval DROP)
-- =====================================================
DROP FUNCTION IF EXISTS get_customers_with_balance(UUID);

CREATE OR REPLACE FUNCTION get_customers_with_balance(p_shop_id UUID)
RETURNS TABLE (
  id UUID, name TEXT, phone TEXT, note TEXT, created_at TIMESTAMPTZ,
  balance DECIMAL(12,2), due_date DATE, telegram_linked BOOLEAN, reminders_enabled BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
BEGIN
  IF NOT has_perm(p_shop_id, 'manage_debt') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  RETURN QUERY
  SELECT q.id, q.name, q.phone, q.note, q.created_at, q.balance,
         q.due_date, q.telegram_linked, q.reminders_enabled
  FROM (
    SELECT
      c.id, c.name, c.phone, c.note, c.created_at,
      (
        COALESCE((SELECT SUM(s.total_revenue - s.paid_amount) FROM sales s WHERE s.customer_id = c.id), 0)
        - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id), 0)
      )::DECIMAL(12,2) AS balance,
      c.due_date,
      (c.telegram_chat_id IS NOT NULL) AS telegram_linked,
      c.reminders_enabled
    FROM customers c
    WHERE c.shop_id = p_shop_id
  ) q
  ORDER BY q.balance DESC, q.created_at DESC;
END;
$$;

-- =====================================================
-- 6) get_reminder_target — qo'lda eslatma yuborish uchun (server route chaqiradi).
--    manage_debt ruxsatini SQL tomonda tekshiradi (API'ni spooflab bo'lmaydi).
--    chat_id + balans + muddatni bitta ishonchli chaqiruvda qaytaradi.
-- =====================================================
CREATE OR REPLACE FUNCTION get_reminder_target(p_customer_id UUID)
RETURNS TABLE (
  shop_id UUID, shop_name TEXT, telegram_chat_id BIGINT,
  balance DECIMAL(12,2), due_date DATE, reminders_enabled BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop UUID;
BEGIN
  SELECT c.shop_id INTO v_shop FROM customers c WHERE c.id = p_customer_id;
  IF v_shop IS NULL THEN
    RAISE EXCEPTION 'Mijoz topilmadi';
  END IF;
  IF NOT has_perm(v_shop, 'manage_debt') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  RETURN QUERY
  SELECT
    c.shop_id, sh.name, c.telegram_chat_id,
    (
      COALESCE((SELECT SUM(s.total_revenue - s.paid_amount) FROM sales s WHERE s.customer_id = c.id), 0)
      - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id), 0)
    )::DECIMAL(12,2),
    c.due_date, c.reminders_enabled
  FROM customers c
  JOIN shops sh ON sh.id = c.shop_id
  WHERE c.id = p_customer_id;
END;
$$;

COMMIT;
