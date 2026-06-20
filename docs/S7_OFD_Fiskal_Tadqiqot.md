# S7 — OFD / Fiskal chek: Tadqiqot va arxitektura qarori

> **Holat:** Tadqiqot bosqichi (kod yozilmaydi). Maqsad — S8 (implementatsiya) uchun yo'nalish, ma'lumotlar modeli va biznes-blokatorlarni aniqlash.
> **Sana:** 2026-06-20

---

## 1. Qonuniy kontekst (nega bu #1 ustuvor)

O'zbekistonda chakana savdo, xizmat va ovqatlanish bilan shug'ullanuvchi deyarli barcha
tadbirkorlar (MChJ ham, YaTT ham) **onlayn-NKM yoki virtual kassa (VCR)** ishlatishi shart.

- Har bir sotuv uchun **fiskal chek (ChEK)** beriladi: QR kodli, real vaqtda Soliq qo'mitasiga
  (OFD — Fiskal Ma'lumotlar Operatori orqali) yuboriladi.
- 2023 — e-commerce uchun majburiy; **2025-yildan barcha savdo nuqtalari** uchun.
- Chek tarkibi (majburiy): sotuvchi ma'lumoti, mahsulot nomi, **MXIK/IKPU kodi**, miqdor,
  narx, **QQS (VAT) summasi**, noyob tranzaksiya raqami, QR.
- Jarima: chek bermaslik uchun **5–10 BHM / tranzaksiya** (~130–260 USD), takror buzilishda
  faoliyatni to'xtatish.

**Xulosa:** uscan'ni do'kon yagona/asosiy kassa sifatida qonuniy ishlatishi uchun fiskal chek
majburiy. Busiz uscan faqat ichki hisob/yordamchi vosita bo'lib qoladi (raqobatchilar —
iDokon, Hippo, RAOS, REGOS — da bu bor).

---

## 2. Ikki arxitektura yo'li

### Yo'l A — O'zimiz Virtual Kassa (VCR) bo'lib ro'yxatdan o'tamiz
uscan'ni **davlat reyestriga** virtual kassa sifatida kiritamiz, o'z fiskal moduli
integratsiyasi + Soliq bilan to'g'ridan-to'g'ri ulanishni sertifikatlashtiramiz.

- ➕ To'liq nazorat, vositachi ulushi yo'q, "fiskal mobil kassa" deb brending.
- ➖ Og'ir: sertifikatlash, davlat reyestri, fiskal modul protokoli, audit, doimiy muvofiqlik.
  Oylar + huquqiy/sertifikatlash xarajati. Bizning nazoratimizdan tashqari kutish.

### Yo'l B — Mavjud OFD/agregator API'siga ulanamiz ✅ (tavsiya)
uscan o'zi VCR bo'lmaydi; fiskalizatsiyani **allaqachon ro'yxatda turgan agregator**
(Payme / CLICK / Multikassa / Soliq-Servis / E-POS) API'siga topshiradi. uscan sotuvdan keyin
ularning API'siga chek ma'lumotini yuboradi, javobida **fiskal belgi + QR** oladi va chop etadi.

- ➕ Yengil, tez, sertifikatlash bizda emas; offline navbat patternimizga mos.
- ➕ **Sinergiya:** Payme va CLICK bir vaqtda HAM to'lov (S9), HAM fiskalizatsiya beradi.
- ➖ Agregatorga bog'liqlik, ehtimoliy tranzaksiya/oylik to'lov, do'kon egasida o'sha
  agregatorda merchant akkaunt bo'lishi shart.

> **Qaror:** Yo'l B. Kichik mobil POS uchun o'z fiskal modulini sertifikatlash mantiqsiz.

---

## 3. Provayder/agregatorlar landshafti

| Provayder | Fiskalizatsiya API | To'lov ham? | Izoh |
|-----------|:---:|:---:|------|
| **Payme (Smart Pay)** | ✅ | ✅ Payme QR | Eng keng tarqalgan; to'lov+chek bitta hamkorlik |
| **CLICK** | ✅ (`docs.click.uz` fiskalizatsiya) | ✅ Click QR | To'lov+chek bitta API oilasi |
| **Multikassa** | ✅ (`ofd.uz`, reyestrda VCR) | ✅ terminal/QR | Poster POS bilan integratsiyasi bor |
| **Soliq-Servis** | ✅ (rasmiy, `api.soliq-servis.uz`) | ❌ | Davlat operatori, "toza" lekin to'lovsiz |
| **E-POS / ARCA / REGOS** | ✅ | qisman | VCR + qurilma yo'nalishi |
| **Payze** | ✅ (`docs.payze.io` OFD) | ✅ | Xalqaro-uslubdagi developer docs |

**Kalit topilma:** **OFD va to'lov bir provayderda birlashadi.** Demak avvalgi rejadagi
**S8 (OFD)** va **S9 (Click/Payme QR to'lov)** ni bitta provayder atrofida birlashtirish
arxitektura jihatdan to'g'ri — ikki marta integratsiya qilmaymiz.

---

## 4. uscan ma'lumotlar modeliga ta'sir (eng muhim texnik natija)

Hozirgi `products` jadvalida (migration `001`) fiskal uchun zarur maydonlar **YO'Q**:

```
products: id, shop_id, name, sale_type, cost_price, selling_price,
          quantity, low_stock_alert, barcode, image_url, is_active,
          category_id (018)   ← MXIK yo'q, QQS yo'q
```

S8 dan oldin quyidagilar qo'shilishi shart (yangi migration, masalan `024`):

**`products` jadvaliga:**
- `mxik_code TEXT` — MXIK/IKPU tasnif kodi (har mahsulot uchun majburiy, fiskal uchun shart)
- `package_code TEXT` — qadoq kodi (MXIK bilan birga ishlatiladi, ko'pincha kerak)
- `vat_percent SMALLINT DEFAULT 0` — QQS stavkasi (YaTT/soddalashtirilgan rejimda 0% bo'lishi mumkin, lekin maydon shart)

**Yangi `fiscal_receipts` jadvali (S8):**
- `id, shop_id, sale_id(/sale_cart), provider, fiscal_sign, qr_url, receipt_number,
  status('pending'|'sent'|'failed'), error, payload jsonb, created_at, sent_at`
- Offline navbat patterni: sotuv darhol o'tadi, fiskalizatsiya `pending` → reconnect'da
  yuboriladi (mavjud `offline-queue` / `019` idempotency patternimizga mos).

**`shops` jadvaliga (sozlamalar):**
- Fiskal provayder turi, merchant ID / API kalit (shifrlangan), kassa ID, soliq STIR/INN.

> **Onboarding ta'siri:** MXIK kodisiz mahsulot fiskal chek bera olmaydi. Demak katalogga
> MXIK kiritish UX'i kerak (qo'lda + Excel/CSV importga (`018`) MXIK ustuni qo'shish +
> kelajakda MXIK qidiruv/avtomatik to'ldirish). Bu "tayyor barcode bazasi" (S12) bilan bog'liq.

---

## 5. Biznes-blokatorlar (kod emas — oldindan hal qilinishi shart)

1. **Provayder tanlash:** Payme yoki CLICK? (ikkalasi to'lov+fiskal). Tijorat shartlari,
   tranzaksiya narxi, sandbox/test muhiti kerak.
2. **Merchant shartnoma:** har do'kon egasida tanlangan provayderda merchant akkaunt bo'lishi
   shart. uscan ko'p-ijarali (multi-tenant) bo'lgani uchun: har do'kon o'z merchant kalitini
   sozlamada kiritadimi, yoki uscan platforma sifatida sub-merchant model quradimi?
3. **MXIK manbasi:** mahsulotlarga MXIK kodlarini kim/qanday biriktiradi (qo'lda, MXIK
   qidiruv API, yoki tayyor baza). Bu onboarding tezligiga to'g'ridan-to'g'ri ta'sir qiladi.
4. **Test akkaunt:** S8 implementatsiyasi sandbox'siz boshlanmaydi.

---

## 6. Tavsiya etilgan keyingi qadamlar

| Qadam | Tavsif | Bloklovchi |
|-------|--------|:---:|
| **S7.1** | Payme va CLICK fiskalizatsiya developer docs'ini to'liq olish (sandbox kredensial, aniq JSON sxema, narx) | Foydalanuvchi — provayder bilan bog'lanish |
| **S8a** | Ma'lumotlar modeli migration `024`: `products.mxik_code/package_code/vat_percent` + `fiscal_receipts` jadval + `shops` fiskal sozlamalari | Yo'q (kodga tayyor) |
| **S8b** | Tanlangan provayder API integratsiyasi: sotuvdan keyin chek yuborish, fiskal belgi/QR saqlash, offline navbat, chekka QR chop etish | S7.1 (sandbox) |
| **S8c** | Katalog UX: MXIK kiritish + Excel importga MXIK ustuni | S8a |
| **S9** | **S8 bilan birlashtiriladi** — bir provayderda to'lov QR + fiskal | — |

**Birinchi harakat:** S8a (migration) ni provayder tanlovidan **mustaqil** boshlasa bo'ladi —
MXIK/QQS/`fiscal_receipts` strukturasi qaysi provayder bo'lishidan qat'i nazar kerak. Bu vaqtni
tejaydi: foydalanuvchi provayder bilan bog'lanayotganda biz schema'ni tayyorlaymiz.

---

## 7. Ochiq savollar (foydalanuvchi qaror qiladi)

1. **Provayder:** Payme yoki CLICK (yoki ikkalasi qo'llab-quvvatlanadimi)?
2. **Merchant model:** har do'kon o'z kalitini kiritadimi, yoki platforma sub-merchant?
3. **Boshlash nuqtasi:** S8a migration'ni hoziroq boshlaymizmi (provayder docs kutilayotganda),
   yoki avval foydalanuvchi sandbox kredensialni oladimi?

---

### Manbalar
- [Soliq qo'mitasi — Onlayn NKM](https://soliq.uz/page/onlayn-nkm)
- [LEX.uz 943-son qaror (NKM/virtual kassa)](https://lex.uz/docs/-4603329)
- [Payze — Uzbekistan Fiscalization OFD](https://docs.payze.io/docs/uzbekistan-fiscalization-ofd)
- [CLICK — Fiscalization](https://docs.click.uz/en/fiscalization/)
- [101 Digital — Uzbekistan E-Commerce Tax Guide 2026](https://101digital.uz/en/blog/uzbekistan-ecommerce-tax-legal-guide-2026/)
- [Multikassa (ofd.uz)](https://multikassa.uz/uz/smart-kassa/)
- [Soliq-Servis API](https://api.soliq-servis.uz/en/about/)
- [REGOS VCR](https://regos.uz/uz/market/software/regos-vcr-detail)
