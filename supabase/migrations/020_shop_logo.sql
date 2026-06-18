-- 020: Do'kon logosi (shop logo)
-- shops jadvaliga logo_url ustuni qo'shadi. Logo mavjud "product-images"
-- public bucket'ida {shopId}/... yo'lида saqlanadi (Storage RLS papka
-- konvensiyasidan foydalanadi). Orqaga mos: ustun nullable, eski yozuvlar buzilmaydi.
-- shops UPDATE uchun ega ruxsati allaqachon RLS'da mavjud (do'kon nomi yangilanishi kabi).

alter table public.shops
  add column if not exists logo_url text;
