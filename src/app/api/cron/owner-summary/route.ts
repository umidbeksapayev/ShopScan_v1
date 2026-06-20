import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runOwnerSummaries } from "@/lib/telegram/dispatch";

// Kechki cron (vercel.json: 19:00 UTC = 00:00 Toshkent):
//   • 'evening' tanlagan egalarga kunlik xulosa
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run() {
  const admin = createAdminClient();
  const summaries = await runOwnerSummaries(admin, "evening");
  return NextResponse.json({ ok: true, summaries });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return new NextResponse("unauthorized", { status: 401 });
  return run();
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return new NextResponse("unauthorized", { status: 401 });
  return run();
}
