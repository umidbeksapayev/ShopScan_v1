-- ShopScan MVP — Boshlang'ich schema
-- Supabase SQL Editor da yoki `supabase db push` bilan bajarish

-- pgvector kengaytmasi (Supabase da allaqachon mavjud)
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================
-- shops jadvali
-- =====================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- products jadvali
-- =====================
CREATE TYPE sale_type_enum AS ENUM ('unit', 'weight');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sale_type sale_type_enum NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL CHECK (cost_price >= 0),
  selling_price DECIMAL(12,2) NOT NULL CHECK (selling_price >= 0),
  profit_per_unit DECIMAL(12,2) GENERATED ALWAYS AS (selling_price - cost_price) STORED,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_alert DECIMAL(12,3) NOT NULL DEFAULT 5,
  barcode TEXT,
  image_url TEXT NOT NULL,
  image_embedding VECTOR(512),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Barcode indeksi (tez qidiruv uchun)
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_is_active ON products(shop_id, is_active);

-- HNSW vektori indeksi (vizual qidiruv uchun)
CREATE INDEX idx_products_embedding ON products
  USING hnsw (image_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =====================
-- sales jadvali
-- =====================
CREATE TYPE search_method_enum AS ENUM ('barcode', 'visual', 'manual');

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sale_type sale_type_enum NOT NULL,
  quantity_sold DECIMAL(12,3) NOT NULL CHECK (quantity_sold > 0),
  cost_price_snapshot DECIMAL(12,2) NOT NULL,
  selling_price_snapshot DECIMAL(12,2) NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL,
  total_profit DECIMAL(12,2) NOT NULL,
  search_method search_method_enum NOT NULL DEFAULT 'manual',
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_shop_id ON sales(shop_id);
CREATE INDEX idx_sales_sold_at ON sales(shop_id, sold_at DESC);
CREATE INDEX idx_sales_product_id ON sales(product_id);

-- =====================
-- Row Level Security (RLS)
-- =====================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Shops: egasi faqat o'z do'konini ko'radi
CREATE POLICY "shops_owner_only" ON shops
  FOR ALL USING (owner_id = auth.uid());

-- Products: shop egasi faqat o'z mahsulotlarini ko'radi
CREATE POLICY "products_shop_owner_only" ON products
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );

-- Sales: shop egasi faqat o'z sotuvlarini ko'radi
CREATE POLICY "sales_shop_owner_only" ON sales
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );
