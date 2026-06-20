"use client";

import { useState } from "react";
import { Bell, Send, CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Customer } from "@/types/database";
import {
  useUpdateCustomerReminder,
  useSendReminder,
} from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface ReminderCardProps {
  customer: Customer;
  balance: number;
}

/** Mijoz qarz eslatmasi: Telegram holati, muddat, avtomatik toggle, qo'lda yuborish. */
export function ReminderCard({ customer, balance }: ReminderCardProps) {
  const { t } = useTranslation();
  const updateMut = useUpdateCustomerReminder();
  const sendMut = useSendReminder();

  const [dueDate, setDueDate] = useState(customer.due_date ?? "");
  const [enabled, setEnabled] = useState(customer.reminders_enabled ?? true);
  const linked = customer.telegram_chat_id != null;

  async function saveDueDate(value: string) {
    setDueDate(value);
    try {
      await updateMut.mutateAsync({ id: customer.id, due_date: value || null });
      toast.success(t("customers.dueSaved"));
    } catch (err) {
      toast.error(t("customers.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function toggleEnabled(value: boolean) {
    setEnabled(value);
    try {
      await updateMut.mutateAsync({ id: customer.id, reminders_enabled: value });
    } catch (err) {
      setEnabled(!value); // qaytarish
      toast.error(t("customers.saveError"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleSend() {
    const res = await sendMut.mutateAsync(customer.id);
    if (res.ok) {
      toast.success(t("customers.reminderSent"));
      return;
    }
    const map: Record<string, string> = {
      not_linked: t("customers.reminderNotLinked"),
      no_debt: t("customers.reminderNoDebt"),
    };
    toast.error(map[res.reason ?? ""] ?? t("customers.reminderFailed"), {
      description: res.error,
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bell className="h-4 w-4" /> {t("customers.reminderTitle")}
        </h2>
        {linked ? (
          <Badge variant="success">{t("customers.telegramLinked")}</Badge>
        ) : (
          <Badge variant="warning">{t("customers.telegramNotLinked")}</Badge>
        )}
      </div>

      {!linked && (
        <p className="rounded-lg bg-accent/40 px-3 py-2 text-xs text-muted-foreground">
          {t("customers.telegramHint")}
        </p>
      )}

      {/* To'lov muddati */}
      <div className="space-y-1.5">
        <Label htmlFor="due" className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" /> {t("customers.dueDate")}
        </Label>
        <Input
          id="due"
          type="date"
          value={dueDate}
          onChange={(e) => saveDueDate(e.target.value)}
        />
      </div>

      {/* Avtomatik eslatma toggle (avtomatik yuborish S10b'da ishlaydi) */}
      <div className="flex items-center justify-between">
        <Label htmlFor="auto" className="cursor-pointer">
          {t("customers.remindersOn")}
        </Label>
        <Switch id="auto" checked={enabled} onCheckedChange={toggleEnabled} />
      </div>

      {/* Qo'lda eslatma yuborish */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!linked || balance <= 0 || sendMut.isPending}
        onClick={handleSend}
      >
        <Send className="mr-1.5 h-4 w-4" />
        {sendMut.isPending ? t("customers.sending") : t("customers.sendReminder")}
      </Button>
    </div>
  );
}
