import withSerwistInit from "@serwist/next";

// PWA: service worker'ni src/app/sw.ts dan public/sw.js ga kompilyatsiya qiladi.
// Dev'da o'chiq (kesh chalkashligini oldini olish).
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Rasmlar yuklashda WebP (≤1024px) ga siqiladi → Next optimizer keraksiz.
    // To'g'ridan-to'g'ri Supabase CDN'dan beriladi (tezroq, sharp talab qilmaydi).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  // Production build'da konsol loglarini olib tashlash (kichik tezlik + toza)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  // Transformers.js (brauzerda CLIP) — Node-only bog'liqliklarni brauzer build'idan chiqarish
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default withSerwist(nextConfig);
