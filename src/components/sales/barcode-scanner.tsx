"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { BrowserMultiFormatReader } from "@zxing/library";
import { ScanLine, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
}

const videoConstraints = {
  facingMode: { ideal: "environment" }, // orqa kamera (mobil)
};

/**
 * Tap-to-scan: foydalanuvchi tugmani bosganda bitta kadr olinadi va zxing bilan dekod qilinadi.
 */
export function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const handleScan = useCallback(async () => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) {
      toast.error("Kamera tayyor emas");
      return;
    }

    setScanning(true);
    try {
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      const result = await readerRef.current.decodeFromImageUrl(shot);
      onDetected(result.getText());
    } catch {
      toast.error("Barcode topilmadi", {
        description: "Qaytadan urinib ko'ring yoki qo'lda qidiring.",
      });
    } finally {
      setScanning(false);
    }
  }, [onDetected]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={() => setCameraReady(true)}
          onUserMediaError={() =>
            toast.error("Kameraga ruxsat berilmadi", {
              description: "Brauzer sozlamalaridan kamerani yoqing.",
            })
          }
          className="h-full w-full object-cover"
        />
        {/* Skanerlash ramkasi */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-1/3 w-3/4 rounded-lg border-2 border-white/70" />
        </div>
      </div>

      <button
        type="button"
        onClick={handleScan}
        disabled={!cameraReady || scanning}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {scanning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Skanerlanmoqda...
          </>
        ) : (
          <>
            <ScanLine className="h-5 w-5" /> Skanerlash
          </>
        )}
      </button>
    </div>
  );
}
