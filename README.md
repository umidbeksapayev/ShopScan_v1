# ShopScan — Aqlli Do'kon Boshqaruvi

Kichik do'kon egalari uchun responsive web POS tizimi. Barcode skanerlash, AI vizual
qidiruv (CLIP) va DONALI/VAZN sotuv turlarini qo'llab-quvvatlaydi.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Supabase](https://img.shields.io/badge/Supabase-Postgres%2BpgvectorAuth-3FCF8E) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8)

## Asosiy imkoniyatlar

- 🔢 **DONALI (dona)** va ⚖️ **VAZN (kg, 1 g aniqlik)** — ikki sotuv turi
- 📷 **Barcode skanerlash** (kamera, tap-to-scan)
- ✨ **Vizual qidiruv** — rasmga qarab mahsulot topish (CLIP ViT-B/32 + pgvector)
- 🛒 **Savatli sotuv** — atomar `process_sale_cart()` (inventar manfiy bo'lmaydi)
- 📊 **Dashboard + hisobotlar** — kunlik tushum/foyda, trend grafiklar, top mahsulotlar
- 🔒 **Narx maxfiyligi** — `cost_price` (tan narxi) hech qachon frontend'da ko'rsatilmaydi
- 🇺🇿 To'liq o'zbek tilidagi interfeys

## Texnik stack

| Qatlam | Texnologiya |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Ikonlar | Lucide |
| Kamera/Barcode | react-webcam + @zxing/library |
| Vizual AI | Replicate (CLIP ViT-B/32) |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Vektor qidiruv | pgvector + HNSW index |
| State | Zustand + TanStack Query |
| Grafiklar | Recharts |
| Deploy | Vercel |

## Ishga tushirish

### 1. Bog'liqliklarni o'rnatish

```bash
npm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

`.env.local` ni to'ldiring:

| O'zgaruvchi | Qayerdan | Eslatma |
|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → anon public | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role | ⚠️ **server-only**, hech qachon `NEXT_PUBLIC` emas |
| `REPLICATE_API_TOKEN` | https://replicate.com/account/api-tokens | Vizual qidiruv uchun (ixtiyoriy) |

### 3. Ma'lumotlar bazasi (migratsiya)

Supabase Dashboard → **SQL Editor** da `supabase/RUN_ALL_IN_SQL_EDITOR.sql`
faylini to'liq ishga tushiring. Skript **idempotent** — xohlagancha qayta ishga
tushirsa bo'ladi (mavjud obyektlarni buzmaydi). Bu yaratadi:

- `shops`, `products` (pgvector HNSW), `sales` jadvallari
- RLS siyosatlari (har foydalanuvchi faqat o'z `shop_id` ma'lumotlarini ko'radi)
- `process_sale()` / `process_sale_cart()` — atomar sotuv (SECURITY DEFINER)
- `match_products()` — vizual qidiruv (kosinus + HNSW)
- `get_dashboard_stats()` / `get_sales_trend()` / `get_top_products()` — analitika
- Ro'yxatdan o'tishda do'kon avto-yaratish trigger'i
- Storage bucket (`product-images`) + RLS

### 4. Supabase sozlamalari

- **Authentication → Providers → Email**: ishlab chiqishda "Confirm email" ni
  o'chirib qo'yish mumkin (tezroq test uchun)

### 5. Dev server

```bash
npm run dev          # http://localhost:3000
```

> 📷 **Eslatma:** mobil qurilmada kamera (barcode/vizual) faqat **HTTPS** da ishlaydi.
> Lokal HTTPS uchun: `next dev --experimental-https`, yoki Vercel'ga deploy qiling.

## Skriptlar

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # production serverni ishga tushirish (build'dan keyin)
npm run lint     # ESLint
```

## Vercel'ga deploy

1. Repozitoriyani Vercel'ga import qiling
2. **Environment Variables** bo'limiga `.env.local` dagi 4 ta o'zgaruvchini qo'shing
   (`SUPABASE_SERVICE_ROLE_KEY` ni **server-only** sifatida — `NEXT_PUBLIC` emas)
3. Deploy — Next.js avtomatik aniqlanadi

## Loyiha tuzilmasi

```
src/
├── app/
│   ├── (auth)/            # login, register
│   ├── (dashboard)/       # himoyalangan sahifalar (dashboard, catalog, sell, history, reports, settings)
│   └── api/               # embed, embed/backfill, visual-search route handler'lari
├── components/
│   ├── ui/                # shadcn/ui komponentlar
│   ├── layout/            # SidebarNav, BottomNav, Topbar
│   ├── products/          # katalog komponentlari
│   ├── sales/             # sotuv komponentlari
│   └── dashboard/         # statistika, grafik, ro'yxatlar
├── lib/                   # supabase, products, sales, dashboard, replicate, storage
├── hooks/                 # TanStack Query hook'lari
├── stores/                # Zustand store'lar (cart, catalog)
└── types/database.ts
supabase/
├── migrations/            # 001..007 alohida SQL fayllar
└── RUN_ALL_IN_SQL_EDITOR.sql   # birlashtirilgan idempotent migratsiya
```

## Xavfsizlik tamoyillari

- `cost_price` — faqat egasiga (RLS), UI'da hech qachon render qilinmaydi
- `SUPABASE_SERVICE_ROLE_KEY` va `REPLICATE_API_TOKEN` — faqat server-side
- Pul: `DECIMAL(12,2)`, vazn: `DECIMAL(12,3)` — yaxlitlash xatosi yo'q
- Inventar manfiy bo'la olmaydi (DB constraint + atomar funksiyalar)

## Litsenziya

Shaxsiy loyiha.
