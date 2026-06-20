import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCustomerReminders, runOwnerSummaries } from "@/lib/telegram/dispatch";

// Ertalabki cron (vercel.json: 02:00 UTC = 07:00 Toshkent):
//   • muddati kelgan/o'tgan qarzdorlarga avtomatik eslatma
//   • 'morning' tanlagan egalarga kunlik xulosa
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // CRON_SECRET yo'q → tekshiruvsiz (lokal/dev)
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run() {
  const admin = createAdminClient();
  const reminders = await runCustomerReminders(admin);
  const summaries = await runOwnerSummaries(admin, "morning");
  return NextResponse.json({ ok: true, reminders, summaries });
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
