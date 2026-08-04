import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runOwnerSummaries } from "@/lib/telegram/dispatch";
import { runPushSummaries } from "@/lib/push/dispatch";

// Kechki cron (vercel.json: 19:00 UTC = 00:00 Toshkent):
//   • 'evening' tanlagan egalarga kunlik xulosa
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // CRON_SECRET yo'q bo'lsa: production'da YOPIQ, lokal/dev'da ochiq.
  // Vercel cron CRON_SECRET'ni avtomatik yuboradi.
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run() {
  const admin = createAdminClient();
  const summaries = await runOwnerSummaries(admin, "evening");
  // Push — Telegram bilan YONMA-YON kanal (032). Alohida try: push yiqilsa
  // Telegram natijasi yo'qolmasin va cron 500 qaytarmasin.
  let push: unknown;
  try {
    push = await runPushSummaries(admin, "evening");
  } catch (e) {
    push = { error: e instanceof Error ? e.message : "noma'lum xato" };
  }
  return NextResponse.json({ ok: true, summaries, push });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse("unauthorized", { status: 401 });
  return run();
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return new NextResponse("unauthorized", { status: 401 });
  return run();
}
