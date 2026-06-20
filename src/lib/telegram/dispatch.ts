import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "./client";
import { formatReminder, formatOwnerSummary, type OwnerSummary } from "./messages";

/**
 * Cron yuborish mantiqi (server-only) — mijoz eslatmalari va egaga xulosa.
 * Cron route'lar shu funksiyalarni chaqiradi (DRY). Har yuborish notification_log'ga
 * yoziladi (audit + mijoz eslatmasi uchun throttle manbasi).
 */

type Admin = ReturnType<typeof createAdminClient>;

export interface DispatchResult {
  total: number;
  sent: number;
  failed: number;
}

interface DueReminderRow {
  customer_id: string;
  shop_id: string;
  shop_name: string;
  telegram_chat_id: number;
  balance: number;
  due_date: string | null;
}

type OwnerSummaryRow = OwnerSummary & {
  shop_id: string;
  owner_chat_id: number;
};

/** Muddati kelgan/o'tgan qarzdorlarga avtomatik eslatma (5 kunlik throttle RPC ichida). */
export async function runCustomerReminders(admin: Admin): Promise<DispatchResult> {
  const { data, error } = await admin.rpc("get_due_reminders", { p_throttle_days: 5 });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DueReminderRow[];

  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    let status: "sent" | "failed" = "sent";
    let errMsg: string | null = null;
    try {
      await sendTelegramMessage(r.telegram_chat_id, formatReminder(r.shop_name, r.balance, r.due_date));
      sent++;
    } catch (e) {
      status = "failed";
      failed++;
      errMsg = e instanceof Error ? e.message : "noma'lum xato";
    }
    await admin.from("notification_log").insert({
      shop_id: r.shop_id,
      customer_id: r.customer_id,
      channel: "telegram",
      kind: "reminder",
      status,
      error: errMsg,
    });
  }
  return { total: rows.length, sent, failed };
}

/** Tanlangan slot (morning/evening) egalariga kunlik qarz xulosasi. */
export async function runOwnerSummaries(
  admin: Admin,
  slot: "morning" | "evening"
): Promise<DispatchResult> {
  const { data, error } = await admin.rpc("get_owner_summaries", { p_slot: slot });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as OwnerSummaryRow[];

  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    let status: "sent" | "failed" = "sent";
    let errMsg: string | null = null;
    try {
      await sendTelegramMessage(r.owner_chat_id, formatOwnerSummary(r));
      sent++;
    } catch (e) {
      status = "failed";
      failed++;
      errMsg = e instanceof Error ? e.message : "noma'lum xato";
    }
    await admin.from("notification_log").insert({
      shop_id: r.shop_id,
      customer_id: null,
      channel: "telegram",
      kind: "summary",
      status,
      error: errMsg,
    });
  }
  return { total: rows.length, sent, failed };
}
