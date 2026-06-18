import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor — ShopScan'ni native Android qobig'iga o'rash.
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
  appName: "ShopScan",
  // server.url ishlatilganda bundle shart emas, lekin Capacitor webDir talab qiladi.
  webDir: "public",
  server: {
    url: "https://shop-scan-v1.vercel.app",
    cleartext: false,
  },
};

export default config;
