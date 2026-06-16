# ShopScan — Auth sozlash (Supabase)

## "Confirm email" ni o'chirish (BUG-1 yechimi)

ShopScan 2.0 da foydalanuvchi ro'yxatdan o'tgach **darhol** tizimga kiradi
(email tasdiqlashsiz). Buning uchun Supabase'da email tasdiqlashni o'chiring:

1. Supabase Dashboard → loyihangizni tanlang
2. **Authentication** → **Sign In / Providers** → **Email**
3. **Confirm email** (Email tasdiqlash) ni **OFF** qiling
4. Saqlang

Shundan so'ng:
- `signUp` darhol sessiya qaytaradi → foydalanuvchi to'g'ridan-to'g'ri `/dashboard` ga o'tadi.
- Rasmda ko'rsatilgan "Hisob yaratildi, lekin avtomatik kirish bo'lmadi" xatosi yo'qoladi.

## Site URL / Redirect URLs

**Authentication → URL Configuration:**
- **Site URL**: production domen (masalan `https://shopscan.vercel.app`)
- **Redirect URLs**: shu domen (va dev uchun `http://localhost:3000`)

## Eslatma

Kod tomonida (`src/app/(auth)/register/page.tsx`) himoya sifatida fallback bor:
agar "Confirm email" yoqilgan bo'lsa, foydalanuvchiga aniq UZ xabar ko'rsatiladi
va login sahifasiga yo'naltiriladi. Lekin to'liq oqim uchun yuqoridagi sozlama shart.

Kelajakda email tasdiqlash kerak bo'lsa (V2+), "Confirm email" ni qayta yoqib,
tasdiqlash callback sahifasini qo'shish kerak (hozir doiradan tashqarida).
