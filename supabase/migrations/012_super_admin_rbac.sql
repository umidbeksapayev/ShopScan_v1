-- ShopScan V2 — Sprint 5 (F-6): Super-admin RBAC + admin analitika
-- profiles (rol) jadvali, super_admin tayinlash, admin RPC'lari.
-- Supabase SQL Editor da bajaring (avvalgi migratsiyalardan keyin).

-- =====================================================
-- 1) profiles (rol) jadvali
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2) is_super_admin() — RLS recursiyasidan qochish uchun SECURITY DEFINER
-- =====================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- =====================================================
-- 3) RLS: o'z profilini o'qiydi; super_admin hammasini; yozish faqat super_admin
-- =====================================================
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "profiles_admin_write" ON profiles;
CREATE POLICY "profiles_admin_write" ON profiles
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- =====================================================
-- 4) Signup'da profil yaratish (trigger) + mavjud foydalanuvchilarni backfill
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'owner')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO public.profiles (id, role)
SELECT id, 'owner' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5) Super-admin tayinlash (joriy egasi)
--    Agar bu email hali ro'yxatdan o'tmagan bo'lsa — avval ro'yxatdan o'ting,
--    so'ng shu UPDATE ni qayta ishga tushiring.
-- =====================================================
UPDATE public.profiles SET role = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'umidsapayev0571@gmail.com');

-- =====================================================
-- 6) admin_overview() — umumiy ko'rsatkichlar (super_admin gated)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v JSONB;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  SELECT jsonb_build_object(
    'users_count', (SELECT COUNT(*) FROM auth.users),
    'shops_count', (SELECT COUNT(*) FROM shops),
    'products_count', (SELECT COUNT(*) FROM products WHERE is_active = true),
    'sales_count', (SELECT COUNT(*) FROM sales),
    'total_revenue', (SELECT COALESCE(SUM(total_revenue), 0) FROM sales)
  ) INTO v;
  RETURN v;
END;
$$;

-- =====================================================
-- 7) admin_shops() — do'konlar + egasi (email) + statistika (super_admin gated)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_shops()
RETURNS TABLE (
  shop_id UUID,
  name TEXT,
  owner_email TEXT,
  created_at TIMESTAMPTZ,
  product_count BIGINT,
  sales_count BIGINT,
  revenue DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    u.email::TEXT,
    s.created_at,
    (SELECT COUNT(*) FROM products p WHERE p.shop_id = s.id AND p.is_active = true),
    (SELECT COUNT(*) FROM sales sa WHERE sa.shop_id = s.id),
    (SELECT COALESCE(SUM(sa.total_revenue), 0) FROM sales sa WHERE sa.shop_id = s.id)::DECIMAL(12,2)
  FROM shops s
  JOIN auth.users u ON u.id = s.owner_id
  ORDER BY s.created_at DESC;
END;
$$;
