-- ShopScan V3 — Sprint 13 (mobile): Kassir hisoboti
--
-- Do'kon egasi har bir kassirning davr ichidagi natijasini ko'radi: sotuv
-- soni, tushum, o'rtacha chek, to'lov usullari taqsimoti, qaytarishlar va
-- foyda. Kassir esa FAQAT o'z natijasini ko'radi (foyda va qaytarishsiz).
--
-- NEGA SERVER TOMONIDA:
-- Mobil ilovada bu hisob client'da qilinardi (`cashier-api.ts`) va 2000
-- qator bilan cheklangan edi. Kuniga 60 ta sotuv qiladigan do'kon oyiga
-- ~1800 ta qiladi — ya'ni real do'kon chegaraga YETADI va hisobot jimgina
-- noto'g'ri raqam ko'rsatardi. Hisobotning butun ma'nosi to'g'ri raqamda,
-- shuning uchun agregatsiya serverga ko'chirildi (030/032 naqshi).
--
-- QAYTARISHLARNI BIRIKTIRISH:
-- `returns` jadvalida kassir ustuni YO'Q (014), faqat `sale_id`. Shuning
-- uchun qaytarish SOTUVNI QILGAN kassirga biriktiriladi — hisobot uchun
-- aynan shu ma'noli ("bu kassir sotgan tovarning qanchasi qaytdi"),
-- qaytarishni kim rasmiylashtirgani emas.
--
-- XAVFSIZLIK:
-- `returns` RLS'i (014) ATAYLAB faqat egaga ochiq. Bu funksiya
-- SECURITY DEFINER bo'lgani uchun RLS'ni chetlab o'tadi — shuning uchun
-- kassirga qaytarish va foyda ustunlari NULL qaytariladi. Mavjud xavfsizlik
-- chegarasi kengaytirilmaydi.
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–032 ishga tushirilgan bo'lsin.

BEGIN;

-- Davr filtri sotuvlar bo'yicha — mavjud indeks yetarli bo'lmasa qo'shamiz.
CREATE INDEX IF NOT EXISTS idx_sales_shop_cashier_sold
  ON sales(shop_id, cashier_id, sold_at DESC);

-- =====================================================
-- get_cashier_report — kassir kesimida davr natijasi
-- =====================================================
CREATE OR REPLACE FUNCTION get_cashier_report(
  p_shop_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  cashier_id UUID,
  email TEXT,
  role TEXT,
  sales_count INT,
  revenue DECIMAL(14,2),
  avg_check DECIMAL(14,2),
  cash_total DECIMAL(14,2),
  card_total DECIMAL(14,2),
  qr_total DECIMAL(14,2),
  debt_total DECIMAL(14,2),
  returns_count INT,
  refund_total DECIMAL(14,2),
  profit DECIMAL(14,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from TIMESTAMPTZ;
  v_is_owner BOOLEAN;
  v_me UUID := auth.uid();
BEGIN
  IF NOT is_shop_member(p_shop_id) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  IF p_days IS NULL OR p_days < 1 OR p_days > 366 THEN
    RAISE EXCEPTION 'Noto''g''ri davr: %', p_days;
  END IF;

  v_is_owner := is_shop_owner(p_shop_id);

  -- Davr boshi: (bugun − (p_days − 1)) Toshkent yarim tuni.
  -- Mobil `periodStartIso()` bilan AYNAN bir xil — aks holda statistika va
  -- hisobot turli raqam ko'rsatardi.
  v_from := ((((now() AT TIME ZONE 'Asia/Tashkent')::date - (p_days - 1))::timestamp)
             AT TIME ZONE 'Asia/Tashkent');

  RETURN QUERY
  WITH s AS (
    SELECT
      sl.cashier_id AS cid,
      COUNT(*)::INT AS cnt,
      COALESCE(SUM(sl.total_revenue), 0)::DECIMAL(14,2) AS rev,
      COALESCE(SUM(sl.total_profit), 0)::DECIMAL(14,2) AS prof,
      -- NULL = 030 dan oldingi qatorlar = naqd (get_expected_cash bilan bir xil konvensiya)
      COALESCE(SUM(sl.paid_amount) FILTER (
        WHERE COALESCE(sl.payment_method, 'cash') = 'cash'), 0)::DECIMAL(14,2) AS cash_t,
      COALESCE(SUM(sl.paid_amount) FILTER (
        WHERE sl.payment_method = 'card'), 0)::DECIMAL(14,2) AS card_t,
      COALESCE(SUM(sl.paid_amount) FILTER (
        WHERE sl.payment_method = 'qr'), 0)::DECIMAL(14,2) AS qr_t,
      COALESCE(SUM(sl.total_revenue - sl.paid_amount) FILTER (
        WHERE sl.total_revenue > sl.paid_amount), 0)::DECIMAL(14,2) AS debt_t
    FROM sales sl
    WHERE sl.shop_id = p_shop_id
      AND sl.sold_at >= v_from
      -- Kassir faqat o'zinikini ko'radi
      AND (v_is_owner OR sl.cashier_id = v_me)
    GROUP BY sl.cashier_id
  ),
  r AS (
    SELECT
      sl.cashier_id AS cid,
      COUNT(*)::INT AS cnt,
      COALESCE(SUM(rt.total_refund), 0)::DECIMAL(14,2) AS refund_t
    FROM returns rt
    JOIN sales sl ON sl.id = rt.sale_id
    WHERE rt.shop_id = p_shop_id
      AND rt.created_at >= v_from
    GROUP BY sl.cashier_id
  )
  SELECT
    s.cid,
    -- Email: egaga hammasi, kassirga faqat o'ziniki
    CASE WHEN v_is_owner OR s.cid = v_me THEN u.email::TEXT ELSE NULL END,
    m.role::TEXT,
    s.cnt,
    s.rev,
    -- O'rtacha chek (nolga bo'lishdan himoya)
    CASE WHEN s.cnt > 0 THEN ROUND(s.rev / s.cnt, 2) ELSE 0 END::DECIMAL(14,2),
    s.cash_t,
    s.card_t,
    s.qr_t,
    s.debt_t,
    -- Qaytarish va foyda — faqat egaga (yuqoridagi XAVFSIZLIK izohiga qarang)
    CASE WHEN v_is_owner THEN COALESCE(r.cnt, 0) ELSE NULL END,
    CASE WHEN v_is_owner THEN COALESCE(r.refund_t, 0) ELSE NULL END,
    CASE WHEN v_is_owner THEN s.prof ELSE NULL END
  FROM s
  LEFT JOIN r ON r.cid IS NOT DISTINCT FROM s.cid
  LEFT JOIN shop_members m ON m.user_id = s.cid AND m.shop_id = p_shop_id
  LEFT JOIN auth.users u ON u.id = s.cid
  ORDER BY s.rev DESC;
END;
$$;

COMMIT;
