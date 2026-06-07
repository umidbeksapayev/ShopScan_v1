"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VisualSearchProps {
  /** base64 data URI (JPEG) bilan chaqiriladi */
  onCapture: (imageDataUri: string) => void;
  /** tashqi qidiruv jarayoni (server embed + match) davom etayotganini bildiradi */
  searching?: boolean;
}

const videoConstraints = {
  facingMode: { ideal: "environment" }, // orqa kamera (mobil)
};

/**
 * Vizual qidiruv: tugma bosilganda bitta kadr olinadi (JPEG, ~640px) va
 * onCapture orqali yuboriladi. CLIP embed + match_products server-side bajariladi.
 */
export function VisualSearch({ onCapture, searching = false }: VisualSearchProps) {
  const webcamRef = useRef<Webcam>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const handleCapture = useCallback(() => {
    // Kichik o'lcham → tezroq yuklash va embed (CLIP baribir 224px ga keltiradi)
    const shot = webcamRef.current?.getScreenshot({ width: 640, height: 480 });
    if (!shot) {
      toast.error("Kamera tayyor emas");
      return;
    }
    onCapture(shot);
  }, [onCapture]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.8}
          videoConstraints={videoConstraints}
          onUserMedia={() => setCameraReady(true)}
          onUserMediaError={() =>
            toast.error("Kameraga ruxsat berilmadi", {
              description: "Brauzer sozlamalaridan kamerani yoqing.",
            })
          }
          className="h-full w-full object-cover"
        />
        {/* Markazlash ramkasi */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-2/3 w-2/3 rounded-xl border-2 border-dashed border-white/60" />
        </div>
      </div>

      <p className="text-center text-xs text-gray-500">
        Mahsulotni ramka ichiga joylang va suratga oling
      </p>

      <button
        type="button"
        onClick={handleCapture}
        disabled={!cameraReady || searching}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {searching ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Qidirilmoqda...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" /> Rasmga qidirish
          </>
        )}
      </button>
    </div>
  );
}
