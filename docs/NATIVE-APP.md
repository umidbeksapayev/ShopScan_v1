# uscan — Native ilova (Android, Capacitor + ML Kit)

Web ilova brauzer cheklovlari (zaif kamera fokusi, in-app oynada apparat barcode dvigateli yo'q)
sababli native skaner tezligiga yeta olmaydi. Bu qo'llanma uscan'ni **native Android ilova**
qilib o'rashni ko'rsatadi — barcode **Google ML Kit** (apparat camera2 + avtofokus) bilan o'qiladi.

## Qanday ishlaydi

- Ilovaning o'zi **o'zgarmaydi** — native qobiq production URL'ni (`https://shop-scan-v1.vercel.app`)
  WebView'da yuklaydi (`capacitor.config.ts` → `server.url`).
- Faqat **barcode skaner** native bo'ladi: ilova `Capacitor.isNativePlatform()` ni aniqlab,
  native'da `@capacitor-mlkit/barcode-scanning` (apparat) ishlatadi; brauzerda esa eski web skaner.
- Web'da yangilanish: Vercel'ga deploy qilsangiz, native ilova ham yangi versiyani ko'radi
  (qayta build shart emas). Faqat **native sozlama** o'zgarsa (plugin/permission) qayta build kerak.

## Talablar (sizning kompyuteringizda)

- Node.js (mavjud)
- **Android Studio** + Android SDK + JDK 17
- Android telefon (USB debugging yoniq) yoki emulyator

## Bir martalik sozlash

```bash
# 1. Paketlarni o'rnatish (capacitor allaqachon package.json'da)
npm install

# 2. Android loyihasini yaratish (android/ papkasi paydo bo'ladi)
npm run cap:add:android

# 3. Sinxronlash
npm run cap:sync
```

### AndroidManifest sozlamasi
`android/app/src/main/AndroidManifest.xml` da quyidagilar borligini tekshiring:

```xml
<!-- <manifest> ichida -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- <application> ichida: ML Kit barcode modulini avtomatik yuklash -->
<meta-data
  android:name="com.google.mlkit.vision.DEPENDENCIES"
  android:value="barcode_ui" />
```

(CAMERA ruxsatini plugin odatda o'zi qo'shadi; bo'lmasa qo'lda qo'shing.)

## Ishga tushirish / APK

```bash
# Android Studio'da ochish (Run tugmasi bilan telefon/emulyatorga)
npm run cap:open

# YOKI buyruq qatorida debug APK yig'ish:
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Play Store / release uchun: Android Studio → Build → Generate Signed Bundle/APK (keystore bilan).

## URL ni o'zgartirish

Custom domen ishlatsangiz `capacitor.config.ts` → `server.url` ni o'shanga moslang, so'ng `npm run cap:sync`.

## iOS (keyinroq)

Xuddi shu plugin iOS'da ham ishlaydi: `npx cap add ios` + Xcode (Mac kerak) + `Info.plist`'ga
`NSCameraUsageDescription`. Hozircha Android'ga e'tibor qaratdik (foydalanuvchilar ~Android).

## Eslatma

- `android/` papkasini git'ga qo'shsangiz bo'ladi (sozlamalar versiyalanadi). `cap add android`
  o'zi ichki `.gitignore` (build artefaktlar) yaratadi.
- Birinchi skanda ML Kit barcode moduli Play Services orqali bir marta yuklanadi (internet kerak).
