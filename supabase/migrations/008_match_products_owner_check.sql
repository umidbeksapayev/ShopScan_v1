-- ShopScan — match_products() egalik tekshiruvi bilan (xavfsizlik)
-- Endi vizual qidiruv brauzerda (client) bajariladi va match_products to'g'ridan-to'g'ri
-- chaqiriladi. SECURITY DEFINER bo'lgani uchun client p_shop_id'ni "spoof" qila olmasligi
-- kerak — shuning uchun auth.uid() egaligini majburiy tekshiramiz.

CREATE OR REPLACE FUNCTION match_products(
  p_shop_id UUID,
  p_embedding VECTOR(512),
  p_match_count INT DEFAULT 3,
  p_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id UUID,
  shop_id UUID,
  name TEXT,
  sale_type sale_type_enum,
  cost_price DECIMAL(12,2),
  selling_price DECIMAL(12,2),
  profit_per_unit DECIMAL(12,2),
  quantity DECIMAL(12,3),
  low_stock_alert DECIMAL(12,3),
  barcode TEXT,
  image_url TEXT,
  image_embedding VECTOR(512),
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Egalik tekshiruvi: faqat o'z do'koni (client p_shop_id'ni almashtirsa ham bo'sh qaytadi)
  IF NOT EXISTS (
    SELECT 1 FROM shops WHERE shops.id = p_shop_id AND shops.owner_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.shop_id, p.name, p.sale_type, p.cost_price, p.selling_price,
    p.profit_per_unit, p.quantity, p.low_stock_alert, p.barcode, p.image_url,
    p.image_embedding, p.is_active, p.created_at,
    (1 - (p.image_embedding <=> p_embedding))::FLOAT AS similarity
  FROM products p
  WHERE p.shop_id = p_shop_id
    AND p.is_active = true
    AND p.quantity > 0
    AND p.image_embedding IS NOT NULL
    AND (1 - (p.image_embedding <=> p_embedding)) >= p_threshold
  ORDER BY p.image_embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$;
