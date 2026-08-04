import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCustomerReminders, runOwnerSummaries } from "@/lib/telegram/dispatch";
import { runPushSummaries } from "@/lib/push/dispatch";

// Ertalabki cron (vercel.json: 02:00 UTC = 07:00 Toshkent):
//   • muddati kelgan/o'tgan qarzdorlarga avtomatik eslatma
//   • 'morning' tanlagan egalarga kunlik xulosa
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // CRON_SECRET yo'q bo'lsa: production'da YOPIQ (himoyasiz qoldirmaymiz),
  // lokal/dev'da ochiq (qulaylik). Vercel cron CRON_SECRET'ni avtomatik yuboradi.
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run() {
  const admin = createAdminClient();
  const reminders = await runCustomerReminders(admin);
  const summaries = await runOwnerSummaries(admin, "morning");
  // Push — Telegram bilan YONMA-YON kanal (032). Alohida try: push yiqilsa
  // Telegram natijasi yo'qolmasin va cron 500 qaytarmasin.
  let push: unknown;
  try {
    push = await runPushSummaries(admin, "morning");
  } catch (e) {
    push = { error: e instanceof Error ? e.message : "noma'lum xato" };
  }
  return NextResponse.json({ ok: true, reminders, summaries, push });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse("unauthorized", { status: 401 });
  return run();
}

// Qo'lda ishga tushirish (test/zudlik) — himoyalangan
export async function POST(req: NextRequest) {
  if (!authorized(req)) return new NextResponse("unauthorized", { status: 401 });
  return run();
}
