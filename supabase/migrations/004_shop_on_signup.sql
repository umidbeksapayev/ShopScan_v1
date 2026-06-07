-- ShopScan — Ro'yxatdan o'tishda do'kon avtomatik yaratish
-- Qaror (R1): DB TRIGGER yondashuvi.
-- auth.users ga yangi foydalanuvchi qo'shilganda avtomatik shops yozuvi yaratiladi.
-- Do'kon nomi signUp paytida options.data.shop_name orqali uzatiladi (raw_user_meta_data).
-- Bu atomar — "yetim" user qolmaydi.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.shops (owner_id, name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'shop_name'), ''), 'Mening do''konim')
  );
  RETURN NEW;
END;
$$;

-- Trigger: har bir yangi auth user uchun
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
