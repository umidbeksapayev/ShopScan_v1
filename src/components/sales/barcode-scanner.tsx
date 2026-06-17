"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarcodeDetector as BarcodeDetectorPonyfill } from "barcode-detector/ponyfill";
import { ScanLine, Zap, ZapOff, ZoomIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  /** Dialog ochiq bo'lganda skanni vaqtincha to'xtatadi (qayta qo'shilishni oldini oladi). */
  paused?: boolean;
}

type ScanMode = "auto" | "manual";

/** Bir xil barcode'ning ketma-ket qayta o'qilishini cheklash. */
const COOLDOWN_MS = 2000;

// Do'konda uchraydigan formatlar (BarcodeDetector spec — kichik harf, snake_case).
// Keng qamrov: ITF (10/14 raqamli), code_93, codabar va data_matrix ham qo'shildi —
// tez ilovalar kabi "g'alati" va sof-raqamli barcode'lar ham o'qiladi.
const FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "itf",
  "qr_code",
  "data_matrix",
] as const;

interface DetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string; format?: string }[]>;
}
type DetectorCtor = new (o: { formats: readonly string[] }) => DetectorLike;

/**
 * Detektor yaratadi: Android Chrome/WebView'da NATIVE `BarcodeDetector` (apparat,
 * past sifatli kamerada ham < 1s) ishlatiladi; mavjud bo'lmasa (iOS Safari va h.k.)
 * `barcode-detector` ponyfill (zxing-wasm) ga tushadi.
 */
function createDetector(): DetectorLike {
  const w = window as unknown as { BarcodeDetector?: DetectorCtor };
  if (typeof w.BarcodeDetector === "function") {
    try {
      return new w.BarcodeDetector({ formats: FORMATS });
    } catch {
      /* native qurib bo'lmadi — ponyfill'ga tushamiz */
    }
  }
  const Ponyfill = BarcodeDetectorPonyfill as unknown as DetectorCtor;
  return new Ponyfill({ formats: FORMATS });
}

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
 * Tez barcode skaneri — NATIVE BarcodeDetector (apparat) + zxing-wasm fallback.
 * Kadrlar requestAnimationFrame bilan tekshiriladi (busy-guard: bir vaqtda bitta
 * detect). Avto: cooldown bilan dublikat oldini oladi. Qo'lda: keyingi aniqlangan
 * kodni qabul qiladi. Torch (flash) + haptik feedback.
 */
export function BarcodeScanner({ onDetected, paused = false }: BarcodeScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modeRef = useRef<ScanMode>("auto");
  const armedRef = useRef(false); // qo'lda rejim: keyingi aniqlanishni qabul qilish
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const onDetectedRef = useRef(onDetected);
  const pausedRef = useRef(paused);
  const zoomRangeRef = useRef({ min: 1, max: 1, step: 0.1 });
  // 1D barcode'ni qabul qilishdan oldin ketma-ket bir xil o'qishlar (noto'g'ri o'qish himoyasi)
  const confirmRef = useRef<{ value: string; count: number }>({ value: "", count: 0 });

  const [mode, setMode] = useState<ScanMode>("auto");
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const acceptResult = useCallback((text: string) => {
    if (pausedRef.current) return;
    const now = Date.now();

    if (modeRef.current === "auto") {
      const last = lastScanRef.current;
      if (last && last.value === text && now - last.at < COOLDOWN_MS) return;
      lastScanRef.current = { value: text, at: now };
    } else {
      if (!armedRef.current) return;
      armedRef.current = false;
    }

    playBeep();
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(80);
    }
    onDetectedRef.current(text);
  }, []);

  // Kamera + uzluksiz detektsiya tsiklini bir marta ishga tushiramiz.
  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let busy = false;

    (async () => {
      try {
        if (typeof window !== "undefined" && !window.isSecureContext) {
          toast.error(t("barcode.cameraDenied"), {
            description: t("barcode.insecureContext"),
          });
          return;
        }

        // Orqa kamera, YUQORI resolution (kichik barcode'da ko'p piksel) +
        // boshlang'ich so'rovning o'zida uzluksiz avtofokus.
        const videoConstraints = {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }],
        } as unknown as MediaTrackConstraints;
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setCameraReady(true);

        // Kamera imkoniyatlari: torch (flash) + uzluksiz avtofokus + zoom
        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
          torch?: boolean;
          focusMode?: string[];
          zoom?: { min: number; max: number; step: number };
        };
        setTorchSupported(Boolean(caps.torch));
        if (track && Array.isArray(caps.focusMode) && caps.focusMode.includes("continuous")) {
          try {
            await track.applyConstraints({
              advanced: [{ focusMode: "continuous" }],
            } as unknown as MediaTrackConstraints);
          } catch {
            /* fokus rejimi qo'llab-quvvatlanmasa jim o'tadi */
          }
        }
        // Zoom — kichik barcode'ni telefonni juda yaqinlashtirmasdan kattalashtirish
        if (caps.zoom && typeof caps.zoom.max === "number" && caps.zoom.max > caps.zoom.min) {
          zoomRangeRef.current = {
            min: caps.zoom.min,
            max: caps.zoom.max,
            step: caps.zoom.step || 0.1,
          };
          setZoom(caps.zoom.min);
          setZoomSupported(true);
        }

        const detector = createDetector();

        const scan = async () => {
          if (cancelled) return;
          if (!busy && !pausedRef.current && video.readyState >= 2) {
            busy = true;
            try {
              const codes = await detector.detect(video);
              const hit = codes && codes.length > 0 ? codes[0] : null;
              if (hit && hit.rawValue) {
                const is2D =
                  hit.format === "qr_code" ||
                  hit.format === "data_matrix" ||
                  hit.format === "pdf417" ||
                  hit.format === "aztec";
                if (is2D) {
                  // 2D (QR/DataMatrix) — xato tuzatish bor, darhol qabul
                  acceptResult(hit.rawValue);
                } else {
                  // 1D — loyqa kadrdagi noto'g'ri o'qishni oldini olish uchun
                  // ketma-ket 2 marta BIR XIL qiymat o'qilsagina qabul qilamiz.
                  const c = confirmRef.current;
                  if (c.value === hit.rawValue) {
                    c.count += 1;
                  } else {
                    confirmRef.current = { value: hit.rawValue, count: 1 };
                  }
                  if (confirmRef.current.count >= 2) {
                    const confirmed = confirmRef.current.value;
                    confirmRef.current = { value: "", count: 0 };
                    acceptResult(confirmed);
                  }
                }
              }
            } catch {
              /* o'tkinchi dekod xatosi — keyingi kadrda qayta urinamiz */
            }
            busy = false;
          }
          if (!cancelled) raf = requestAnimationFrame(scan);
        };
        raf = requestAnimationFrame(scan);
      } catch (err) {
        if (cancelled) return;
        const name =
          err && typeof err === "object" && "name" in err
            ? String((err as { name: unknown }).name)
            : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          toast.error(t("barcode.cameraDenied"), {
            description: t("barcode.cameraDeniedDesc"),
          });
        } else {
          toast.error(t("barcode.cameraError"), {
            description: t("barcode.cameraErrorDesc"),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
    // t faqat xato toast'lari uchun — til o'zgarganda kamerani qayta ishga
    // tushirmaslik uchun deps'ga qo'shilmaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptResult]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {
      toast.error(t("barcode.torchError"));
    }
  }, [torchOn, t]);

  const applyZoom = useCallback(async (z: number) => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    setZoom(z); // slider darhol javob bersin
    try {
      await track.applyConstraints({
        advanced: [{ zoom: z }],
      } as unknown as MediaTrackConstraints);
    } catch {
      /* zoom qo'llab-quvvatlanmasa jim o'tadi */
    }
  }, []);

  // Ekranga bosib fokuslash (web AF dangasa bo'lganda yordam beradi).
  const handleTapFocus = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setFocusPoint({ x: px, y: py });
    window.setTimeout(() => setFocusPoint(null), 700);

    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const nx = Math.min(1, Math.max(0, px / rect.width));
    const ny = Math.min(1, Math.max(0, py / rect.height));
    (async () => {
      try {
        // Tanlangan nuqtaga bir martalik fokus, so'ng uzluksizga qaytamiz.
        await track.applyConstraints({
          advanced: [{ pointsOfInterest: [{ x: nx, y: ny }], focusMode: "single-shot" }],
        } as unknown as MediaTrackConstraints);
        window.setTimeout(() => {
          track
            .applyConstraints({
              advanced: [{ focusMode: "continuous" }],
            } as unknown as MediaTrackConstraints)
            .catch(() => {});
        }, 1500);
      } catch {
        /* tap-to-focus qo'llab-quvvatlanmasa jim o'tadi */
      }
    })();
  }, []);

  const armManualScan = useCallback(() => {
    armedRef.current = true;
    window.setTimeout(() => {
      armedRef.current = false;
    }, 4000);
    toast.info(t("barcode.alignNow"));
  }, [t]);

  return (
    <div className="space-y-3">
      <div
        onClick={handleTapFocus}
        className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-black"
      >
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

        {/* Tap-to-focus halqasi */}
        {focusPoint && (
          <span
            className="pointer-events-none absolute z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow"
            style={{ left: focusPoint.x, top: focusPoint.y }}
          />
        )}

        {/* Torch tugmasi */}
        {cameraReady && torchSupported && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTorch();
            }}
            aria-label={torchOn ? t("barcode.torchOff") : t("barcode.torchOn")}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
          >
            {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
          </button>
        )}

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            {t("barcode.cameraLoading")}
          </div>
        )}
      </div>

      {/* Zoom — kichik barcode'ni kattalashtirish (qo'llab-quvvatlansa) */}
      {cameraReady && zoomSupported && (
        <div className="flex items-center gap-2 px-1">
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={zoomRangeRef.current.min}
            max={zoomRangeRef.current.max}
            step={zoomRangeRef.current.step}
            value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            aria-label={t("barcode.zoom")}
            className="h-1.5 flex-1 cursor-pointer accent-primary"
          />
        </div>
      )}

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
          {t("barcode.autoScan")}
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
          {t("barcode.manual")}
        </button>
      </div>

      {mode === "manual" ? (
        <button
          type="button"
          onClick={armManualScan}
          disabled={!cameraReady}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <ScanLine className="h-5 w-5" /> {t("barcode.scanBtn")}
        </button>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          {t("barcode.alignHint")}
        </p>
      )}
    </div>
  );
}
