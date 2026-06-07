# Sprint 2 — Barcode skanerlash + DONALI sotuv

**Maqsad:** Sotuvchi barcode'ni skanerlab, mahsulotni topib, donali (dona) sotuvni
yakunlaydi. Inventar avtomatik kamayadi, sotuv yoziladi, chek ko'rsatiladi.

**Bog'liq FR'lar:** FR-20, FR-21, FR-22 (barcode), FR-26, FR-27, FR-28, FR-29, FR-30 (POS),
FR-31, FR-32 (inventar), FR-12 (donali mantiq).

## Poydevor (allaqachon tayyor)
- `process_sale()` SQL funksiyasi — atomar sotuv (inventar − + sales insert + snapshot narxlar).
- `sales` jadvali + RLS, `idx_products_barcode` indeksi.
- `@zxing/library`, `react-webcam` o'rnatilgan.

## Ishlar ro'yxati

### A — Sotuv ma'lumot qatlami
- [ ] `lib/sales.ts` — `findProductByBarcode(barcode)`, `processSale(productId, shopId, qty, method)`
      (Supabase `rpc('process_sale', ...)` chaqiradi)
- [ ] `hooks/use-sale.ts` — TanStack Query mutation; muvaffaqiyatda `products` + `sales` cache invalidation

### B — Barcode skaner
- [ ] `components/sales/barcode-scanner.tsx` — react-webcam + zxing `BrowserMultiFormatReader`,
      real-time dekod, kamera ruxsati/xato holatlari (FR-20)
- [ ] Skanerlangach mahsulotni topish < 1s, topilmasa "qo'lda qidiruv" fallback (FR-21, FR-22)

### C — Sotuv UI (donali)
- [ ] `components/sales/product-result-card.tsx` — nom, sotish narxi, qoldiq (tan narxi YO'Q!)
- [ ] `components/sales/quantity-stepper.tsx` — [−] [n dona] [+] (FR-12, FR-27)
- [ ] `components/sales/confirm-sale-dialog.tsx` — tasdiqlash modali (FR-28)
- [ ] `components/sales/receipt.tsx` — chek: nom, miqdor, jami; [Keyingisi]/[Yakunlash] (FR-29)
- [ ] `app/(dashboard)/sell/page.tsx` — kamera + natija + stepper + sotish oqimini yig'ish

### D — Inventar/edge cases
- [ ] Mavjuddan ortiq sotishga urinish → `process_sale` xatosini ushlab, foydalanuvchiga ko'rsatish (FR-32)
- [ ] `quantity = 0` mahsulot "tugadi" — sotuvga taqdim etilmasin
- [ ] `search_method = 'barcode'` saqlanishi (FR-30)

### E — Sifat
- [ ] Security: tan narxi sotuv ekranida ko'rinmasligi
- [ ] E2E: barcode (mock) → stepper → sotish → inventar kamayishi → chek

## Qarorlar / xavflar (boshlашdan oldin)
- **R1:** Barcode kamerasi mobil brauzerda HTTPS talab qiladi (localhost'da ishlaydi).
  Vercel deploy yoki `next dev --experimental-https` kerak bo'lishi mumkin.
- **R2:** zxing uzluksiz skanerlash vs bitta kadr — battery/performance balansi.
- **R3:** Bir nechta mahsulot bir xil barcode'ga ega bo'lsa? (MVP: birinchisini olamiz yoki ogohlantiramiz).
- **R4:** Sotuvdan keyin "savat" (bir nechta mahsulot) yoki bittalab sotuvmi? PRD bittalab oqimni ko'rsatadi.

## Tavsiya etilgan agentlar
@react-expert (skaner + UI), @nextjs-specialist (sahifa yig'ish),
@database-optimizer (process_sale tekshiruvi), @security-auditor, @test-automator
