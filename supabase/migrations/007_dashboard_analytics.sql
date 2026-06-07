-- ShopScan — Sprint 5: Dashboard + hisobotlar analitikasi
-- Vaqt mintaqasi: Asia/Tashkent (UTC+5). "Bugun" mahalliy sana bo'yicha.

-- =====================================================
-- get_dashboard_stats() — bugungi tushum/foyda/sotuvlar + kam qoldiq
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_revenue DECIMAL(12,2);
  v_profit DECIMAL(12,2);
  v_count INT;
  v_low INT;
BEGIN
  SELECT COALESCE(SUM(total_revenue), 0), COALESCE(SUM(total_profit), 0), COUNT(*)
  INTO v_revenue, v_profit, v_count
  FROM sales
  WHERE shop_id = p_shop_id
    AND (sold_at AT TIME ZONE 'Asia/Tashkent')::date = v_today;

  SELECT COUNT(*) INTO v_low
  FROM products
  WHERE shop_id = p_shop_id AND is_active = true
    AND quantity <= low_stock_alert;

  RETURN jsonb_build_object(
    'today_revenue', v_revenue,
    'today_profit', v_profit,
    'today_sales_count', v_count,
    'low_stock_count', v_low
  );
END;
$$;

-- =====================================================
-- get_sales_trend() — oxirgi N kun kunlik tushum/foyda (bo'sh kunlar 0)
-- =====================================================
CREATE OR REPLACE FUNCTION get_sales_trend(p_shop_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE (
  day DATE,
  revenue DECIMAL(12,2),
  profit DECIMAL(12,2),
  sales_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      (now() AT TIME ZONE 'Asia/Tashkent')::date - (p_days - 1),
      (now() AT TIME ZONE 'Asia/Tashkent')::date,
      INTERVAL '1 day'
    )::date AS day
  )
  SELECT
    d.day,
    COALESCE(SUM(s.total_revenue), 0)::DECIMAL(12,2) AS revenue,
    COALESCE(SUM(s.total_profit), 0)::DECIMAL(12,2) AS profit,
    COUNT(s.id)::INT AS sales_count
  FROM days d
  LEFT JOIN sales s
    ON s.shop_id = p_shop_id
    AND (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date = d.day
  GROUP BY d.day
  ORDER BY d.day;
END;
$$;

-- =====================================================
-- get_top_products() — oxirgi N kun eng ko'p tushum keltirgan mahsulotlar
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_products(
  p_shop_id UUID,
  p_days INT DEFAULT 30,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  product_id UUID,
  name TEXT,
  image_url TEXT,
  sale_type sale_type_enum,
  units_sold DECIMAL(12,3),
  revenue DECIMAL(12,2),
  profit DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.image_url, p.sale_type,
    SUM(s.quantity_sold)::DECIMAL(12,3) AS units_sold,
    SUM(s.total_revenue)::DECIMAL(12,2) AS revenue,
    SUM(s.total_profit)::DECIMAL(12,2) AS profit
  FROM sales s
  JOIN products p ON p.id = s.product_id
  WHERE s.shop_id = p_shop_id
    AND (s.sold_at AT TIME ZONE 'Asia/Tashkent')::date
        > (now() AT TIME ZONE 'Asia/Tashkent')::date - p_days
  GROUP BY p.id, p.name, p.image_url, p.sale_type
  ORDER BY SUM(s.total_revenue) DESC
  LIMIT p_limit;
END;
$$;
