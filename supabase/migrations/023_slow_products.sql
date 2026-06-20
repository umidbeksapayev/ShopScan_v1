-- ShopScan — Dashboard: "Kam sotilyapti" (slow movers / sekin sotiluvchilar)
--
-- get_top_products faqat SOTILGAN mahsulotlarni beradi (sale_items INNER JOIN)
-- va tushum bo'yicha DESC tartiblaydi. "Eng kam sotilgan" uchun esa bizga
-- HECH sotilmagan (0) mahsulotlar ham kerak → products dan LEFT JOIN qilamiz
-- va sotilgan miqdor bo'yicha ASC tartiblaymiz.
--
-- get_top_products (021) bilan bir xil uslub: sargable UTC oyna (indeksdan
-- foydalanadi), has_perm('view_reports') guard, qaytarishlarni (returns) ayirish.
-- RETURNS TABLE ustun nomlari o'zgaruvchi sanaladi → #variable_conflict use_column
-- + barcha murojaatlar qualified (42702 ambiguity gotcha'sidan himoya, 013 kabi).
--
-- Xavfsiz: faqat CREATE OR REPLACE FUNCTION. RLS/access/jadval tegmaydi. Orqaga mos.

BEGIN;

CREATE OR REPLACE FUNCTION get_slow_products(p_shop_id UUID, p_days INT DEFAULT 30, p_limit INT DEFAULT 5)
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
  -- Barcha FAOL mahsulotlar (sotilmaganlar ham 0 bilan) → eng kami yuqorida
  SELECT p.id, p.name, p.image_url, p.sale_type,
    (COALESCE(sold.qty, 0) - COALESCE(ret.qty, 0))::DECIMAL(12,3),
    (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0))::DECIMAL(12,2),
    (COALESCE(sold.prof, 0) - COALESCE(ret.prof, 0))::DECIMAL(12,2)
  FROM products p
  LEFT JOIN sold ON sold.product_id = p.id
  LEFT JOIN ret ON ret.product_id = p.id
  WHERE p.shop_id = p_shop_id AND p.is_active = true
  ORDER BY
    (COALESCE(sold.qty, 0) - COALESCE(ret.qty, 0)) ASC,
    (COALESCE(sold.rev, 0) - COALESCE(ret.rev, 0)) ASC,
    p.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMIT;
