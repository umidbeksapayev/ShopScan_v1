import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor — uscan'ni native Android qobig'iga o'rash.
 *
 * Next.js SSR ilova bo'lgani uchun statik export emas, balki PRODUCTION URL
 * native WebView'da yuklanadi (server.url). Shunda ilovaning o'zi o'zgarmaydi
 * (Vercel'da qoladi), faqat BARCODE skaner native ML Kit'ga o'tadi —
 * apparat kamera + avtofokus + tez/aniq dekod (native sifat).
 *
 * URL'ni o'z production domeningizga moslang (custom domen bo'lsa o'shaniki).
 */
const config: CapacitorConfig = {
  appId: "uz.shopscan.app",
  appName: "uscan",
  // server.url ishlatilganda bundle shart emas, lekin Capacitor webDir talab qiladi.
  webDir: "public",
  server: {
    url: "https://www.uscan.uz",
    cleartext: false,
  },
  plugins: {
    // Ochilishda oq miltillashni yo'qotadi: web tayyor bo'lguncha brend splash
    // ko'rinadi (SplashHider komponenti uni yashiradi). launchAutoHide:false —
    // web yuklanmaguncha splash turadi (sekin tarmoqda ham toza ko'rinish).
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0F3D6E",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
