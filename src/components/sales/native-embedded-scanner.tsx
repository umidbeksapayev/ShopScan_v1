"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ScanLine, X, Zap, ZapOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { scanFeedback } from "@/lib/scan-feedback";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency, formatWeight } from "@/lib/utils";

/**
 * Native (Android) EMBEDDED ML Kit barcode skaner — Zoho/POS uslubi (bug #4).
 *
 * `@capacitor-mlkit/barcode-scanning` ning UZLUKSIZ `startScan()` rejimi: kamera
 * WebView ORQASIDA chiziladi. To'liq-ekran modal o'rniga: yuqorida kameraga
 * "deraza" (yashil ramka), pastda jonli SAVAT ro'yxati + jami. Bir barcode
 * o'qilgach beep/tebranish + `onDetected`. AddToCartDialog ochilganda (`paused`)
 * kamera vaqtincha to'xtaydi (dialog ko'rinsin), yopilgach avtomatik davom etadi.
 *
 * Capacitor importlari DINAMIK — Vercel web build'iga ta'sir qilmaydi.
 */

type MlkitModule = typeof import("@capacitor-mlkit/barcode-scanning");

interface Props {
  onDetected: (barcode: string) => void;
  /** AddToCartDialog ochiq — kamerani vaqtincha to'xtatamiz. */
  paused?: boolean;
}

/** Bir xil kodning ketma-ket qayta o'qilishini cheklash. */
const COOLDOWN_MS = 1500;

export function NativeEmbeddedScanner({ onDetected, paused = false }: Props) {
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const totalRevenue = useCartStore((s) => s.totalRevenue);

  const [session, setSession] = useState(false); // foydalanuvchi skanerni yoqdi
  const [scanningNow, setScanningNow] = useState(false); // kamera ayni paytda ishlayapti
  const [starting, setStarting] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const moduleRef = useRef<MlkitModule | null>(null);
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null);
  const lastRef = useRef<{ value: string; at: number } | null>(null);
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);
  useEffect(() => setMounted(true), []);

  const loadModule = useCallback(async () => {
    if (!moduleRef.current) {
      moduleRef.current = await import("@capacitor-mlkit/barcode-scanning");
    }
    return moduleRef.current;
  }, []);

  const exitCamera = useCallback(async () => {
    try {
      await listenerRef.current?.remove();
    } catch {
      /* */
    }
    listenerRef.current = null;
    const mod = moduleRef.current;
    if (mod) {
      try {
        await mod.BarcodeScanner.stopScan();
      } catch {
        /* */
      }
    }
    document.documentElement.classList.remove("barcode-scanner-active");
    document.body.classList.remove("barcode-scanner-active");
    setScanningNow(false);
    setTorchOn(false);
  }, []);

  const enterCamera = useCallback(async () => {
    setStarting(true);
    try {
      const mod = await loadModule();
      const { BarcodeScanner, BarcodeFormat } = mod;

      const perm = await BarcodeScanner.requestPermissions();
      if (perm.camera !== "granted" && perm.camera !== "limited") {
        toast.error(t("barcode.cameraDenied"), {
          description: t("barcode.cameraDeniedDesc"),
        });
        setSession(false);
        return;
      }

      listenerRef.current = await BarcodeScanner.addListener(
        "barcodesScanned",
        (event: { barcodes: { rawValue?: string }[] }) => {
          const code = event.barcodes?.[0]?.rawValue;
          if (!code) return;
          const now = Date.now();
          const last = lastRef.current;
          if (last && last.value === code && now - last.at < COOLDOWN_MS) return;
          lastRef.current = { value: code, at: now };
          scanFeedback();
          onDetectedRef.current(code);
        }
      );

      // Sahifani yashirib, kamerani WebView orqasida ko'rsatamiz (globals.css).
      document.documentElement.classList.add("barcode-scanner-active");
      document.body.classList.add("barcode-scanner-active");

      await BarcodeScanner.startScan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Code128,
          BarcodeFormat.Code39,
          BarcodeFormat.Itf,
          BarcodeFormat.QrCode,
        ],
      });
      setScanningNow(true);
    } catch (err) {
      toast.error(t("barcode.cameraError"), {
        description: err instanceof Error ? err.message : undefined,
      });
      await exitCamera();
      setSession(false);
    } finally {
      setStarting(false);
    }
  }, [loadModule, exitCamera, t]);

  // Sessiya + paused holatiga qarab kamerani yoqamiz/to'xtatamiz.
  useEffect(() => {
    if (session && !paused && !scanningNow && !starting) {
      void enterCamera();
    } else if (scanningNow && (paused || !session)) {
      void exitCamera();
    }
  }, [session, paused, scanningNow, starting, enterCamera, exitCamera]);

  // Komponent yo'q qilinganda kamerani to'liq to'xtatamiz.
  useEffect(() => {
    return () => {
      void exitCamera();
    };
  }, [exitCamera]);

  const toggleTorch = useCallback(async () => {
    const mod = moduleRef.current;
    if (!mod) return;
    try {
      if (torchOn) await mod.BarcodeScanner.disableTorch();
      else await mod.BarcodeScanner.enableTorch();
      setTorchOn(!torchOn);
    } catch {
      toast.error(t("barcode.torchError"));
    }
  }, [torchOn, t]);

  // ===== Boshlang'ich holat: katta "Skanerlash" tugmasi =====
  if (!session) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSession(true)}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-accent/40 text-primary transition-colors hover:bg-accent active:scale-[0.99]"
        >
          <ScanLine className="h-9 w-9" />
          <span className="text-sm font-semibold">{t("barcode.scanBtn")}</span>
        </button>
        <p className="text-center text-xs text-muted-foreground">{t("barcode.nativeHint")}</p>
      </div>
    );
  }

  const total = totalRevenue();

  // ===== Kamera ishlayotganda: shaffof overlay (portal → body) =====
  const overlay =
    scanningNow && mounted
      ? createPortal(
          <div className="uscan-scan-overlay fixed inset-0 z-[70] flex flex-col">
            {/* Yuqori: shaffof kamera "derazasi" */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-36 w-4/5 max-w-sm rounded-xl border-2 border-green-400/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
              </div>

              <button
                type="button"
                onClick={() => setSession(false)}
                aria-label={t("common.close")}
                className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70"
              >
                <X className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={toggleTorch}
                aria-label={torchOn ? t("barcode.torchOff") : t("barcode.torchOn")}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70"
              >
                {torchOn ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
              </button>

              <p className="absolute inset-x-0 bottom-4 px-6 text-center text-sm font-medium text-white drop-shadow">
                {items.length === 0 ? t("barcode.alignHint") : t("barcode.scanMoreHint")}
              </p>
            </div>

            {/* Past: opaque savat paneli (kamerani yopadi) */}
            <div className="flex max-h-[46vh] flex-col rounded-t-3xl bg-background shadow-2xl">
              <div className="flex items-center justify-between px-4 pb-2 pt-3">
                <span className="text-sm font-semibold text-foreground">{t("cart.title")}</span>
                <span className="text-xs text-muted-foreground">
                  {items.length} {t("common.pcs")}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                {items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t("cart.emptyHint")}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {items.map((i) => {
                      const qty =
                        i.product.sale_type === "weight"
                          ? formatWeight(i.quantity)
                          : `${i.quantity} ${t("common.pcs")}`;
                      return (
                        <li key={i.product.id} className="flex items-center gap-2 py-2">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {i.product.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {qty}
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatCurrency(i.product.selling_price * i.quantity)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="space-y-2 border-t border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("cart.total")}</span>
                  <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSession(false)}
                  className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground active:scale-[0.99]"
                >
                  {t("barcode.done")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  // Sessiya bor, lekin kamera hozir o'chiq (paused/dialog yoki ishga tushyapti).
  return (
    <>
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-accent/40 text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      {overlay}
    </>
  );
}
