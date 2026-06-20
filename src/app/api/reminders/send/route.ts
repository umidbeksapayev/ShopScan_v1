import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { formatReminder } from "@/lib/telegram/messages";

// Qo'lda eslatma yuborish — egadan/manage_debt kassirdan. Session bilan himoyalangan;
// ruxsat get_reminder_target RPC ichida (has_perm) tekshiriladi.
export const runtime = "nodejs";

interface ReminderTarget {
  shop_id: string;
  shop_name: string;
  telegram_chat_id: number | null;
  balance: number;
  due_date: string | null;
  reminders_enabled: boolean;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let customerId: string | undefined;
  try {
    ({ customerId } = (await req.json()) as { customerId?: string });
  } catch {
    customerId = undefined;
  }
  if (!customerId) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  // Ruxsat + ma'lumot (RPC manage_debt'ni tekshiradi)
  const { data, error } = await supabase.rpc("get_reminder_target", {
    p_customer_id: customerId,
  });
  if (error) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }
  const target = (data?.[0] ?? null) as ReminderTarget | null;
  if (!target) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }
  if (!target.telegram_chat_id) {
    return NextResponse.json({ ok: false, reason: "not_linked" });
  }
  if (target.balance <= 0) {
    return NextResponse.json({ ok: false, reason: "no_debt" });
  }

  const text = formatReminder(target.shop_name, target.balance, target.due_date);

  let status: "sent" | "failed" = "sent";
  let errMsg: string | null = null;
  try {
    await sendTelegramMessage(target.telegram_chat_id, text);
  } catch (e) {
    status = "failed";
    errMsg = e instanceof Error ? e.message : "noma'lum xato";
  }

  // Jurnalga yozish (RLS: manage_debt → o'tadi)
  await supabase.from("notification_log").insert({
    shop_id: target.shop_id,
    customer_id: customerId,
    channel: "telegram",
    kind: "manual",
    status,
    error: errMsg,
  });

  if (status === "failed") {
    return NextResponse.json({ ok: false, reason: "send_failed", error: errMsg }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
