import type { MetadataRoute } from "next";

// PWA manifest — /manifest.webmanifest sifatida beriladi. Ilova o'rnatiladigan
// bo'ladi (Add to Home Screen) va to'liq ekranda ishlaydi.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "uscan — Do'kon boshqaruvi",
    short_name: "uscan",
    description: "Kichik do'konlar uchun POS: barcode, sotuv, hisobot",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0F3D6E",
    lang: "uz",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
