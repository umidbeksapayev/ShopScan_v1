"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { ScanLine, Zap, ZapOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
}

type ScanMode = "auto" | "manual";

/** Bir xil barcode'ning ketma-ket qayta o'qilishini cheklash (Flutter cooldown mantig'i). */
const COOLDOWN_MS = 2000;

/** Muvaffaqiyatli skan uchun qisqa "beep" ovozi (Web Audio — qo'shimcha fayl shart emas). */
function playBeep(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close();
  } catch {
    /* ovoz qo'llab-quvvatlanmasa jim o'tadi */
  }
}

/**
 * Uzluksiz (avto) yoki qo'lda barcode skaneri.
 * - Avto: kameradan uzluksiz dekod, cooldown bilan dublikat oldini oladi.
 * - Qo'lda: foydalanuvchi "Skanerlash" bosgandagi keyingi aniqlangan kodni qabul qiladi.
 * Qo'shimcha: torch (flash) toggle va haptik (vibratsiya) feedback.
 */
export function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const modeRef = useRef<ScanMode>("auto");
  const armedRef = useRef(false); // qo'lda rejim: keyingi aniqlanishni qabul qilish
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const onDetectedRef = useRef(onDetected);

  const [mode, setMode] = useState<ScanMode>("auto");
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // Eng so'nggi callback va rejimni ref'da saqlaymiz (decoder qayta yaratilmasin).
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const acceptResult = useCallback((text: string) => {
    const now = Date.now();

    if (modeRef.current === "auto") {
      const last = lastScanRef.current;
      if (last && last.value === text && now - last.at < COOLDOWN_MS) return;
      lastScanRef.current = { value: text, at: now };
    } else {
      if (!armedRef.current) return;
      armedRef.current = false;
    }

    // Ovozli + haptik feedback (muvaffaqiyatli skan).
    playBeep();
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(80);
    }

    onDetectedRef.current(text);
  }, []);

  // Kamera + uzluksiz dekoderni bir marta ishga tushiramiz.
  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    (async () => {
      try {
        await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (result) acceptResult(result.getText());
          }
        );
        if (cancelled) return;
        setCameraReady(true);

        // Torch (flash) qo'llab-quvvatlanadimi?
        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks?.()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
          torch?: boolean;
        };
        setTorchSupported(Boolean(caps.torch));
      } catch {
        if (!cancelled) {
          toast.error("Kameraga ruxsat berilmadi", {
            description: "Brauzer sozlamalaridan kamerani yoqing.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        reader.reset();
      } catch {
        /* ignore */
      }
      readerRef.current = null;
    };
  }, [acceptResult]);

  const toggleTorch = useCallback(async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {
      toast.error("Flashni boshqarib bo'lmadi");
    }
  }, [torchOn]);

  const armManualScan = useCallback(() => {
    armedRef.current = true;
    // 4 soniyada aniqlanmasa, qaytadan bosish kerak.
    window.setTimeout(() => {
      armedRef.current = false;
    }, 4000);
    toast.info("Barcode'ni ramkaga to'g'rilang");
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {/* Skanerlash ramkasi */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "h-1/3 w-3/4 rounded-lg border-2",
              mode === "auto" ? "border-green-400/80" : "border-white/70"
            )}
          />
        </div>

        {/* Torch tugmasi */}
        {cameraReady && torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? "Flashni o'chirish" : "Flashni yoqish"}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
          >
            {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
          </button>
        )}

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            Kamera yuklanmoqda...
          </div>
        )}
      </div>

      {/* Rejim almashtirgich */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("auto")}
          className={cn(
            "flex-1 rounded-lg border py-2 text-sm font-medium transition",
            mode === "auto"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-muted"
          )}
        >
          Avto skan
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={cn(
            "flex-1 rounded-lg border py-2 text-sm font-medium transition",
            mode === "manual"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-muted"
          )}
        >
          Qo&apos;lda
        </button>
      </div>

      {mode === "manual" ? (
        <button
          type="button"
          onClick={armManualScan}
          disabled={!cameraReady}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <ScanLine className="h-5 w-5" /> Skanerlash
        </button>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Barcode'ni ramkaga to&apos;g&apos;rilang — avtomatik o&apos;qiladi
        </p>
      )}
    </div>
  );
}
