-- ShopScan V2 — Barcode UNIQUE indeks + multi-image embeddinglar

-- =====================================================
-- 1) Barcode: do'kon ichida UNIQUE (tez va aniq qidiruv)
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_shop_barcode
  ON products(shop_id, barcode) WHERE barcode IS NOT NULL;

-- =====================================================
-- 2) product_embeddings — bitta mahsulotga bir nechta rasm embeddingi
-- =====================================================
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  image_url TEXT,
  embedding VECTOR(512) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pe_product ON product_embeddings(product_id);
CREATE INDEX IF NOT EXISTS idx_pe_shop ON product_embeddings(shop_id);
CREATE INDEX IF NOT EXISTS idx_pe_embedding ON product_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pe_shop_owner_only" ON product_embeddings;
CREATE POLICY "pe_shop_owner_only" ON product_embeddings
  FOR ALL USING (shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid()));

-- =====================================================
-- 3) match_products — endi product_embeddings ustidan (har mahsulotning ENG yaqin rasmi)
-- =====================================================
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
  -- Egalik tekshiruvi (client'dan chaqiriladi)
  IF NOT EXISTS (
    SELECT 1 FROM shops WHERE shops.id = p_shop_id AND shops.owner_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH best AS (
    SELECT pe.product_id, MAX(1 - (pe.embedding <=> p_embedding))::FLOAT AS sim
    FROM product_embeddings pe
    WHERE pe.shop_id = p_shop_id
    GROUP BY pe.product_id
  )
  SELECT
    p.id, p.shop_id, p.name, p.sale_type, p.cost_price, p.selling_price,
    p.profit_per_unit, p.quantity, p.low_stock_alert, p.barcode, p.image_url,
    p.image_embedding, p.is_active, p.created_at,
    b.sim AS similarity
  FROM best b
  JOIN products p ON p.id = b.product_id
  WHERE p.is_active = true
    AND p.quantity > 0
    AND b.sim >= p_threshold
  ORDER BY b.sim DESC
  LIMIT p_match_count;
END;
$$;
