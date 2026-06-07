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
};

export default nextConfig;
