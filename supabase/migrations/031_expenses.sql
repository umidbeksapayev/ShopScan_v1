-- ShopScan V3 — Sprint 6 (mobile): Xarajat kundaligi (P5)
--
-- Sotuvdan tashqari xarajatlar (ijara, kommunal, ish haqi, transport, boshqa)
-- qayd etiladi; dashboard "sof foyda (xarajatlardan keyin)" ko'rsatadi.
-- Kichik do'kon egasi buni qog'ozda alohida yuritardi — endi ilovada.
--
-- Kategoriya erkin TEXT (client konstantalari: rent/utility/salary/transport/
-- other) — keyin yangi kategoriya qo'shish migratsiya talab qilmasin.
--
-- RLS: FAQAT EGASI (o'qish ham, yozish ham) — xarajatlar sof foyda hisobining
-- qismi, kassirga ko'rinmasligi kerak (cost_price qoidasi bilan bir xil mantiq).
--
-- ⚠️ Supabase SQL Editor da bajaring. Avval 001–030 ishga tushirilgan bo'lsin.

BEGIN;

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'other',
  note TEXT,
  spent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id, spent_at DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_owner_all" ON expenses
  FOR ALL
  USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

COMMIT;
