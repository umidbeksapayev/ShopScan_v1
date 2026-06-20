"use client";

import { useState } from "react";
import { Send, Sun, MoonStar, BellOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Shop, SummaryTime } from "@/types/database";
import { createOwnerLinkUrl, updateSummaryTime } from "@/lib/owner-telegram";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OwnerTelegramCardProps {
  shop: Shop;
}

/** Egaga kunlik xulosa: Telegram ulash (deep-link) + vaqt tanlovi (07:00/00:00/o'chiq). */
export function OwnerTelegramCard({ shop }: OwnerTelegramCardProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const connected = shop.owner_telegram_chat_id != null;
  const [time, setTime] = useState<SummaryTime>(shop.summary_time ?? "off");
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      const url = await createOwnerLinkUrl(shop.id);
      window.open(url, "_blank", "noopener");
      toast.success(t("settings.telegramOpenHint"));
    } catch (err) {
      toast.error(t("settings.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setConnecting(false);
    }
  }

  async function chooseTime(value: SummaryTime) {
    const prev = time;
    setTime(value);
    setSaving(true);
    try {
      await updateSummaryTime(shop.id, value);
      qc.invalidateQueries({ queryKey: ["memberships"] });
      toast.success(t("settings.summarySaved"));
    } catch (err) {
      setTime(prev);
      toast.error(t("settings.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const options: { value: SummaryTime; label: string; icon: typeof Sun }[] = [
    { value: "morning", label: t("settings.summaryMorning"), icon: Sun },
    { value: "evening", label: t("settings.summaryEvening"), icon: MoonStar },
    { value: "off", label: t("settings.summaryOff"), icon: BellOff },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {t("settings.telegramSummaryTitle")}
          </span>
          <Badge variant={connected ? "success" : "warning"}>
            {connected
              ? t("settings.telegramConnected")
              : t("settings.telegramNotConnected")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {t("settings.telegramConnectHint")}
        </p>

        <Button
          variant="outline"
          onClick={handleConnect}
          disabled={connecting}
          className="w-full sm:w-auto"
        >
          <Send className="mr-1.5 h-4 w-4" />
          {connected
            ? t("settings.telegramReconnect")
            : t("settings.telegramConnect")}
        </Button>

        <div className="space-y-2">
          <Label>{t("settings.summaryTimeLabel")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {options.map((opt) => {
              const Icon = opt.icon;
              const active = time === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => chooseTime(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors disabled:opacity-60",
                    active
                      ? "border-primary bg-accent text-primary"
                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
          {!connected && time !== "off" && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t("settings.summaryNeedConnect")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
