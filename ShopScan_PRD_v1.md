# ShopScan — Mahsulot Talablari Hujjati (PRD)

**Aqlli Do'kon Boshqaruv Tizimi**

| | |
|---|---|
| **Mahsulot** | Responsive Web App (Desktop + Mobile) |
| **Bosqich** | MVP v1.0 |
| **Hujjat versiyasi** | 1.0 (PRD) — manba TZ v2.0 asosida |
| **Sana** | 2025 |
| **Tayyorladi** | Product Management |
| **Holati** | Ko'rib chiqish uchun (Draft for Review) |

---

## Mundarija

- [Hujjat nazorati](#hujjat-nazorati)
- [1. Umumiy ko'rinish (Overview)](#1-umumiy-korinish-overview)
  - [1.1 Hujjatning maqsadi](#11-hujjatning-maqsadi)
  - [1.2 Mahsulot tavsifi](#12-mahsulot-tavsifi)
  - [1.3 Mahsulot vizyoni](#13-mahsulot-vizyoni)
  - [1.4 Platforma va qamrov](#14-platforma-va-qamrov)
- [2. Muammo bayoni (Problem Statement)](#2-muammo-bayoni-problem-statement)
  - [2.1 Joriy holat](#21-joriy-holat)
  - [2.2 Asosiy og'riq nuqtalari](#22-asosiy-ogriq-nuqtalari)
  - [2.3 Muammoning ta'siri](#23-muammoning-tasiri)
  - [2.4 Yechim gipotezasi](#24-yechim-gipotezasi)
- [3. Maqsadlar va muvaffaqiyat mezonlari (Goals & Success Metrics)](#3-maqsadlar-va-muvaffaqiyat-mezonlari-goals--success-metrics)
  - [3.1 Biznes maqsadlari](#31-biznes-maqsadlari)
  - [3.2 Mahsulot maqsadlari](#32-mahsulot-maqsadlari)
  - [3.3 Foydalanuvchi maqsadlari](#33-foydalanuvchi-maqsadlari)
  - [3.4 Muvaffaqiyat metrikalari (KPI)](#34-muvaffaqiyat-metrikalari-kpi)
  - [3.5 Maqsad bo'lmagan (Non-goals)](#35-maqsad-bolmagan-non-goals)
- [4. Maqsadli auditoriya (Target users / Personas)](#4-maqsadli-auditoriya-target-users--personas)
  - [4.1 Bozor segmenti](#41-bozor-segmenti)
  - [4.2 Birlamchi persona — Do'kon egasi](#42-birlamchi-persona--dokon-egasi)
  - [4.3 Ikkilamchi persona — Sotuvchi / xodim (V2 konteksti)](#43-ikkilamchi-persona--sotuvchi--xodim-v2-konteksti)
  - [4.4 Foydalanuvchi konteksti](#44-foydalanuvchi-konteksti)
- [5. Funksional talablar (Functional requirements)](#5-funksional-talablar-functional-requirements)
  - [5.1 Autentifikatsiya va do'kon hisobi](#51-autentifikatsiya-va-dokon-hisobi)
  - [5.2 Mahsulot boshqaruvi va katalog](#52-mahsulot-boshqaruvi-va-katalog)
  - [5.3 Sotuv turi tizimi (DONALI / VAZN)](#53-sotuv-turi-tizimi-donali--vazn)
  - [5.4 Narx va foyda hisoblash](#54-narx-va-foyda-hisoblash)
  - [5.5 Barcode skanerlash](#55-barcode-skanerlash)
  - [5.6 Vizual AI qidiruv](#56-vizual-ai-qidiruv)
  - [5.7 Sotuv jarayoni (POS)](#57-sotuv-jarayoni-pos)
  - [5.8 Inventar boshqaruvi](#58-inventar-boshqaruvi)
  - [5.9 Dashboard, tarix va hisobotlar](#59-dashboard-tarix-va-hisobotlar)
- [6. Sotuv turi tizimi — chuqur tahlil (DONALI va VAZN)](#6-sotuv-turi-tizimi--chuqur-tahlil-donali-va-vazn)
  - [6.1 DONALI mahsulot](#61-donali-mahsulot)
  - [6.2 VAZN (kg) mahsulot](#62-vazn-kg-mahsulot)
  - [6.3 Narx tuzilmasi](#63-narx-tuzilmasi)
  - [6.4 Chegaraviy holatlar (Edge cases)](#64-chegaraviy-holatlar-edge-cases)
- [7. Funksional bo'lmagan talablar (Non-functional requirements)](#7-funksional-bolmagan-talablar-non-functional-requirements)
  - [7.1 Ishlash (Performance)](#71-ishlash-performance)
  - [7.2 Xavfsizlik](#72-xavfsizlik)
  - [7.3 Ma'lumotlar aniqligi va yaxlitligi](#73-malumotlar-aniqligi-va-yaxlitligi)
  - [7.4 Foydalanuvchanlik (Usability) va responsive dizayn](#74-foydalanuvchanlik-usability-va-responsive-dizayn)
  - [7.5 Ishonchlilik va mavjudlik (Reliability & Availability)](#75-ishonchlilik-va-mavjudlik-reliability--availability)
  - [7.6 Brauzer va qurilma mosligi](#76-brauzer-va-qurilma-mosligi)
  - [7.7 Kengayuvchanlik (Scalability)](#77-kengayuvchanlik-scalability)
  - [7.8 Lokalizatsiya va til](#78-lokalizatsiya-va-til)
- [8. Foydalanuvchi stsenariylari (User stories / Use cases)](#8-foydalanuvchi-stsenariylari-user-stories--use-cases)
- [9. Ekranlar va UX oqimi (Screens & UX flow)](#9-ekranlar-va-ux-oqimi-screens--ux-flow)
  - [9.1 Asosiy ekranlar](#91-asosiy-ekranlar)
  - [9.2 Mahsulot qo'shish oqimi](#92-mahsulot-qoshish-oqimi)
  - [9.3 Sotuv ekrani oqimi](#93-sotuv-ekrani-oqimi)
- [10. Ma'lumotlar modeli (Data model)](#10-malumotlar-modeli-data-model)
  - [10.1 products jadvali](#101-products-jadvali)
  - [10.2 sales jadvali](#102-sales-jadvali)
  - [10.3 Vizual qidiruv qanday ishlaydi](#103-vizual-qidiruv-qanday-ishlaydi)
- [11. Texnik arxitektura (qisqacha)](#11-texnik-arxitektura-qisqacha)
- [12. MVP doirasi va doiradan tashqari (Scope / Out of scope)](#12-mvp-doirasi-va-doiradan-tashqari-scope--out-of-scope)
  - [12.1 MVP doirasi (In scope — Must have)](#121-mvp-doirasi-in-scope--must-have)
  - [12.2 Keyingi bosqich (V2 — Nice to have)](#122-keyingi-bosqich-v2--nice-to-have)
  - [12.3 Doiradan tashqari (Out of scope — MVP da yo'q)](#123-doiradan-tashqari-out-of-scope--mvp-da-yoq)
- [13. Bog'liqliklar va xavflar (Dependencies & Risks)](#13-bogliqliklar-va-xavflar-dependencies--risks)
  - [13.1 Bog'liqliklar](#131-bogliqliklar)
  - [13.2 Xavflar reestri](#132-xavflar-reestri)
  - [13.3 Taxminlar (Assumptions)](#133-taxminlar-assumptions)
  - [13.4 Ochiq savollar (Open questions)](#134-ochiq-savollar-open-questions)
- [14. Bosqichlar va vaqt jadvali (Milestones / Timeline)](#14-bosqichlar-va-vaqt-jadvali-milestones--timeline)
  - [14.1 Asosiy bosqich nuqtalari (Milestones)](#141-asosiy-bosqich-nuqtalari-milestones)
- [15. MVP qabul qilish mezonlari (Definition of Done)](#15-mvp-qabul-qilish-mezonlari-definition-of-done)
- [16. Ilova — atamalar lug'ati (Glossary)](#16-ilova--atamalar-lugati-glossary)

---

## Hujjat nazorati

**Versiyalar tarixi**

| **Versiya** | **Sana** | **Muallif**        | **O'zgartirishlar tavsifi**                                                                                                       |
|-------------|----------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| TZ v2.0     | 2025     | Loyiha egasi       | Boshlang'ich texnik topshiriq (manba hujjat).                                                                                     |
| PRD 1.0     | 2025     | Product Management | TZ asosida tuzilgan to'liq PRD: maqsadlar, metrikalar, funksional/funksional bo'lmagan talablar, personalar, xavflar, bosqichlar. |

**Tasdiqlovchilar (Approvers)**

| **Rol**                        | **Mas'uliyat**                     | **Holati**            |
|--------------------------------|------------------------------------|-----------------------|
| Mahsulot egasi (Product Owner) | Mahsulot vizyoni va ustuvorliklar  | Tasdiqlash kutilmoqda |
| Texnik yetakchi (Tech Lead)    | Arxitektura va texnik amaliyligi   | Tasdiqlash kutilmoqda |
| Dizayn (UX/UI)                 | Foydalanuvchi tajribasi va oqimlar | Tasdiqlash kutilmoqda |
| QA yetakchi                    | Sifat va qabul mezonlari           | Tasdiqlash kutilmoqda |

## 1. Umumiy ko'rinish (Overview)

### 1.1 Hujjatning maqsadi

Ushbu Mahsulot Talablari Hujjati (PRD) ShopScan mahsulotining MVP (Minimum Viable Product) versiyasi uchun nima qurilishi, kim uchun va qanday muvaffaqiyat o'lchanishini bir manbaga jamlaydi. Hujjat mahsulot, dizayn, muhandislik va sifat nazorati jamoalari uchun yagona haqiqat manbai (single source of truth) bo'lib xizmat qiladi va talablar, ustuvorliklar hamda qabul mezonlari bo'yicha umumiy tushunchani ta'minlaydi.

Hujjat manba sifatida ShopScan TZ v2.0 texnik topshirig'iga tayanadi va uni sanoat standartlariga mos PRD formatiga keltiradi: aniq maqsadlar, o'lchanadigan metrikalar, identifikatorlangan funksional talablar, qabul mezonlari, xavflar reestri va bosqichli reja.

### 1.2 Mahsulot tavsifi

ShopScan — kichik do'kon egalari uchun mo'ljallangan responsive web ilova bo'lib, u uch vazifani bitta oddiy ish oqimida birlashtiradi: (1) mahsulotlarni rasmli katalog orqali boshqarish, (2) kamera yordamida — barcode skanerlash yoki AI vizual qidiruv (CLIP) orqali — tez sotish, va (3) tan narxi va sotish narxiga asoslangan moliyaviy hisobotni avtomatik ko'rsatish.

Mahsulotning markaziy farqlovchi xususiyati — sotuv turi tizimi: har bir mahsulot DONALI (dona) yoki VAZN (kg/gramm) sifatida belgilanadi va butun tizim (miqdor kiritish, inventardan ayirish, narx hisoblash, ogohlantirishlar) shu turga mos ravishda ishlaydi.

### 1.3 Mahsulot vizyoni

**Vizyon:** Har bir kichik do'kon egasi qog'oz daftar va xotiraga tayanmasdan, telefon yoki kompyuter orqali bir necha soniyada sotuvni yakunlay oladigan va istalgan paytda “bugun qancha sof foyda qildim?” degan savolga aniq javob ola oladigan dunyo.

**Missiya:** Sotuvni tezlashtirish va foydani shaffof qilish orqali kichik do'kon biznesini raqamlashtirish — murakkab buxgalteriya bilimisiz.

### 1.4 Platforma va qamrov

MVP web platformasida (responsive) yetkaziladi va quyidagi qurilma sinflarini qo'llab-quvvatlaydi. Mobil qurilmada kamera ishlashi majburiy talab hisoblanadi, chunki sotuv oqimi unga bog'liq.

| **Platforma**       | **Talab**                                         | **Texnologik yondashuv**                     |
|---------------------|---------------------------------------------------|----------------------------------------------|
| Desktop (1280px+)   | Mukammal ko'rinish; asosiy ish joyi               | Responsive CSS Grid, doimiy sidebar          |
| Tablet (768–1279px) | To'liq funksionallik                              | Moslashuvchan layout, yig'iladigan yon panel |
| Mobil (320–767px)   | Mukammal ko'rinish; kamera ishlashi shart         | Mobile-first CSS, pastki navigatsiya         |
| Brauzerlar          | Chrome, Firefox, Safari, Edge — so'nggi 2 versiya | Web standartlariga rioya                     |

## 2. Muammo bayoni (Problem Statement)

### 2.1 Joriy holat

Ko'plab kichik do'kon egalari biznesni qog'oz daftar, eslab qolish va qo'lda hisoblash orqali yuritadilar. Mahsulot katalogi rasmiylashtirilmagan, narxlar boshda saqlanadi, sotuv jarayoni qo'lda kechadi va moliyaviy natija (ayniqsa sof foyda) tizimli tarzda kuzatilmaydi. Bu xato ehtimolini oshiradi va biznes qarorlarini taxminga asoslantiradi.

### 2.2 Asosiy og'riq nuqtalari

- **Tartibsiz katalog:** mahsulot ro'yxati qog'ozda yoki xotirada saqlanadi — xatolar va nomuvofiqliklar ko'p.

- **Foyda ko'rinmasligi:** tan narxi va sotish narxi alohida kuzatilmaydi, shuning uchun har bir sotuv yoki kun bo'yicha real foyda noma'lum.

- **Birlik chalkashligi:** donali va kilogrammli mahsulotlar bir xil tarzda hisoblanadi — bu noto'g'ri summalarga olib keladi (masalan, kasr kg sotuvini dona kabi hisoblash).

- **Sekin sotuv:** har bir sotuv qo'lda izlash va hisoblashni talab qiladi — bu vaqtni yo'qotadi va navbatni uzaytiradi.

- **Hisobotning yo'qligi:** kunlik/oylik daromad va foyda bo'yicha tayyor ko'rsatkichlar mavjud emas.

### 2.3 Muammoning ta'siri

Bu og'riq nuqtalari to'g'ridan-to'g'ri pul va vaqt yo'qotishiga aylanadi: noto'g'ri narxlash tufayli foyda “sizib” ketadi, inventar nazoratsizligi tufayli mahsulot kutilmaganda tugaydi yoki ortib qoladi, sekin sotuv esa mijoz tajribasiga salbiy ta'sir qiladi. Egasi biznesni “his-tuyg'u” bilan boshqaradi, real ma'lumotlar bilan emas.

### 2.4 Yechim gipotezasi

Agar do'kon egasiga (a) har bir mahsulot uchun tan narxi va sotish narxini kiritib, foydani avtomatik hisoblaydigan, (b) mahsulotni DONALI yoki VAZN turiga ajratib to'g'ri o'lchaydigan, (c) barcode yoki vizual qidiruv orqali bir zumda sotuvni yakunlaydigan va (d) kunlik daromad/foydani dashboardda ko'rsatadigan oddiy vosita berilsa, u tezroq sotadi, kamroq xato qiladi va biznesini ma'lumotga asoslanib boshqaradi.

## 3. Maqsadlar va muvaffaqiyat mezonlari (Goals & Success Metrics)

### 3.1 Biznes maqsadlari

- Kichik do'kon egalari uchun real foydani shaffof qiladigan, kundalik foydalaniladigan vositani bozorga chiqarish.

- Beta bosqichda 5–10 ta real do'konda mahsulotni sinovdan o'tkazib, retention (qaytib foydalanish) va sotuv tezligi bo'yicha dalillar to'plash.

- MVP yetkazib berishni 10 hafta ichida amalga oshirish va keyingi bosqich (V2) uchun asos yaratish.

### 3.2 Mahsulot maqsadlari

- Sotuvni barcode yoki vizual qidiruv orqali soniyalar ichida yakunlash imkonini berish.

- Har bir sotuvda tan/sotish narxiga asoslangan sof foydani avtomatik hisoblash va dashboardda ko'rsatish.

- DONALI va VAZN mahsulotlarini bir tizimda, har biriga mos mantiq bilan to'g'ri boshqarish.

- Inventarni har bir sotuvda avtomatik va aniq (dona yoki gramm darajasida) yangilash.

### 3.3 Foydalanuvchi maqsadlari

- “Tezda sotaman” — mahsulotni izlamasdan kamera orqali topib, bir necha tegishda sotuvni yakunlash.

- “Foydamni ko'raman” — bugun va shu oy qancha sof foyda qilganini aniq bilish.

- “Inventarni nazorat qilaman” — nima kam qolganini va nima ko'p sotilayotganini ko'rish.

### 3.4 Muvaffaqiyat metrikalari (KPI)

Quyidagi ko'rsatkichlar MVP muvaffaqiyatini o'lchaydi. Maqsadli qiymatlar beta bosqich uchun boshlang'ich mo'ljal sifatida belgilangan va real ma'lumotlar asosida qayta sozlanadi.

| **Toifa**   | **Metrika**                                     | **Maqsadli qiymat**                          | **O'lchash usuli**                   |
|-------------|-------------------------------------------------|----------------------------------------------|--------------------------------------|
| Tezlik      | Bitta sotuvni yakunlash vaqti (topish → sotish) | \< 10 soniya (barcode bilan)                 | Hodisa vaqtini o'lchash (analytics)  |
| Tezlik      | Donali mahsulot qo'shish vaqti                  | \< 30 soniya                                 | Sessiya vaqtini o'lchash             |
| Aniqlik     | Vizual qidiruvda to'g'ri mahsulot top-3 da      | \> 90%                                       | 20+ rasmli nazorat to'plami          |
| Aniqlik     | Inventar mosligi (tizim vs real)                | Og'ish 0 dona / 0 gramm                      | Davriy inventarizatsiya solishtiruvi |
| Qiymat      | Egasining “bugungi foydani” ko'rishi            | Sessiyalarning \> 70% ida dashboard ochiladi | Sahifa ko'rish analytikasi           |
| Barqarorlik | Sotuv jarayonidagi xatolik darajasi             | \< 1% sotuvda xato/uzilish                   | Xato loglari (error tracking)        |
| Sadoqat     | Beta do'konlar 2-haftalik retention             | \> 60% faol qoladi                           | Faollik kuzatuvi                     |
| Ishlash     | Sahifa yuklanish (LCP)                          | \< 2 soniya                                  | Web Vitals o'lchash                  |

### 3.5 Maqsad bo'lmagan (Non-goals)

MVP doirasida quyidagilar aniq maqsad emas: onlayn to'lov integratsiyasi, to'liq CRM/mijozlar bazasi, soliq hisoboti, native mobil ilova. Ular keyingi bosqichlarda ko'rib chiqiladi (qarang: 12-bo'lim, Scope/Out of Scope).

## 4. Maqsadli auditoriya (Target users / Personas)

### 4.1 Bozor segmenti

Birlamchi segment — kichik oziq-ovqat va aralash (oziq-ovqat + non-oziq) do'konlar egalari. Ular odatda do'konni o'zlari yoki kichik jamoa bilan boshqaradi, o'rta darajadagi texnik savodga ega va smartfondan kundalik foydalanadi. Ular uchun murakkab ERP/POS tizimlari qimmat va ortiqcha murakkab; ularga sodda, tez va foydani ko'rsatadigan vosita kerak.

### 4.2 Birlamchi persona — Do'kon egasi

| **Xususiyat**          | **Tavsif**                                                                                  |
|------------------------|---------------------------------------------------------------------------------------------|
| Ism (persona)          | Sherzod, 38 yosh — oziq-ovqat va non-oziq do'kon egasi                                      |
| Texnik saviya          | O'rta — smartfon va kompyuterdan ishonchli foydalanadi, lekin murakkab dasturlardan qochadi |
| Asosiy muammo          | Real foydasini bilmaydi; sotuv jarayoni sekin va qo'lda                                     |
| Maqsadlari             | Tez sotish, sof foydani ko'rish, inventarni nazorat qilish                                  |
| Qurilmalari            | Do'konda kompyuter/planshet + qo'lida Android/iOS telefon                                   |
| Motivatsiya            | Vaqtni tejash va biznesni “taxmin” emas, real raqam bilan boshqarish                        |
| To'siqlar (qo'rquvlar) | Murakkab interfeys, ma'lumot kiritishga ketadigan ko'p vaqt, ishonchsiz hisob-kitob         |

### 4.3 Ikkilamchi persona — Sotuvchi / xodim (V2 konteksti)

MVP bitta foydalanuvchi (egasi) uchun mo'ljallangan. Biroq tizim dizayni keyinchalik xodim rolini qo'shishni hisobga oladi: xodim sotuvni amalga oshira oladi, ammo tan narxi va foyda ma'lumotlarini ko'rmaydi. Bu maxfiylik talabi MVP ma'lumotlar modelida (snapshot narxlar, RLS) allaqachon hisobga olingan, lekin xodim rolining o'zi V2 ga kiritiladi.

| **Xususiyat** | **Tavsif**                                           |
|---------------|------------------------------------------------------|
| Rol           | Sotuvchi / yordamchi (V2)                            |
| Maqsad        | Tez va xatosiz sotuvni yakunlash                     |
| Cheklov       | Tan narxi, foyda va ba'zi hisobotlarni ko'ra olmaydi |

### 4.4 Foydalanuvchi konteksti

Foydalanuvchi mahsulotni ko'pincha tik turgan holda, telefon bilan, ehtimol bir qo'li band bo'lgan vaziyatda va mijoz oldida tezlik talab qilinadigan paytda ishlatadi. Shu sababli interfeys katta tegiladigan elementlar, minimal kiritish va tez javob berishni talab qiladi; kamera oqimi past yorug'lik va turli fon sharoitlarida ham ishonchli bo'lishi kerak.

## 5. Funksional talablar (Functional requirements)

Funksional talablar modullarga (epik) guruhlangan va har biri identifikator (FR-XX), ustuvorlik (MoSCoW: Must / Should / Could) va qisqa tavsif bilan keltirilgan. Batafsil qabul mezonlari 8-bo'limdagi user storylar va 6-bo'limdagi sotuv turi tizimida beriladi. Ustuvorlik manba TZ dagi “Kritik / Muhim” darajalariga mos keladi (Kritik → Must, Muhim → Should).

### 5.1 Autentifikatsiya va do'kon hisobi

| **ID** | **Talab**              | **Tavsif**                                                   | **Ustuvorlik** |
|--------|------------------------|--------------------------------------------------------------|----------------|
| FR-01  | Ro'yxatdan o'tish      | Email + parol va do'kon nomi bilan tezkor ro'yxatdan o'tish. | Must           |
| FR-02  | Tizimga kirish         | Email + parol orqali kirish; JWT token bilan sessiya.        | Must           |
| FR-03  | Ma'lumot izolyatsiyasi | Har bir do'kon faqat o'z ma'lumotlarini ko'radi (RLS).       | Must           |
| FR-04  | Profil sozlamalari     | Do'kon nomi, profil va parolni o'zgartirish.                 | Should         |

### 5.2 Mahsulot boshqaruvi va katalog

| **ID** | **Talab**             | **Tavsif**                                                                                          | **Ustuvorlik** |
|--------|-----------------------|-----------------------------------------------------------------------------------------------------|----------------|
| FR-05  | Mahsulot qo'shish     | Rasm, nom, sotuv turi, tan narxi, sotish narxi, miqdor, ogohlantirish chegarasi, ixtiyoriy barcode. | Must           |
| FR-06  | Mahsulotni tahrirlash | Mavjud mahsulot maydonlarini o'zgartirish (narx o'zgarishi tarixga ta'sir qilmaydi — snapshot).     | Must           |
| FR-07  | Mahsulotni arxivlash  | is_active orqali mahsulotni o'chirmasdan faolsizlantirish.                                          | Should         |
| FR-08  | Rasm yuklash          | Kameradan yoki galereyadan rasm yuklash; Supabase Storage da saqlash.                               | Must           |
| FR-09  | Katalog ko'rinishi    | Grid/list ko'rinishi; har bir kartada rasm, nom, narx, qolgan miqdor.                               | Should         |
| FR-10  | Qidiruv va filtr      | Nom bo'yicha qidiruv; tur (donali/vazn), narx va miqdor bo'yicha filtr va tartiblash.               | Should         |

### 5.3 Sotuv turi tizimi (DONALI / VAZN)

| **ID** | **Talab**              | **Tavsif**                                                                            | **Ustuvorlik** |
|--------|------------------------|---------------------------------------------------------------------------------------|----------------|
| FR-11  | Sotuv turini belgilash | Mahsulot qo'shishda DONALI yoki VAZN tanlanadi (toggle).                              | Must           |
| FR-12  | Donali mantiq          | Miqdor butun son; sotuvda stepper (−/+); inventar butun sonda ayiriladi.              | Must           |
| FR-13  | Vazn mantiq            | Miqdor kasr (3 kasr, 1 gramm aniqlik); sotuvda kg maydoni; inventar kg da ayiriladi.  | Must           |
| FR-14  | Turga mos UI           | Sotuv va qo'shish ekranlari tanlangan turga qarab mos input va labellarni ko'rsatadi. | Must           |

### 5.4 Narx va foyda hisoblash

| **ID** | **Talab**        | **Tavsif**                                                                               | **Ustuvorlik** |
|--------|------------------|------------------------------------------------------------------------------------------|----------------|
| FR-15  | Tan/sotish narxi | Har bir mahsulotga 1 birlik (dona yoki kg) uchun tan va sotish narxi kiritiladi.         | Must           |
| FR-16  | Foyda preview    | Qo'shish ekranida sof foyda va foyda foizi avtomatik hisoblanib ko'rsatiladi.            | Must           |
| FR-17  | Sotuv foydasi    | Har bir sotuvda sof foyda = (sotish − tan) × miqdor avtomatik hisoblanadi.               | Must           |
| FR-18  | Narx snapshot    | Sotuv paytidagi tan va sotish narxi saqlanadi; keyingi narx o'zgarishi tarixni buzmaydi. | Must           |
| FR-19  | Maxfiylik        | Sotuv jarayonida xaridorga faqat sotish narxi ko'rsatiladi; tan narxi yashirin.          | Must           |

### 5.5 Barcode skanerlash

| **ID** | **Talab**        | **Tavsif**                                                                           | **Ustuvorlik** |
|--------|------------------|--------------------------------------------------------------------------------------|----------------|
| FR-20  | Real-time skaner | Web kamera orqali EAN-13 / QR barcode ni real vaqtda o'qish (zxing-js).              | Must           |
| FR-21  | Tez topish       | Skanerlangan barcode bo'yicha mahsulotni \< 1 soniyada topish va kartani ko'rsatish. | Must           |
| FR-22  | Topilmagan holat | Barcode bazada bo'lmasa, tushunarli xabar va qo'lda qidiruvga o'tish imkoni.         | Should         |

### 5.6 Vizual AI qidiruv

| **ID** | **Talab**        | **Tavsif**                                                                                        | **Ustuvorlik** |
|--------|------------------|---------------------------------------------------------------------------------------------------|----------------|
| FR-23  | Rasm embedding   | Mahsulot qo'shilganda rasm CLIP orqali 512-o'lchamli vektorga aylantirilib pgvector da saqlanadi. | Must           |
| FR-24  | Vizual qidiruv   | Kamera rasmi bo'yicha cosine similarity orqali top-3 o'xshash mahsulotni \< 2 soniyada qaytarish. | Must           |
| FR-25  | Natijani tanlash | Top-3 dan birini tanlash; tanlangan mahsulot turiga mos input ochiladi.                           | Must           |

### 5.7 Sotuv jarayoni (POS)

| **ID** | **Talab**            | **Tavsif**                                                                            | **Ustuvorlik** |
|--------|----------------------|---------------------------------------------------------------------------------------|----------------|
| FR-26  | Sotuv ekrani         | Kamera (barcode/visual rejim), natija kartasi, miqdor/kg input, sotish tugmasi.       | Must           |
| FR-27  | Miqdor kiritish      | Donali: stepper; Vazn: kg raqam maydoni (0.001 dan).                                  | Must           |
| FR-28  | Tasdiqlash           | Sotishdan oldin tasdiqlash modali; keyin inventar yangilanadi va sotuv yoziladi.      | Must           |
| FR-29  | Chek ko'rsatish      | Sotuvdan keyin chek: mahsulot nomi, miqdor, jami summa; “Keyingisi” yoki “Yakunlash”. | Must           |
| FR-30  | Qidiruv usuli yozish | Sotuvda qaysi usul ishlatilgani (barcode/visual/manual) saqlanadi.                    | Should         |

### 5.8 Inventar boshqaruvi

| **ID** | **Talab**                | **Tavsif**                                                                                       | **Ustuvorlik** |
|--------|--------------------------|--------------------------------------------------------------------------------------------------|----------------|
| FR-31  | Avtomatik kamayish       | Sotuvda inventar avtomatik kamayadi (donali: dona; vazn: kg/gramm).                              | Must           |
| FR-32  | Manfiy emas              | Inventar manfiy bo'la olmaydi; mavjud miqdordan ortiq sotishga yo'l qo'yilmaydi (DB constraint). | Must           |
| FR-33  | Kam qoldi ogohlantirishi | Miqdor chegaradan kam bo'lsa vizual ogohlantirish (donali: \<5 sariq, 0 qizil; vazn: \<1 kg).    | Must           |

### 5.9 Dashboard, tarix va hisobotlar

| **ID** | **Talab**          | **Tavsif**                                                                  | **Ustuvorlik** |
|--------|--------------------|-----------------------------------------------------------------------------|----------------|
| FR-34  | Dashboard kartlari | Bugungi jami tushum, bugungi sof foyda, sotuv soni, kam qolgan mahsulotlar. | Should         |
| FR-35  | Foyda grafigi      | Oylik daromad/foyda grafigi (Recharts).                                     | Should         |
| FR-36  | Top mahsulotlar    | Eng ko'p foyda keltirgan / eng ko'p sotilgan top-5 mahsulot.                | Should         |
| FR-37  | Sotuv tarixi       | Barcha sotuvlar ro'yxati; sana va tur bo'yicha filtr; jami ko'rsatkichlar.  | Should         |
| FR-38  | Hisobot            | Kunlik/haftalik/oylik grafik va foyda tahlili.                              | Should         |

## 6. Sotuv turi tizimi — chuqur tahlil (DONALI va VAZN)

Bu ShopScan ning markaziy farqlovchi xususiyati. Har bir mahsulot qo'shilganda sotuv turi belgilanadi va butun tizim — miqdor kiritish, narx hisoblash, inventardan ayirish va ogohlantirishlar — shu turga mos ishlaydi. Quyida ikkala tur uchun batafsil mantiq keltirilgan.

### 6.1 DONALI mahsulot

| **Parametr**        | **Qiymat / Tavsif**                          |
|---------------------|----------------------------------------------|
| Misol               | Shampun, non, o'yinchoq, kitob               |
| Miqdor kiritish     | Butun son — 1, 2, 5, 100 ...                 |
| Sotuv vaqtida       | Nechta dona? Stepper (− / +) bilan tanlanadi |
| Inventardan ayirish | quantity = quantity − sold_count             |
| Narx hisoblash      | sotish_narxi × soni = jami                   |
| Ogohlantirish       | Miqdor 5 dan kam bo'lsa sariq, 0 da qizil    |

### 6.2 VAZN (kg) mahsulot

| **Parametr**        | **Qiymat / Tavsif**                           |
|---------------------|-----------------------------------------------|
| Misol               | Guruch, un, go'sht, meva, sabzavot            |
| Miqdor kiritish     | Kasr son — 0.5 kg, 1.250 kg, 2.75 kg          |
| Sotuv vaqtida       | Necha kg/gramm? Raqam maydoni (3 kasr)        |
| Inventardan ayirish | quantity_kg = quantity_kg − sold_kg           |
| Narx hisoblash      | sotish_narxi (1 kg uchun) × kg miqdori = jami |
| Ko'rsatish          | Katalogda “25.500 kg qoldi” shaklida          |
| Ogohlantirish       | 1 kg dan kam qolsa ogohlantirish              |

### 6.3 Narx tuzilmasi

| **Maydon**           | **Tavsif**                                       | **Misol**             |
|----------------------|--------------------------------------------------|-----------------------|
| Tan narxi            | Do'kon egasi olgan narx (1 dona yoki 1 kg uchun) | 8,000 so'm/kg         |
| Sotish narxi         | Xaridorga sotish narxi                           | 12,000 so'm/kg        |
| Sof foyda (1 birlik) | Sotish − Tan = avtomatik                         | 4,000 so'm/kg         |
| Foyda foizi          | (Foyda / Tan) × 100 = avtomatik                  | 50%                   |
| Jami foyda           | Barcha sotuvlar bo'yicha yig'iladi               | Dashboardda ko'rinadi |

### 6.4 Chegaraviy holatlar (Edge cases)

- Mavjud miqdordan ortiq sotishga urinish: tizim ruxsat bermaydi va mavjud qoldiqni ko'rsatadi (FR-32).

- Vazn mahsulotda juda kichik miqdor (masalan, 0.001 kg = 1 gramm): qo'llab-quvvatlanadi, lekin minimal qiymat tekshiriladi (\> 0).

- Narx sotuvdan keyin o'zgarsa: eski sotuvlar snapshot narxlarni saqlaydi, shuning uchun tarix va foyda hisoboti o'zgarmaydi (FR-18).

- Inventar aynan 0 ga teng bo'lganda: mahsulot “tugadi” holatida ko'rsatiladi va sotuvga taqdim etilmaydi.

- Turni keyinchalik o'zgartirish (donali ↔ vazn): bu xavfli operatsiya; MVP da turni qo'shilgandan keyin o'zgartirish cheklanadi yoki ogohlantirish bilan amalga oshiriladi (ochiq savol — qarang 13.4).

## 7. Funksional bo'lmagan talablar (Non-functional requirements)

### 7.1 Ishlash (Performance)

| **ID** | **Talab**             | **Maqsadli ko'rsatkich**                         |
|--------|-----------------------|--------------------------------------------------|
| NFR-01 | Sahifa yuklanishi     | \< 2 soniya (LCP)                                |
| NFR-02 | Barcode javobi        | \< 1 soniya (skanerlashdan narx ko'rinishigacha) |
| NFR-03 | Vizual qidiruv javobi | \< 2 soniya (top-3 natija)                       |
| NFR-04 | Katalog hajmi         | 10,000 mahsulotgacha tezkor ishlash (HNSW index) |
| NFR-05 | Kamera ravonligi      | Mobil qurilmada 30 fps va undan yuqori           |

### 7.2 Xavfsizlik

- **Ma'lumot izolyatsiyasi:** har bir do'kon faqat o'z ma'lumotlarini ko'radi (Supabase Row Level Security).

- **Narx maxfiyligi:** tan narxi faqat egasiga ko'rinadi; xodim ko'ra olmaydi (V2 rol tizimi bilan to'liq amalga oshiriladi).

- **Rasm himoyasi:** rasm URLlari signed URL orqali himoyalanadi.

- **Autentifikatsiya:** JWT token asosida (Supabase Auth); parollar xavfsiz saqlanadi.

### 7.3 Ma'lumotlar aniqligi va yaxlitligi

- Barcha pul hisob-kitoblari DECIMAL(12,2) — yaxlitlash xatosi bo'lmaydi.

- Vazn hisob-kitoblari DECIMAL(12,3) — 1 gramm aniqligi.

- Sotuv paytidagi narx snapshot sifatida saqlanadi — narx o'zgarganda tarix buzilmaydi.

- Inventar manfiy bo'la olmaydi — DB constraint bilan himoyalangan.

### 7.4 Foydalanuvchanlik (Usability) va responsive dizayn

Interfeys o'rta texnik saviyadagi foydalanuvchi uchun intuitiv bo'lishi, katta tegiladigan elementlar va minimal kiritish talab qilishi kerak. Layout strategiyasi quyidagicha:

| **Ekran** | **Breakpoint** | **Layout o'zgarishi**                                  |
|-----------|----------------|--------------------------------------------------------|
| Mobil     | \< 768px       | Bir ustunli layout, katta tugmalar, pastki navigatsiya |
| Tablet    | 768–1279px     | Ikki ustunli, yig'iladigan yon panel                   |
| Desktop   | 1280px+        | Uch ustunli, doimiy sidebar                            |

### 7.5 Ishonchlilik va mavjudlik (Reliability & Availability)

- 30 daqiqalik uzluksiz sotuv sessiyasida ilova ishdan chiqmasligi (crash yo'q) kerak.

- Sotuv tranzaksiyasi atomar bo'lishi: inventar yangilanishi va sotuv yozuvi birgalikda muvaffaqiyatli yoki birgalikda bekor bo'lishi kerak (ma'lumot nomuvofiqligi bo'lmasin).

- Tarmoq uzilishida foydalanuvchiga tushunarli xato va qayta urinish imkoni ko'rsatilishi kerak.

### 7.6 Brauzer va qurilma mosligi

Chrome, Firefox, Safari va Edge brauzerlarining so'nggi 2 versiyasi qo'llab-quvvatlanadi. Kamera/barcode funksiyalari mobil brauzerlarda (Android Chrome, iOS Safari) ishonchli ishlashi shart, chunki sotuv oqimi ularga bog'liq.

### 7.7 Kengayuvchanlik (Scalability)

Arxitektura kelajakda ko'p do'kon va ko'p foydalanuvchi (V2) ni qo'llab-quvvatlash uchun tayyor bo'lishi kerak: ma'lumotlar shop_id bo'yicha bo'lingan, vektor qidiruvi HNSW index bilan kengayadi, BaaS (Supabase) gorizontal o'sishni ta'minlaydi.

### 7.8 Lokalizatsiya va til

MVP interfeysi o'zbek tilida bo'ladi. Pul birligi so'm sifatida ko'rsatiladi. Raqam va sana formatlari mahalliy konvensiyalarga mos bo'lishi kerak. Kelajakdagi ko'p tillilik uchun matnlar kodda qattiq bog'lanmasligi tavsiya etiladi.

## 8. Foydalanuvchi stsenariylari (User stories / Use cases)

Har bir user story rol, maqsad va sababni ifodalaydi va o'lchanadigan qabul mezonlari (Acceptance Criteria) bilan ta'minlangan. Mezonlar QA uchun “tayyor” (Definition of Done) ta'rifining bir qismi hisoblanadi.

#### US-01. Donali mahsulot qo'shish

*“Do'kon egasi sifatida shampun qo'shmoqchiman: tan narxi 15,000 so'm, sotish narxi 20,000 so'm, 50 dona bor — bazaga qo'shsam, foydam avtomatik ko'rinsin.”*

**Qabul mezonlari:**

- Sotuv turi: DONALI tanlanadi.

- Tan narxi va sotish narxi alohida maydonlar — ikkalasi ham majburiy.

- Foyda va foyda foizi (masalan, 33%) avtomatik hisoblanib ko'rsatiladi.

- Miqdor butun son sifatida kiritiladi.

- Barcode ixtiyoriy — skanerlash yoki qo'lda kiritish mumkin.

**Bog'liq talablar:** FR-05, FR-11, FR-12, FR-15, FR-16

#### US-02. Vazn mahsulot qo'shish

*“Do'kon egasi sifatida guruch qo'shmoqchiman: tan narxi 8,000 so'm/kg, sotish narxi 12,000 so'm/kg, 50 kg bor — sotganda gramm bilan hisoblansin.”*

**Qabul mezonlari:**

- Sotuv turi: VAZN (kg) tanlanadi.

- Tan va sotish narxi 1 kg uchun kiritiladi (label “1 kg uchun” ko'rsatiladi).

- Miqdor kasr son sifatida kiritiladi (50.000 kg).

- Sotuv ekranida kg kiritish maydoni ko'rsatiladi.

**Bog'liq talablar:** FR-05, FR-11, FR-13, FR-15

#### US-03. Barcode orqali sotish

*“Sotuvchi sifatida shampunning barcode'ini skanerlashim bilanoq narxi chiqsin va nechta sotishimni kiritib sotay.”*

**Qabul mezonlari:**

- Skanerlashdan narx ko'rinishigacha \< 1 soniya.

- Xaridorga faqat sotish narxi ko'rsatiladi; tan narxi yashirin.

- Donali mahsulotda dona soni stepper bilan tanlanadi.

- “Sotish” bosilganda inventar kamayadi va sotuv bazaga yoziladi.

**Bog'liq talablar:** FR-20, FR-21, FR-26, FR-27, FR-28, FR-31

#### US-04. Vizual AI orqali sotish

*“Do'kon egasi sifatida barcode'siz mahsulotni kameraga ko'rsatib topsam va kg ni kiritib sotsam.”*

**Qabul mezonlari:**

- Rasm olingandan \< 2 soniyada top-3 natija chiqadi.

- Tanlangan mahsulot — donali yoki vazn turiga qarab to'g'ri input ochiladi.

- Vazn mahsulotda kg maydoni 0.001 dan boshlab kiritish imkonini beradi.

- To'g'ri mahsulot top-3 ichida \> 90% holatda topiladi.

**Bog'liq talablar:** FR-23, FR-24, FR-25, FR-27

#### US-05. Daromad va foyda ko'rish

*“Do'kon egasi sifatida bugun qancha sotganimni va qancha sof foyda qilganimni dashboardda ko'rmoqchiman.”*

**Qabul mezonlari:**

- Bugungi jami sotuv summasi ko'rinadi.

- Bugungi sof foyda (sotish − tan narxi) ko'rinadi.

- Oylik foyda grafigi ko'rinadi.

- Eng ko'p foyda keltirayotgan mahsulotlar top-5 ro'yxati ko'rinadi.

**Bog'liq talablar:** FR-17, FR-34, FR-35, FR-36

#### US-06. Kam qolgan mahsulotlarni nazorat qilish

*“Do'kon egasi sifatida qaysi mahsulotlar tugayotganini bir qarashda ko'rib, o'z vaqtida buyurtma bermoqchiman.”*

**Qabul mezonlari:**

- Donali mahsulot 5 dan kam qolsa sariq, 0 da qizil ko'rsatiladi.

- Vazn mahsulot 1 kg dan kam qolsa ogohlantiriladi.

- Dashboardda “kam qolgan mahsulotlar” ro'yxati ko'rinadi.

**Bog'liq talablar:** FR-33, FR-34

## 9. Ekranlar va UX oqimi (Screens & UX flow)

### 9.1 Asosiy ekranlar

| **\#** | **Ekran**                      | **Tarkib va funksiya**                                                         |
|--------|--------------------------------|--------------------------------------------------------------------------------|
| 1      | Kirish                         | Email + parol, do'kon nomi, tezkor ro'yxatdan o'tish                           |
| 2      | Dashboard                      | Bugungi tushum + sof foyda kartlari, sotuv grafigi, kam qolgan mahsulotlar     |
| 3      | Katalog                        | Mahsulotlar grid/list, qidiruv, filtr (tur/narx/miqdor), tartiblash            |
| 4      | Mahsulot qo'shish / tahrirlash | Rasm, nom, sotuv turi toggle, tan/sotish narxi, foyda preview, miqdor, barcode |
| 5      | Sotuv ekrani                   | Kamera (barcode/visual rejim), natija kartasi, miqdor/kg input, sotish tugmasi |
| 6      | Sotuv tarixi                   | Barcha sotuvlar, sana/tur bo'yicha filtr, jami ko'rsatkichlar                  |
| 7      | Hisobot                        | Kunlik/oylik grafik, top mahsulotlar, foyda tahlili                            |
| 8      | Sozlamalar                     | Do'kon nomi, profil, parol o'zgartirish                                        |

### 9.2 Mahsulot qo'shish oqimi

**Donali rejim:**

- Rasm yuklash (kameradan yoki galereyadan).

- Mahsulot nomi (majburiy).

- Sotuv turi toggle: \[DONALI\] \[VAZN\].

- Tan narxi → Sotish narxi → Foyda (masalan, 5,000 so'm, 33%) avtomatik ko'rsatiladi.

- Miqdor (dona, majburiy) va ogohlantirish chegarasi (dona).

- Barcode (ixtiyoriy — skanerlash yoki qo'lda).

**Vazn rejim (toggle bosilganda):**

- Barcha narxlar “1 kg uchun” label bilan ko'rsatiladi.

- Miqdor maydoni “50.000 kg” formatida (3 kasr).

- Ogohlantirish “1.000 kg dan kam qolganda” shaklida.

### 9.3 Sotuv ekrani oqimi

- Sahifa ochiladi: kamera ko'rinadi, ikki tugma: \[Barcode\] \[Visual Search\].

- Barcode rejimi: real-time skaner — mahsulotni avtomatik topadi.

- Visual rejimi: \[Rasm olish\] → AI qidiradi → top-3 variant chiqadi.

- Mahsulot topildi: karta ko'rinadi — nom, sotish narxi, qolgan miqdor.

- Donali: \[−\] \[3 dona\] \[+\] stepper; Vazn: \[1.500\] kg raqam maydoni.

- \[Sotish\] → tasdiqlash modali → inventar kamayadi → chek ko'rinadi.

- Chek: mahsulot nomi, miqdor, jami summa — \[Keyingisi\] yoki \[Yakunlash\].

## 10. Ma'lumotlar modeli (Data model)

Quyidagi sxema manba TZ ga asoslanadi va talablar uchun ma'lumotlar konteksti sifatida keltiriladi. Yakuniy migratsiyalar muhandislik jamoasi tomonidan aniqlashtiriladi.

### 10.1 products jadvali

| **Maydon**      | **Tur**       | **Majburiy** | **Tavsif**                             |
|-----------------|---------------|--------------|----------------------------------------|
| id              | UUID          | Ha           | Asosiy kalit                           |
| shop_id         | UUID          | Ha           | Do'kon ID (FK)                         |
| name            | TEXT          | Ha           | Mahsulot nomi                          |
| sale_type       | ENUM          | Ha           | 'unit' (donali) \| 'weight' (kg)       |
| cost_price      | DECIMAL(12,2) | Ha           | Tan narxi (1 dona yoki 1 kg uchun)     |
| selling_price   | DECIMAL(12,2) | Ha           | Sotish narxi (1 dona yoki 1 kg uchun)  |
| profit_per_unit | DECIMAL(12,2) | Hisob        | selling_price − cost_price (avtomatik) |
| quantity        | DECIMAL(12,3) | Ha           | Donali: butun son \| Vazn: kg (3 kasr) |
| low_stock_alert | DECIMAL(12,3) | Ha           | Ogohlantirish chegarasi (dona yoki kg) |
| barcode         | TEXT          | Yo'q         | EAN-13 / QR kod                        |
| image_url       | TEXT          | Ha           | Supabase Storage URL                   |
| image_embedding | VECTOR(512)   | Ha           | CLIP model vektori                     |
| is_active       | BOOLEAN       | Ha           | Mahsulot aktiv/arxivlangan             |
| created_at      | TIMESTAMP     | Ha           | Qo'shilgan vaqt                        |

### 10.2 sales jadvali

| **Maydon**             | **Tur**       | **Majburiy** | **Tavsif**                               |
|------------------------|---------------|--------------|------------------------------------------|
| id                     | UUID          | Ha           | Asosiy kalit                             |
| shop_id                | UUID          | Ha           | Do'kon ID                                |
| product_id             | UUID          | Ha           | Mahsulot ID (FK)                         |
| sale_type              | ENUM          | Ha           | 'unit' \| 'weight' — sotuv vaqtidagi tur |
| quantity_sold          | DECIMAL(12,3) | Ha           | Sotilgan miqdor (dona yoki kg)           |
| cost_price_snapshot    | DECIMAL(12,2) | Ha           | Sotuv paytidagi tan narxi (o'zgarmas)    |
| selling_price_snapshot | DECIMAL(12,2) | Ha           | Sotuv paytidagi sotish narxi             |
| total_revenue          | DECIMAL(12,2) | Ha           | Jami tushum = narx × miqdor              |
| total_profit           | DECIMAL(12,2) | Ha           | Sof foyda = (sotish − tan) × miqdor      |
| search_method          | ENUM          | Ha           | 'barcode' \| 'visual' \| 'manual'        |
| sold_at                | TIMESTAMP     | Ha           | Sotuv vaqti                              |

**Muhim:** *cost_price_snapshot va selling_price_snapshot — narx keyinchalik o'zgarganda eski sotuvlar tarixi va foyda hisoboti buzilmasligi uchun saqlanadi.*

### 10.3 Vizual qidiruv qanday ishlaydi

- Mahsulot qo'shilganda: rasm → Replicate CLIP API → 512-o'lchamli vektor → pgvector ga saqlash.

- Sotuv vaqtida: kamera rasmi → CLIP → vektor → pgvector cosine similarity qidiruvi.

- Top-3 eng o'xshash mahsulot \< 2 soniyada qaytariladi.

- 10,000+ mahsulotda ham HNSW index tezlikni ta'minlaydi.

## 11. Texnik arxitektura (qisqacha)

Quyidagi stack manba TZ da taklif qilingan va PRD da kontekst sifatida keltiriladi. Yakuniy texnik qarorlar muhandislik jamoasi ixtiyorida bo'lib, talablar (5–7 bo'limlar) bajarilishini ta'minlashi shart.

| **Qatlam**         | **Texnologiya**          | **Sababi**                                     |
|--------------------|--------------------------|------------------------------------------------|
| Frontend           | Next.js 14 (App Router)  | SSR + CSR, tez, keng ekotizim                  |
| UI / Styling       | Tailwind CSS + shadcn/ui | Tez, responsive, professional UI               |
| Kamera / Barcode   | react-webcam + zxing-js  | Web kamera API, barcode dekodlash              |
| Vizual AI qidiruv  | CLIP (Replicate API)     | Rasm embedding va similarity qidiruv           |
| Backend / BaaS     | Supabase                 | Auth, DB, Storage, realtime — yagona platforma |
| Ma'lumotlar bazasi | PostgreSQL + pgvector    | Vektor (embedding) qidiruvi                    |
| Rasm saqlash       | Supabase Storage         | Arzon, CDN, integratsiyalangan                 |
| Grafik             | Recharts                 | React uchun qulay grafik kutubxonasi           |
| State              | Zustand + TanStack Query | Global state + server state boshqaruvi         |
| Deploy             | Vercel                   | Next.js uchun optimal                          |

## 12. MVP doirasi va doiradan tashqari (Scope / Out of scope)

### 12.1 MVP doirasi (In scope — Must have)

MVP quyidagi imkoniyatlarni o'z ichiga oladi (manba TZ dagi “Kritik” va “Muhim” xususiyatlar):

- Mahsulot qo'shish (rasm, nom, narxlar, miqdor, sotuv turi, barcode) — Kritik.

- Sotuv turi tizimi: DONALI va VAZN, har biri uchun alohida mantiq — Kritik.

- Barcode skanerlash (EAN/QR, web kamera) — Kritik.

- Vizual AI qidiruv (CLIP) — Kritik.

- Sotuv ekrani (topish, miqdor/vazn kiritish, chek) — Kritik.

- Inventar boshqaruvi (avtomatik kamayish) — Kritik.

- Foyda hisoblash (sotish − tan, avtomatik) — Kritik.

- Mahsulot katalogi (grid/list, qidiruv, filtr) — Muhim.

- Dashboard (kunlik daromad, sof foyda, sotuv soni, kam qolgan mahsulotlar) — Muhim.

- Sotuv tarixi (filtr sana bo'yicha) — Muhim.

- Hisobot (kunlik/haftalik/oylik grafik, top mahsulotlar) — Muhim.

### 12.2 Keyingi bosqich (V2 — Nice to have)

- Ko'p foydalanuvchi / xodim hisobi (cheklangan huquqlar; tan narxini yashirish).

- Qarz daftari — mijozlar krediti.

- Mahsulot tugashi bo'yicha push bildirishnoma.

- Excel / PDF eksport.

- Chegirma va aksiya boshqaruvi.

- Bir nechta do'kon boshqaruvi.

- Ombor boshqaruvi (kirim/chiqim).

### 12.3 Doiradan tashqari (Out of scope — MVP da yo'q)

- Onlayn to'lov (Payme, Click).

- Mijozlar bazasi (CRM).

- Soliq hisoboti.

- Native mobil ilova (iOS/Android).

## 13. Bog'liqliklar va xavflar (Dependencies & Risks)

### 13.1 Bog'liqliklar

| **Bog'liqlik**             | **Turi**                       | **Ta'sir**                                                         |
|----------------------------|--------------------------------|--------------------------------------------------------------------|
| Replicate CLIP API         | Tashqi xizmat                  | Vizual qidiruv to'liq bunga bog'liq; mavjudlik va kechikish kritik |
| Supabase (Auth/DB/Storage) | Tashqi platforma (BaaS)        | Autentifikatsiya, ma'lumotlar, rasm saqlash — markaziy             |
| pgvector + HNSW            | Ma'lumotlar bazasi kengaytmasi | Vektor qidiruv tezligi                                             |
| Vercel                     | Hosting                        | Deploy va frontend yetkazib berish                                 |
| Web kamera API             | Brauzer/qurilma imkoniyati     | Barcode va vizual qidiruv; ruxsat va apparat sifatiga bog'liq      |

### 13.2 Xavflar reestri

| **Xavf**                                                        | **Ehtimol** | **Ta'sir**         | **Yumshatish (Mitigation)**                                                                          |
|-----------------------------------------------------------------|-------------|--------------------|------------------------------------------------------------------------------------------------------|
| Vizual qidiruv aniqligi 90% maqsadiga yetmasligi                | O'rta       | Yuqori             | Sifatli rasm yo'riqnomasi, top-3 ko'rsatish, barcode/manual zaxira yo'li, embeddingni qayta baholash |
| CLIP API kechikishi yoki uzilishi (\< 2s buzilishi)             | O'rta       | Yuqori             | Keshlash, retry, timeout, barcode/manual fallback, javob vaqtini monitoring qilish                   |
| Mobil kamerada barcode ravon ishlamasligi                       | O'rta       | Yuqori             | Qurilmalarda erta sinov, yorug'lik bo'yicha UX maslahatlari, manual kiritish                         |
| Inventar nomuvofiqligi (race condition)                         | Past        | Yuqori             | Atomar tranzaksiya, DB constraint (manfiy emas), serverda tekshirish                                 |
| Tan narxi sotuv jarayonida ko'rinib qolishi                     | Past        | Yuqori (maxfiylik) | UI da qat'iy ajratish, V2 da rol asosidagi cheklov, RLS                                              |
| Doira kengayishi (scope creep) — V2 funksiyalari MVP ga sizishi | O'rta       | O'rta              | Qat'iy MoSCoW, har sprintda doirani qayta tasdiqlash                                                 |
| 10 haftalik jadvalga sig'maslik                                 | O'rta       | O'rta              | Aniq sprint chegaralari, eng kritik 7 funksiyaga ustuvorlik, bufer                                   |
| Yaxlitlash/birlik xatolari (kg vs dona)                         | Past        | Yuqori             | DECIMAL(12,2/3), avtomatlashtirilgan testlar, qabul mezonlari (10-bo'lim)                            |

### 13.3 Taxminlar (Assumptions)

- Foydalanuvchilar internetga ulangan holatda ishlaydi (MVP offline rejimni qo'llab-quvvatlamaydi).

- Foydalanuvchining qurilmasida web kamera mavjud va ruxsat beriladi.

- Beta bosqich uchun 5–10 ta real do'kon jalb qilinadi va fikr-mulohaza beradi.

- MVP da bitta do'kon = bitta egasi (xodim roli V2 da).

### 13.4 Ochiq savollar (Open questions)

| **\#** | **Savol**                                                                                                               | **Mas'ul**        |
|--------|-------------------------------------------------------------------------------------------------------------------------|-------------------|
| OQ-1   | Mahsulot turini (donali ↔ vazn) qo'shilgandan keyin o'zgartirishga ruxsat beriladimi va u tarixga qanday ta'sir qiladi? | Product + Tech    |
| OQ-2   | Vizual qidiruv uchun minimal rasm sifati/yorug'lik bo'yicha qanday yo'riqnoma beriladi?                                 | Product + UX      |
| OQ-3   | Chek raqamli (faqat ekran) bo'ladimi yoki kelajakda chop etish/ulashish kerakmi?                                        | Product           |
| OQ-4   | Bir sotuvda bir nechta mahsulot (savat) MVP da kerakmi yoki bittadan sotuvmi?                                           | Product           |
| OQ-5   | Foyda foizi formulasi tan narxiga (50%) yoki sotish narxiga nisbatan hisoblanadimi? (TZ da ikkala misol uchraydi)       | Product + Finance |

**Eslatma (OQ-5):** *Manba TZ da foyda foizi bir joyda (foyda/tan)×100 = 50% sifatida, boshqa joyda 5,000/15,000 ≈ 33% sifatida keltirilgan. Bu formulani (tan narxiga nisbatan margin yoki sotish narxiga nisbatan) ishlab chiqishdan oldin yakdil belgilash zarur.*

## 14. Bosqichlar va vaqt jadvali (Milestones / Timeline)

MVP 10 haftalik jadval bo'yicha, sprintlar ketma-ketligida yetkaziladi. Har bir sprint aniq, ishlaydigan natija (deliverable) bilan yakunlanadi.

| **Sprint** | **Vaqt**  | **Asosiy ishlar**                                                                   | **Natija**                     |
|------------|-----------|-------------------------------------------------------------------------------------|--------------------------------|
| Sprint 0   | Hafta 1   | Next.js + Supabase sozlash, DB schema (sale_type, narxlar), auth, deploy pipeline   | Bo'sh ilova Vercel da ishlaydi |
| Sprint 1   | Hafta 2–3 | Mahsulot qo'shish ekrani: rasm, toggle, narxlar, foyda preview, katalog ro'yxati    | Mahsulot qo'shsa bo'ladi       |
| Sprint 2   | Hafta 4   | Barcode scanner (zxing-js), manual qidiruv, sotuv ekrani (donali), inventar ayirish | Barcode bilan sotuv ishlaydi   |
| Sprint 3   | Hafta 5   | Vazn sotuvi (kg input, kasr hisob), donali/vazn mantiqni ajratish                   | Kg mahsulot sotsa bo'ladi      |
| Sprint 4   | Hafta 6–7 | CLIP embedding, pgvector, vizual qidiruv UI va API                                  | Rasm orqali qidiruv ishlaydi   |
| Sprint 5   | Hafta 8   | Dashboard (tushum + foyda), sotuv tarixi, oylik grafik (Recharts)                   | To'liq MVP ishlaydi            |
| Sprint 6   | Hafta 9   | Responsive polish (mobil/tablet), QA, bug fix, performance test                     | Barcha qurilmalarda mukammal   |
| Launch     | Hafta 10  | Beta foydalanuvchilar (5–10 do'kon), feedback yig'ish                               | Real do'konlarda ishlaydi      |

### 14.1 Asosiy bosqich nuqtalari (Milestones)

- **M1 — Poydevor tayyor:** Sprint 0 oxiri. Infratuzilma, auth, deploy ishlaydi.

- **M2 — Birinchi sotuv:** Sprint 2 oxiri. Barcode orqali donali sotuv uchma-uch (end-to-end) ishlaydi.

- **M3 — Ikkala tur:** Sprint 3 oxiri. DONALI va VAZN to'liq qo'llab-quvvatlanadi.

- **M4 — AI qidiruv:** Sprint 4 oxiri. Vizual qidiruv aniqlik maqsadiga yetadi.

- **M5 — Funksional MVP:** Sprint 5 oxiri. Dashboard, tarix, hisobot tayyor.

- **M6 — Beta Launch:** Hafta 10. Real do'konlarda sinov boshlanadi.

## 15. MVP qabul qilish mezonlari (Definition of Done)

MVP quyidagi shartlarning barchasi qondirilganda “tayyor” deb hisoblanadi. Har bir shart o'lchanadigan va tekshiriladigan tarzda ifodalangan.

| **\#** | **Shart**                                              | **Tekshirish usuli**   |
|--------|--------------------------------------------------------|------------------------|
| 1      | Donali mahsulot qo'shish 30 soniyadan kam vaqtda       | Vaqt o'lchash          |
| 2      | Vazn mahsulot qo'shish, kg formatida miqdor kiritish   | Qo'lda test            |
| 3      | Tan + sotish narxi kiritiladi, foyda avtomatik chiqadi | Hisoblashni tekshirish |
| 4      | Barcode: mavjud mahsulot 1 soniyada topiladi           | Sekundomer testi       |
| 5      | Vizual qidiruv: to'g'ri mahsulot top-3 da (\> 90%)     | 20 ta rasmli test      |
| 6      | Donali sotilsa dona, vaznli sotilsa kg kamayadi        | DB tekshirish          |
| 7      | Dashboardda bugungi tushum va sof foyda to'g'ri        | Hisob solishtirish     |
| 8      | Mobil (375px) da barcha ekranlar mukammal              | Chrome DevTools        |
| 9      | Desktop (1440px) da barcha ekranlar mukammal           | Brauzer testi          |
| 10     | 30 daqiqalik test sessiyasida crash yo'q               | Stress test            |

## 16. Ilova — atamalar lug'ati (Glossary)

| **Atama**                    | **Izoh**                                                           |
|------------------------------|--------------------------------------------------------------------|
| DONALI (unit)                | Butun sonda sotiladigan mahsulot turi (dona).                      |
| VAZN (weight)                | Kilogramm/grammda, kasr sonda sotiladigan mahsulot turi.           |
| Tan narxi (cost price)       | Do'kon egasi mahsulotni olgan narx (1 birlik uchun).               |
| Sotish narxi (selling price) | Xaridorga sotiladigan narx (1 birlik uchun).                       |
| Sof foyda (net profit)       | Sotish narxi − tan narxi, miqdorga ko'paytirilgan.                 |
| Snapshot narx                | Sotuv paytidagi narxning o'zgarmas nusxasi (tarix uchun).          |
| CLIP                         | Rasmni vektor (embedding) ga aylantiruvchi AI model.               |
| pgvector / HNSW              | PostgreSQL vektor qidiruvi va uni tezlashtiruvchi index.           |
| RLS                          | Row Level Security — har bir do'kon faqat o'z ma'lumotini ko'radi. |
| MVP                          | Minimum Viable Product — eng kichik ishlaydigan mahsulot.          |
| LCP                          | Largest Contentful Paint — sahifa yuklanish tezligi metrikasi.     |
| MoSCoW                       | Ustuvorlik tasnifi: Must / Should / Could / Won't.                 |

*Hujjat oxiri • ShopScan PRD v1.0 • MVP*
