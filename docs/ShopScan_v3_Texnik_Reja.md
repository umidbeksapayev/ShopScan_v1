# uscan 3.0 — Texnik Reja va Sprint Bo'linmasi

**Hujjat turi:** PRD + Sprint Plan (v3)
**Versiya:** 3.0 (tayyorgarlik)
**Sana:** 2026-06-16
**Asos:** uscan 2.0 — barcha 6 sprint yakunlandi (PR #15–#22, main'da). Bu hujjat v3 ni **yangi chatda** davom ettirish uchun yagona manba.

---

## 0. Joriy holat (v2 yakuni — yangi chat uchun kontekst)

**Stack:** Next.js 14.2.35 (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase (Auth + Postgres + Storage) · TanStack Query · Zustand · i18next (`uz-Latn` default, `uz-Cyrl`, `ru`) · exceljs (lazy) · @zxing/library (barcode) · recharts.

**DB jadvallari (migration 001–012 qo'llangan):**
- `shops` (id, owner_id, name)
- `products` (id, shop_id, name, sale_type[unit|weight], cost_price, selling_price, profit_per_unit, quantity, low_stock_alert, barcode, image_url **nullable**, is_active)
- `sales` (sarlavha: id, shop_id, total_revenue, total_profit, item_count, search_method, sold_at)
- `sale_items` (id, sale_id→sales, shop_id, product_id, sale_type, quantity_sold, cost_price_snapshot, selling_price_snapshot, total_revenue, total_profit, search_method, sold_at)
- `profiles` (id→auth.users, role[owner|super_admin])

**Muhim RPC'lar (SECURITY DEFINER):** `process_sale_cart(p_shop_id, p_items, p_search_method)` (sarlavha+qatorlar atomar), `get_dashboard_stats`, `get_sales_trend`, `get_top_products`, `is_super_admin()`, `admin_overview()`, `admin_shops()`.

**Auth:** email+parol. Supabase'da "Confirm email" = OFF. Google OAuth va email tasdiqlash hali YO'Q (v2'da kechiktirilgan).

**RBAC:** `profiles.role` (owner/super_admin). `/admin` paneli middleware bilan himoyalangan. Nav'da Admin havolasi faqat super_admin'ga.

**Dizayn:** `design-system/MASTER.md` (yagona manba). Tokenlar `src/app/globals.css` + `tailwind.config.ts`. Brend gradient: `bg-brand-gradient`, `text-brand-gradient`. Lucide ikonalar.

**Ish jarayoni:** har sprint = alohida branch → PR → `main`'ga merge. Migratsiyalar Supabase SQL Editor'da QO'LDA ishga tushiriladi (keyingi nomer: **013+**). Tekshiruv: `npm run build`.

**Ma'lum texnik qarz (Sprint 0'da hal qilinadi):**
- ESLint sozlanmagan → `next build` lint'ni o'tkazib yuboradi (faqat TS type-check ishlaydi).
- Testlar yo'q (unit/E2E).
- `npm audit`: bir nechta advisory faqat `next@16` (major) bilan yopiladi.
- O'lik i18n kalitlar (`visual.*`, `sell.tabVisual`, `settings.visualIndex*`, `comingSoon*`) va 1 eski komment (`product-form.tsx:28`).

---

## 1. v3 Maqsad va doira

**Maqsad:** uscan'ni mahalliy (O'zbek) do'kon real ehtiyojlariga yaqinlashtirish (nasiya, qaytarish, kirim, ko'p kassir), monetizatsiya (obuna) qo'shish va sifatni (testlar, lint, offline) mustahkamlash.

**Doirada:** F3-1 … F3-10 (quyida) + Sprint 0 sifat poydevori.

**Doiradan tashqari:** ko'p-do'kon/filial tarmog'i (chain), markaziy ombor, kuryer/yetkazib berish, e-commerce vitrinasi — bular v4+ uchun.

---

## 2. Funksional talablar

| ID | Funksiya | Prioritet | Qisqacha |
|----|----------|-----------|----------|
| F3-1 | **Nasiya / Qarz daftari** | P0 | Mijozlar + qarz hisobi + to'lovlar |
| F3-2 | **Sotuvni qaytarish (return/refund)** | P0 | Sotuvni qaytarish, inventar tiklash |
| F3-3 | Kirim / Ta'minotchi | P1 | Mahsulot kirimi, tan narx tarixi |
| F3-4 | Chegirma (discount) | P1 | Sotuvda foiz/summa chegirma |
| F3-5 | Ko'p kassir + rollar | P1 | Do'konga xodim, per-shop RBAC |
| F3-6 | Offline / PWA | P1 | Internetsiz katalog + sotuv navbati |
| F3-7 | Obuna / to'lov (billing) | P2 | Payme/Click, premium gating |
| F3-8 | Hisobotlarni kengaytirish | P2 | Sana oralig'i, PDF/Excel, taqqoslash |
| F3-9 | Bildirishnomalar | P2 | Kam qoldiq / kunlik hisobot |
| F3-10 | Barcode yorliq generatsiya | P2 | Barcode'siz mahsulotlarga yorliq |

---

## 3. Funksiyalar batafsil

### F3-1 — Nasiya / Qarz daftari (P0) 🔥
Mahalliy do'konlar uchun eng muhim funksiya (qog'oz "qarz daftari" o'rnini bosadi).
- **DB (013):** `customers` (id, shop_id, name, phone, note, created_at). `sales` ga: `customer_id` (nullable), `paid_amount` DECIMAL(12,2). `customer_payments` (id, shop_id, customer_id, amount, paid_at, note). Qarz balansi = Σ(sale qarzlari) − Σ(to'lovlar).
- **UI:** Mijozlar sahifasi (ro'yxat + qidiruv + qarz balansi); sotuvda mijoz tanlash + to'liq/qisman to'lov ("qarzga yozish"); mijoz kartasida qarz tarixi + "to'lov qabul qilish".
- **DoD:** Qarzga sotish, qisman to'lov, qarzni keyin so'ndirish; har mijozda aniq balans va tarix; hisobotlarda "jami qarz" ko'rsatkichi.

### F3-2 — Sotuvni qaytarish (P0)
- **DB (014):** `returns` (id, shop_id, sale_id, total_refund, reason, created_at) + `return_items` (id, return_id, sale_item_id, product_id, quantity, refund_amount). RPC `process_return()` (atomar: inventar +qty, return yozuvi). Hisobot RPC'lari qaytarishlarni chegiradi (net tushum/foyda).
- **UI:** Tarixdan sotuvni ochib → "Qaytarish" → mahsulot/miqdor tanlash → tasdiqlash. Qaytarilgan sotuv tarixda belgilanadi.
- **DoD:** To'liq/qisman qaytarish; inventar to'g'ri tiklanadi; dashboard/hisobot net qiymatlarni ko'rsatadi; ikki marta qaytarish oldini olinadi.

### F3-3 — Kirim / Ta'minotchi (P1)
- **DB (015):** `suppliers` (id, shop_id, name, phone, note). `purchases` (id, shop_id, supplier_id, total, created_at) + `purchase_items` (purchase_id, product_id, quantity, cost_price). RPC `process_purchase()` — inventar +qty, mahsulot tan narxini yangilash (ixtiyoriy: o'rtacha tan narx).
- **UI:** Kirim sahifasi (ta'minotchi tanlash, mahsulot+miqdor+tan narx), ta'minotchilar ro'yxati.
- **DoD:** Kirim inventarni oshiradi; tan narx yangilanadi; kirim tarixi.

### F3-4 — Chegirma (P1)
- **DB (016):** `sale_items` ga `discount_amount`; `sales` ga `discount_total`. `process_sale_cart` kengaytirish (chegirmani qabul qilish, total/foydani qayta hisoblash).
- **UI:** Savatda/sotuvda foiz yoki summa chegirma; chekda va hisobotda aks etadi.
- **DoD:** Chegirma to'g'ri qo'llanadi; foyda chegirmadan keyin hisoblanadi.

### F3-5 — Ko'p kassir + rollar (P1)
- **DB (017):** `shop_members` (id, shop_id, user_id, role[owner|manager|cashier], created_at). `sales` ga `cashier_id`. Owner avtomatik member. Taklif: email orqali (mavjud foydalanuvchini biriktirish yoki taklif yuborish).
- **RBAC:** per-shop rollar. Kassir tan narx/foyda va sozlamalarni ko'rmaydi (faqat sotuv + o'z sotuvlari). RLS'ni `shop_members` bo'yicha qayta yozish (hozir `shops.owner_id` ga bog'liq).
- **DoD:** Do'konga xodim qo'shish; rolga ko'ra ruxsat; sotuvda kim sotgani ko'rinadi.
- ⚠️ **Diqqat:** bu RLS modelini o'zgartiradi — ehtiyotkorlik + test zarur.

### F3-6 — Offline / PWA (P1)
- **Texnika:** `next-pwa`/Workbox service worker + manifest + app ikonalari. IndexedDB: katalog keshi + offline sotuv navbati. Online bo'lganda `process_sale_cart` orqali sinxronlash.
- **DoD:** Internetsiz katalog ochiladi, sotuv navbatga qo'yiladi, ulanganda sinxron; konflikt (inventar) sync paytida tekshiriladi.
- ⚠️ Eng murakkab texnik sprint.

### F3-7 — Obuna / to'lov (P2)
- **DB (018):** `subscriptions` (shop_id, plan, status, current_period_end). Payme/Click webhook (edge function). Free limit (masalan mahsulot soni) + premium unlock.
- **UI:** Tarif sahifasi, to'lov, admin'da real obuna ko'rsatkichi.
- **DoD:** Obuna sotib olish → webhook → premium ochiladi.

### F3-8 — Hisobotlarni kengaytirish (P2)
- Ixtiyoriy sana oralig'i (date-range), PDF eksport (jspdf/pdfmake), kengaytirilgan Excel hisobot, taqqoslash (kecha vs bugun, o'tgan hafta).
- **DoD:** Custom oraliq hisobot; PDF/Excel yuklab olish.

### F3-9 — Bildirishnomalar (P2)
- Kam qoldiq + kunlik hisobot. Web Push (VAPID) yoki email (Resend). Supabase `pg_cron`/edge function bilan rejalashtirish.
- **DoD:** Kam qoldiqda ogohlantirish; kunlik xulosa.

### F3-10 — Barcode yorliq generatsiya (P2)
- Barcode'siz mahsulotga kod generatsiya (JsBarcode) + chop etish uchun yorliq layout (A4 grid).
- **DoD:** Mahsulotga barcode biriktirish + yorliq chop etish.

---

## 4. Sprint rejasi

> Har sprint ~2 hafta. Tartib: avval sifat poydevori, keyin P0, P1, P2.

### Sprint 0 — Sifat poydevori & texnik qarz
- **ESLint sozlash** (`eslint` + `eslint-config-next` + `.eslintrc.json`) va xatolarni tuzatish.
- **Testlar:** Vitest unit (`normalizeBarcode`, `calculateProfit`, `formatCurrency`) + Playwright E2E skeleton (auth, sotuv, tarix).
- **CI:** GitHub Actions — PR'da build + lint + test.
- **i18n o'lik kalit tozalash** + `product-form.tsx:28` eski komment.
- **(Ixtiyoriy)** Next.js 16 major upgrade (alohida, ehtiyotkorlik bilan) — `npm audit` advisory'lari.
- **Natija:** lint enforce, CI yashil, test infra, toza kod.

### Sprint 1 — Nasiya / Qarz daftari (F3-1) [P0]
Mijozlar + qarz + to'lovlar. Migration 013. **Natija:** to'liq qarz daftari.

### Sprint 2 — Qaytarish + Chegirma (F3-2, F3-4) [P0/P1]
Return flow + checkout chegirma. Migration 014, 016. **Natija:** qaytarish va chegirma ishlaydi, hisobotlar net.

### Sprint 3 — Kirim / Ta'minotchi (F3-3) [P1]
Suppliers + purchases + stock-in. Migration 015. **Natija:** inventar kirimi va tan narx tarixi.

### Sprint 4 — Ko'p kassir + rollar (F3-5) [P1]
shop_members + per-shop RBAC + RLS qayta yozish. Migration 017. **Natija:** xodimlar va rollar.

### Sprint 5 — Offline / PWA (F3-6) [P1]
Service worker + IndexedDB navbat + sync. **Natija:** offline sotuv.

### Sprint 6 — Obuna + Hisobotlar + Bildirishnoma + Yorliq (F3-7/8/9/10) [P2] + final QA/release
Migration 018. **Natija:** monetizatsiya + kengaytirilgan hisobotlar + v3 release.

---

## 5. DB migratsiyalar xulosasi (013+)

| Migration | Sprint | Mazmun |
|-----------|--------|--------|
| 013 | S1 | `customers`, `customer_payments`, `sales.customer_id/paid_amount` |
| 014 | S2 | `returns`, `return_items`, `process_return()` |
| 015 | S3 | `suppliers`, `purchases`, `purchase_items`, `process_purchase()` |
| 016 | S2 | `sale_items.discount_amount`, `sales.discount_total`, `process_sale_cart` yangilash |
| 017 | S4 | `shop_members`, `sales.cashier_id`, RLS qayta yozish |
| 018 | S6 | `subscriptions` + webhook |

> Eslatma: barchasi Supabase SQL Editor'da QO'LDA, ketma-ket ishga tushiriladi.

---

## 6. Risklar va bog'liqliklar
- **F3-5 (RLS qayta yozish):** mavjud `shops.owner_id` modelidan `shop_members` ga o'tish — RLS siyosatlarini diqqat bilan o'zgartirish + regress test. Eng xavfli.
- **F3-6 (Offline):** sync konfliktlari (inventar manfiy bo'lib qolishi) — server tekshiruvi shart.
- **F3-7 (Billing):** Payme/Click merchant hisob + webhook URL (tashqi konfiguratsiya).
- **Hisobot/qaytarish:** net qiymatlar (tushum − qaytarish) barcha RPC'larda izchil bo'lishi kerak.

---

## 7. Sizdan kerak bo'ladigan kiritmalar
1. **Payme/Click** merchant ma'lumotlari (F3-7 uchun) — kelganda billing aniqlashtiriladi.
2. **Bildirishnoma kanali** (F3-9): Web Push yoki email (Resend API) — qaysi biri?
3. **Kassir rollari** (F3-5): kassir aynan nimani ko'rsin/ko'rmasin (tan narx, hisobot, sozlama)?
4. **Figma** (agar bo'lsa) — yangi sahifalar (mijozlar, kirim, obuna) dizayni uchun.
5. Prioritet tasdig'i: P0 (nasiya + qaytarish) dan boshlaymizmi?

---

## 8. Yangi chat uchun ko'rsatma
1. Ushbu hujjatni va `design-system/MASTER.md` ni o'qing.
2. `CLAUDE.md` qoidalariga amal qiling.
3. Har sprintni alohida branch → PR → `main` qiling; migratsiyani foydalanuvchi Supabase'da ishga tushiradi.
4. Sprint 0 (sifat) dan boshlash tavsiya etiladi — keyin P0.
