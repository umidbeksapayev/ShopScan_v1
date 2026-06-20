"use client";

import { useState } from "react";
import { MessageSquarePlus, Lightbulb, AlertTriangle, Bug, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Shop } from "@/types/database";
import { submitFeedback, type FeedbackCategory } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeedbackCardProps {
  shop?: Shop | null;
}

/** Foydalanuvchi fikri (Taklif/Shikoyat/Xato) → DB + admin Telegram. */
export function FeedbackCard({ shop }: FeedbackCardProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const cats: { value: FeedbackCategory; label: string; icon: typeof Lightbulb }[] = [
    { value: "suggestion", label: t("settings.feedbackSuggestion"), icon: Lightbulb },
    { value: "complaint", label: t("settings.feedbackComplaint"), icon: AlertTriangle },
    { value: "bug", label: t("settings.feedbackBug"), icon: Bug },
  ];

  async function handleSubmit() {
    const msg = message.trim();
    if (!msg) return;
    setSending(true);
    try {
      const res = await submitFeedback({
        category,
        message: msg,
        shopId: shop?.id ?? null,
        shopName: shop?.name ?? null,
      });
      if (res.ok) {
        toast.success(t("settings.feedbackSent"));
        setMessage("");
      } else {
        toast.error(t("settings.feedbackError"));
      }
    } catch {
      toast.error(t("settings.feedbackError"));
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          {t("settings.feedbackTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("settings.feedbackHint")}</p>

        <div className="grid grid-cols-3 gap-2">
          {cats.map((c) => {
            const Icon = c.icon;
            const active = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-accent text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fb-msg" className="sr-only">
            {t("settings.feedbackTitle")}
          </Label>
          <textarea
            id="fb-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t("settings.feedbackPlaceholder")}
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button onClick={handleSubmit} disabled={sending || !message.trim()} className="w-full sm:w-auto">
          <Send className="mr-1.5 h-4 w-4" />
          {sending ? t("settings.feedbackSending") : t("settings.feedbackSend")}
        </Button>
      </CardContent>
    </Card>
  );
}
