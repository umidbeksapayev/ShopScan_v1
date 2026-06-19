-- ShopScan — Performance P0: Analitika so'rovlarini "sargable" qilish
--
-- MUAMMO: get_dashboard_stats / get_sales_trend / get_top_products (017'da
-- belgilangan) sotuv sanasini `(sold_at AT TIME ZONE 'Asia/Tashkent')::date`
-- bilan filtrlaydi. Ustunga funksiya qo'llangani uchun `(shop_id, sold_at)`
-- indeksi ISHLAMAYDI — har chaqiruvda do'konning BUTUN sotuv tarixi skanlanadi.
-- Do'kon o'sgani sayin dashboard sekinlashadi.
--
-- YECHIM: sanani UTC vaqt oralig'iga aylantirib (`sold_at >= start AND < end`)
-- indeksdan foydalanish. MANTIQ O'ZGARMAYDI — natija aynan bir xil, faqat tez.
-- has_perm() guard va qaytarishlar (returns) ayirish mantig'i saqlanadi.
--
-- Xavfsiz: faqat CREATE OR REPLACE FUNCTION + additiv INDEX. RLS/access tegmaydi.

BEGIN;

-- =====================================================
-- 0) sale_items uchun yetishmayotgan indeks (get_top_products uchun)
--    Hozir faqat idx_sale_items_sale_id bor; shop_id+sold_at bo'yicha yo'q.
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sale_items_shop_sold
  ON sale_items(shop_id, sold_at DESC);

-- =====================================================
-- 1) get_dashboard_stats — "bugun" ni UTC oralig'i bilan
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_shop_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  -- Asia/Tashkent (UTC+5) mahalliy "bugun" ning UTC chegaralari
  v_day_start TIMESTAMPTZ :=
    (((now() AT TIME ZONE 'Asia/Tashkent')::date)::timestamp) AT TIME ZONE 'Asia/Tashkent';
  v_day_end   TIMESTAMPTZ := v_day_start + INTERVAL '1 day';
  v_revenue DECIMAL(12,2); v_profit DECIMAL(12,2); v_count INT; v_low INT;
  v_ret_refund DECIMAL(12,2); v_ret_profit DECIMAL(12,2);
BEGIN
  IF NOT has_perm(p_shop_id, 'view_reports') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  SELECT COALESCE(SUM(total_revenue), 0), COALESCE(SUM(total_profit), 0), COUNT(*)
  INTO v_revenue, v_profit, v_count
  FROM sales WHERE shop_id = p_shop_id
    AND sold_at >= v_day_start AND sold_at < v_day_end;

  SELECT COALESCE(SUM(r.total_refund), 0), COALESCE(SUM(r.total_profit), 0)
  INTO v_ret_refund, v_ret_profit
  FROM returns r JOIN sales s ON s.id = r.sale_id
  WHERE r.shop_id = p_shop_id
    AND s.sold_at >= v_day_start AND s.sold_at < v_day_end;

  SELECT COUNT(*) INTO v_low FROM products
  WHERE shop_id = p_shop_id AND is_active = true AND quantity <= low_stock_alert;

  RETURN jsonb_build_object(
    'today_revenue', v_revenue - v_ret_refund,
    'today_profit', v_profit - v_ret_profit,
    'today_sales_count', v_count,
    'low_stock_count', v_low
  );
END;
$$;

-- =====================================================
-- 2) get_sales_trend — oxirgi N kun (oyna boshini sargable filtr bilan cheklash)
-- =====================================================
CREATE OR REPLACE FUNCTION get_sales_trend(p_shop_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (day DATE, revenue DECIMAL(12,2), profit DECIMAL(12,2), sales_count INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
DECLARE
  -- (bugun - (N-1)) mahalliy kun boshining UTC instanti
  v_window_start TIMESTAMPTZ :=
    ((((now() AT TIME ZONE 'Asia/Tashkent')::date - (p_days - 1))::timestamp)) AT TIME ZONE 'Asia/Tashkent';
BEGIN
  IF NOT has_perm(p_shop_id, 'view_reports') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      (now() AT TIME ZONE 'Asia/Tashkent')::date - (p_days - 1),
      (now() AT TIME ZONE 'Asia/Tashkent')::date, INTERVAL '1 day')::date AS day
  ),
  sold AS (
    SELECT (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
           SUM(s.total_revenue) AS revenue, SUM(s.total_profit) AS profit, COUNT(*) AS cnt
    FROM sales s
    WHERE s.shop_id = p_shop_id AND s.sold_at >= v_window_start
    GROUP BY 1
  ),
  ret AS (
    SELECT (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
           SUM(r.total_refund) AS refund, SUM(r.total_profit) AS profit
    FROM returns r JOIN sales s ON s.id = r.sale_id
    WHERE r.shop_id = p_shop_id AND s.sold_at >= v_window_start
    GROUP BY 1
  )
  SELECT d.day,
    (COALESCE(sold.revenue, 0) - COALESCE(ret.refund, 0))::DECIMAL(12,2),
    (COALESCE(sold.profit, 0) - COALESCE(ret.profit, 0))::DECIMAL(12,2),
    COALESCE(sold.cnt, 0)::INT
  FROM days d
  LEFT JOIN sold ON sold.day = d.day
  LEFT JOIN ret ON ret.day = d.day
  ORDER BY d.day;
END;
$$;

-- =====================================================
-- 3) get_top_products — sana filtrini sargable qilish (sale_items + returns)
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_products(p_shop_id UUID, p_days INT DEFAULT 30, p_limit INT DEFAULT 5)
RETURNS TABLE (
  product_id UUID, name TEXT, image_url TEXT, sale_type sale_type_enum,
  units_sold DECIMAL(12,3), revenue DECIMAL(12,2), profit DECIMAL(12,2)
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
#variable_conflict use_column
DECLARE
  -- `(sold_at)::date > today - p_days`  ==  `sold_at >= (today - (p_days-1)) 00:00`
  v_window_start TIMESTAMPTZ :=
    ((((now() AT TIME ZONE 'Asia/Tashkent')::date - (p_days - 1))::timestamp)) AT TIME ZONE 'Asia/Tashkent';
BEGIN
  IF NOT has_perm(p_shop_id, 'view_reports') THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  RETURN QUERY
  WITH sold AS (
    SELECT si.product_id, SUM(si.quantity_sold) AS qty,
           SUM(si.total_revenue) AS rev, SUM(si.total_profit) AS prof
    FROM sale_items si
    WHERE si.shop_id = p_shop_id AND si.sold_at >= v_window_start
    GROUP BY si.product_id
  ),
  ret AS (
    SELECT ri.product_id, SUM(ri.quantity) AS qty,
           SUM(ri.refund_amount) AS rev, SUM(ri.profit_amount) AS prof
    FROM return_items ri JOIN sales s ON s.id = ri.sale_id
    WHERE ri.shop_id = p_shop_id AND s.sold_at >= v_window_start
    GROUP BY ri.product_id
  )
  SELECT p.id, p.name, p.image_url, p.sale_type,
    (COALESCE(sold.qty, 0) - COALESCE(ret.qty, 0))::DECIMAL(12,3),
    (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0))::DECIMAL(12,2),
    (COALESCE(sold.prof, 0) - COALESCE(ret.prof, 0))::DECIMAL(12,2)
  FROM sold JOIN products p ON p.id = sold.product_id
  LEFT JOIN ret ON ret.product_id = sold.product_id
  ORDER BY (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0)) DESC
  LIMIT p_limit;
END;
$$;

COMMIT;
