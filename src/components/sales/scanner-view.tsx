"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * Native-aware barcode skaner.
 * - Native (Capacitor Android): EMBEDDED ML Kit skaner (kamera yuqorida "deraza",
 *   pastda savat ro'yxati — Zoho/POS uslubi). To'liq-ekran modal EMAS.
 * - Web/brauzer: mavjud `BarcodeScanner` (getUserMedia + BarcodeDetector/wasm).
 *
 * Capacitor importlari faqat klient + dinamik — Vercel web build'iga ta'sir qilmaydi.
 */

const CameraLoading = () => (
  <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
    …
  </div>
);

const WebBarcodeScanner = dynamic(
  () => import("@/components/sales/barcode-scanner").then((m) => m.BarcodeScanner),
  { ssr: false, loading: () => <CameraLoading /> }
);

const NativeEmbeddedScanner = dynamic(
  () =>
    import("@/components/sales/native-embedded-scanner").then(
      (m) => m.NativeEmbeddedScanner
    ),
  { ssr: false, loading: () => <CameraLoading /> }
);

interface ScannerViewProps {
  onDetected: (barcode: string) => void;
  paused?: boolean;
}

export function ScannerView({ onDetected, paused }: ScannerViewProps) {
  // Native ekanini faqat mount'dan keyin aniqlaymiz (SSR'da Capacitor chaqirilmaydi).
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (active) setIsNative(Capacitor.isNativePlatform());
      } catch {
        if (active) setIsNative(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (isNative === null) return <CameraLoading />;
  if (isNative) return <NativeEmbeddedScanner onDetected={onDetected} paused={paused} />;
  return <WebBarcodeScanner onDetected={onDetected} paused={paused} />;
}
