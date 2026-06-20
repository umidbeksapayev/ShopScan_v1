"use client";

import { useEffect, useState } from "react";
import { QrCode, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { AcquiringProviderType, Shop } from "@/types/database";
import {
  acquiringHasCredentials,
  saveAcquiringConfig,
  paymeWebhookUrl,
} from "@/lib/acquiring/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AcquiringCardProps {
  shop: Shop;
}

const PROVIDERS: { value: AcquiringProviderType; label: string; ready: boolean }[] = [
  { value: "payme", label: "Payme", ready: true },
  { value: "click", label: "Click", ready: false },
  { value: "uzum", label: "Uzum", ready: false },
];

/** QR to'lov (ekvayring) sozlamasi — egasi o'z merchant hisobini ulaydi ("A variant"). */
export function AcquiringCard({ shop }: AcquiringCardProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [enabled, setEnabled] = useState(!!shop.acquiring_enabled);
  const [provider, setProvider] = useState<AcquiringProviderType>(
    shop.acquiring_provider ?? "payme"
  );
  const [merchantId, setMerchantId] = useState(shop.acquiring_merchant_id ?? "");
  const [secretKey, setSecretKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    acquiringHasCredentials(shop.id)
      .then(setConnected)
      .catch(() => setConnected(false));
  }, [shop.id]);

  async function handleSave() {
    if (enabled && !merchantId.trim()) {
      toast.error(t("settings.acqMerchantRequired"));
      return;
    }
    if (enabled && !connected && !secretKey.trim()) {
      toast.error(t("settings.acqKeyRequired"));
      return;
    }
    setSaving(true);
    try {
      await saveAcquiringConfig({
        shopId: shop.id,
        enabled,
        provider,
        merchantId,
        secretKey,
      });
      if (secretKey.trim()) setConnected(true);
      setSecretKey("");
      qc.invalidateQueries({ queryKey: ["memberships"] });
      toast.success(t("settings.acqSaved"));
    } catch (err) {
      toast.error(t("settings.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  function copyWebhook() {
    navigator.clipboard
      .writeText(paymeWebhookUrl(shop.id))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toast.error(t("settings.saveError")));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {t("settings.acqTitle")}
          </span>
          <Badge variant={connected ? "success" : "warning"}>
            {connected ? t("settings.acqConnected") : t("settings.acqNotConnected")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{t("settings.acqHint")}</p>

        {/* Yoqish */}
        <div className="flex items-center justify-between rounded-xl border border-input px-4 py-3">
          <Label htmlFor="acq-enabled" className="cursor-pointer">
            {t("settings.acqEnableLabel")}
          </Label>
          <Switch id="acq-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <>
            {/* Provayder */}
            <div className="space-y-2">
              <Label>{t("settings.acqProviderLabel")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    disabled={!p.ready}
                    onClick={() => setProvider(p.value)}
                    className={cn(
                      "relative rounded-xl border py-2.5 text-sm font-medium transition-colors disabled:opacity-40",
                      provider === p.value
                        ? "border-primary bg-accent text-primary"
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p.label}
                    {!p.ready && (
                      <span className="block text-[10px] font-normal">
                        {t("settings.acqSoon")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Merchant ID */}
            <div className="space-y-2">
              <Label htmlFor="acq-merchant">{t("settings.acqMerchantLabel")}</Label>
              <Input
                id="acq-merchant"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder={t("settings.acqMerchantPlaceholder")}
              />
            </div>

            {/* Maxfiy kalit (write-only) */}
            <div className="space-y-2">
              <Label htmlFor="acq-secret">{t("settings.acqKeyLabel")}</Label>
              <Input
                id="acq-secret"
                type="password"
                autoComplete="off"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={
                  connected
                    ? t("settings.acqKeySet")
                    : t("settings.acqKeyPlaceholder")
                }
              />
              <p className="text-xs text-muted-foreground">{t("settings.acqKeyNote")}</p>
            </div>

            {/* Webhook URL (kabinetga yoziladi) */}
            <div className="space-y-2">
              <Label>{t("settings.acqWebhookLabel")}</Label>
              <div className="flex gap-2">
                <Input readOnly value={paymeWebhookUrl(shop.id)} className="flex-1 text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={copyWebhook}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.acqWebhookNote")}</p>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("settings.saving") : t("settings.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
