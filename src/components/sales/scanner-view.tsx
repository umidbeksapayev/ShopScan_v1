"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ScanLine, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Native-aware barcode skaner.
 * - Native (Capacitor Android/iOS): apparat ML Kit skaneri (camera2 + apparat
 *   avtofokus, tez/aniq) — `@capacitor-mlkit/barcode-scanning`.
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

interface ScannerViewProps {
  onDetected: (barcode: string) => void;
  paused?: boolean;
}

function NativeScanButton({ onDetected }: { onDetected: (c: string) => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function start() {
    if (busy) return;
    setBusy(true);
    try {
      const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");

      const perm = await BarcodeScanner.requestPermissions();
      if (perm.camera !== "granted" && perm.camera !== "limited") {
        toast.error(t("barcode.cameraDenied"), {
          description: t("barcode.cameraDeniedDesc"),
        });
        return;
      }

      // Android: Google ML Kit barcode moduli kerak bo'lsa o'rnatiladi
      try {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          await BarcodeScanner.installGoogleBarcodeScannerModule();
        }
      } catch {
        /* iOS yoki qo'llab-quvvatlamasa — jim o'tamiz */
      }

      const { barcodes } = await BarcodeScanner.scan();
      const code = barcodes?.[0]?.rawValue;
      if (code) onDetected(code);
    } catch (err) {
      toast.error(t("barcode.cameraError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-accent/40 text-primary transition-colors hover:bg-accent active:scale-[0.99] disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <ScanLine className="h-9 w-9" />
        )}
        <span className="text-sm font-semibold">{t("barcode.scanBtn")}</span>
      </button>
      <p className="text-center text-xs text-muted-foreground">{t("barcode.nativeHint")}</p>
    </div>
  );
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
  if (isNative) return <NativeScanButton onDetected={onDetected} />;
  return <WebBarcodeScanner onDetected={onDetected} paused={paused} />;
}
