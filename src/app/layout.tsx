import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "uscan — Aqlli Do'kon Boshqaruvi",
  description: "Kichik do'konlar uchun barcode va AI vizual qidiruv tizimi",
  applicationName: "uscan",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "uscan" },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F3D6E",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
