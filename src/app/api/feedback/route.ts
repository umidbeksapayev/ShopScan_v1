import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { formatFeedback, type FeedbackCategory } from "@/lib/telegram/messages";

// Foydalanuvchi fikri: DB'ga saqlaydi + admin Telegram'iga yuboradi.
// Session bilan himoyalangan (faqat kirgan foydalanuvchi).
export const runtime = "nodejs";

const CATEGORIES: FeedbackCategory[] = ["suggestion", "complaint", "bug"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let body: { category?: string; message?: string; shopId?: string; shopName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const category = body.category as FeedbackCategory;
  const message = (body.message ?? "").trim();
  if (!message || !CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ ok: false, reason: "too_long" }, { status: 400 });
  }

  // 1) DB'ga saqlash (RLS: user_id = auth.uid())
  const { error } = await supabase.from("feedback").insert({
    shop_id: body.shopId ?? null,
    user_id: user.id,
    email: user.email,
    category,
    message,
  });
  if (error) {
    return NextResponse.json({ ok: false, reason: "save_failed" }, { status: 500 });
  }

  // 2) Admin Telegram'iga yuborish (xato bo'lsa ham fikr saqlangan)
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChat) {
    try {
      await sendTelegramMessage(
        adminChat,
        formatFeedback(category, message, {
          shopName: body.shopName ?? null,
          email: user.email,
        })
      );
    } catch {
      // Telegram yetkazib bo'lmadi — fikr DB'da saqlangan, jim o'tamiz
    }
  }

  return NextResponse.json({ ok: true });
}
