import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { formatReminder } from "@/lib/telegram/messages";

// Avtomatik nasiya eslatma — Vercel Cron har kuni chaqiradi (vercel.json).
// Muddati kelgan/o'tgan, bog'langan qarzdorlarga Telegram eslatma yuboradi
// (get_due_reminders 3 kunlik throttle bilan dublikatni oldini oladi).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DueReminder {
  customer_id: string;
  shop_id: string;
  shop_name: string;
  telegram_chat_id: number;
  balance: number;
  due_date: string | null;
}

async function run() {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_due_reminders", {
    p_throttle_days: 3,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as DueReminder[];
  let sent = 0;
  let failed = 0;

  for (const r of rows) {
    const text = formatReminder(r.shop_name, r.balance, r.due_date);
    let status: "sent" | "failed" = "sent";
    let errMsg: string | null = null;
    try {
      await sendTelegramMessage(r.telegram_chat_id, text);
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

  return NextResponse.json({ ok: true, total: rows.length, sent, failed });
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // CRON_SECRET o'rnatilgan bo'lsa — Vercel Cron yuborgan Bearer tokenni tekshiramiz
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Vercel Cron GET bilan chaqiradi
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  return run();
}

// Qo'lda ishga tushirish uchun (himoyalangan) — test/zudlik
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  return run();
}
