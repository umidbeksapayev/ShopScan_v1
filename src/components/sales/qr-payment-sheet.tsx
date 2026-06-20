"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Loader2, CheckCircle2, XCircle, QrCode as QrIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import {
  createPaymentIntent,
  getIntentStatus,
  markIntentFinalized,
} from "@/lib/acquiring/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Phase = "creating" | "waiting" | "paid" | "error";

interface QrPaymentSheetProps {
  open: boolean;
  shopId: string;
  items: { product_id: string; quantity: number }[];
  amount: number;
  searchMethod: string;
  /** Intent va sotuv idempotentligi uchun yagona kalit. */
  clientId: string;
  /** To'lov tasdiqlangach — ota sotuvni yakunlaydi (process_sale_cart). */
  onPaid: (intentId: string) => void;
  onClose: () => void;
}

const POLL_MS = 3000;
const MAX_WAIT_MS = 5 * 60 * 1000; // 5 daqiqa

export function QrPaymentSheet({
  open,
  shopId,
  items,
  amount,
  searchMethod,
  clientId,
  onPaid,
  onClose,
}: QrPaymentSheetProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("creating");
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Bir clientId uchun intent faqat bir marta yaratilsin
  const startedRef = useRef<string | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!open) {
      // Yopilganda keyingi ochilishga tayyorlanamiz
      startedRef.current = null;
      doneRef.current = false;
      setPhase("creating");
      setQrSrc(null);
      setErrorMsg(null);
      return;
    }
    if (startedRef.current === clientId) return;
    startedRef.current = clientId;
    doneRef.current = false;

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const deadline = Date.now() + MAX_WAIT_MS;

    async function start() {
      try {
        const { intentId, payUrl } = await createPaymentIntent({
          shopId,
          items,
          amount,
          searchMethod,
          clientId,
        });
        const dataUrl = await QRCode.toDataURL(payUrl, { width: 240, margin: 1 });
        if (doneRef.current) return;
        setQrSrc(dataUrl);
        setPhase("waiting");

        pollTimer = setInterval(async () => {
          if (doneRef.current) return;
          if (Date.now() > deadline) {
            doneRef.current = true;
            if (pollTimer) clearInterval(pollTimer);
            setPhase("error");
            setErrorMsg(t("qr.expired"));
            return;
          }
          try {
            const { status } = await getIntentStatus(intentId);
            if (status === "paid") {
              doneRef.current = true;
              if (pollTimer) clearInterval(pollTimer);
              setPhase("paid");
              void markIntentFinalized(intentId);
              onPaid(intentId);
            } else if (
              status === "canceled" ||
              status === "failed" ||
              status === "expired"
            ) {
              doneRef.current = true;
              if (pollTimer) clearInterval(pollTimer);
              setPhase("error");
              setErrorMsg(t("qr.failed"));
            }
          } catch {
            // tarmoq uzilishi — keyingi pollda qayta urinamiz
          }
        }, POLL_MS);
      } catch (err) {
        if (doneRef.current) return;
        setPhase("error");
        setErrorMsg(
          err instanceof Error && err.message === "acquiring_not_configured"
            ? t("qr.notConfigured")
            : t("qr.createFailed")
        );
      }
    }

    void start();
    return () => {
      doneRef.current = true;
      if (pollTimer) clearInterval(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrIcon className="h-5 w-5" /> {t("qr.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("cart.total")}</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(amount)}
            </p>
          </div>

          {phase === "creating" && (
            <div className="flex h-[240px] w-[240px] items-center justify-center rounded-xl border border-dashed">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {phase === "waiting" && qrSrc && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="QR"
                width={240}
                height={240}
                className="rounded-xl border bg-white p-2"
              />
              <p className="flex items-center gap-1.5 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("qr.waiting")}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {t("qr.scanHint")}
              </p>
            </>
          )}

          {phase === "paid" && (
            <div className="flex flex-col items-center gap-2 py-6 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-14 w-14" />
              <p className="font-semibold">{t("qr.paid")}</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-2 py-6 text-destructive">
              <XCircle className="h-14 w-14" />
              <p className="text-center text-sm">{errorMsg ?? t("qr.failed")}</p>
            </div>
          )}
        </div>

        {phase !== "paid" && (
          <Button variant="outline" onClick={onClose} className="w-full">
            {t("common.cancel")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
