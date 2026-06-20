import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage, sharePhoneKeyboard } from "@/lib/telegram/client";
import {
  WELCOME_TEXT,
  NOT_FOUND_TEXT,
  formatLinkedMessage,
  formatChatDebts,
  ownerLinkedText,
  OWNER_LINK_INVALID,
  type ChatDebt,
} from "@/lib/telegram/messages";

// Telegram webhook — markaziy uscan boti. Mijoz telefonini ulaydi → qarzini ko'radi.
// Xavfsizlik: Telegram'ning X-Telegram-Bot-Api-Secret-Token header'i tekshiriladi.
export const runtime = "nodejs";

interface TgContact {
  phone_number: string;
  user_id?: number;
}
interface TgMessage {
  chat: { id: number };
  from?: { id: number };
  text?: string;
  contact?: TgContact;
}
interface TgUpdate {
  message?: TgMessage;
}

async function fetchChatDebts(
  admin: ReturnType<typeof createAdminClient>,
  chatId: number
): Promise<ChatDebt[]> {
  const { data } = await admin.rpc("get_chat_debts", { p_chat_id: chatId });
  return (data ?? []) as ChatDebt[];
}

export async function POST(req: NextRequest) {
  // 1) Sirli token tekshiruvi (faqat Telegram chaqira oladi)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (
    secret &&
    req.headers.get("x-telegram-bot-api-secret-token") !== secret
  ) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  if (!msg) return NextResponse.json({ ok: true });
  const chatId = msg.chat.id;

  try {
    const admin = createAdminClient();

    // 2) Kontakt ulashildi → bog'lash. Faqat YUBORUVCHINING o'z raqami qabul qilinadi.
    if (msg.contact) {
      const isOwnContact =
        !msg.contact.user_id || msg.contact.user_id === msg.from?.id;
      if (!isOwnContact) {
        await sendTelegramMessage(
          chatId,
          "Iltimos, faqat O'ZINGIZNING raqamingizni ulashing."
        );
        return NextResponse.json({ ok: true });
      }

      const { data: linked } = await admin.rpc("link_telegram", {
        p_phone: msg.contact.phone_number,
        p_chat_id: chatId,
      });

      if (!linked || linked.length === 0) {
        await sendTelegramMessage(chatId, NOT_FOUND_TEXT, {
          reply_markup: { remove_keyboard: true },
        });
        return NextResponse.json({ ok: true });
      }

      const debts = await fetchChatDebts(admin, chatId);
      await sendTelegramMessage(chatId, formatLinkedMessage(debts), {
        reply_markup: { remove_keyboard: true },
      });
      return NextResponse.json({ ok: true });
    }

    // 3) Matnli buyruqlar
    const rawText = (msg.text ?? "").trim();
    const parts = rawText.split(/\s+/);
    const cmd = (parts[0] ?? "").toLowerCase();
    const text = rawText.toLowerCase();

    if (cmd === "/start" || cmd === "start") {
      const param = parts[1];
      // Ega deep-link: /start <token> → egani do'konga bog'laymiz
      if (param) {
        const { data: ownerLink } = await admin.rpc("link_owner_telegram", {
          p_token: param,
          p_chat_id: chatId,
        });
        const shopName = (
          ownerLink?.[0] as { out_shop_name?: string } | undefined
        )?.out_shop_name;
        await sendTelegramMessage(
          chatId,
          shopName ? ownerLinkedText(shopName) : OWNER_LINK_INVALID
        );
        return NextResponse.json({ ok: true });
      }
      // Oddiy /start → mijoz oqimi (telefon ulash)
      await sendTelegramMessage(chatId, WELCOME_TEXT, {
        reply_markup: sharePhoneKeyboard,
      });
      return NextResponse.json({ ok: true });
    }

    // Yordamchi: chat_id olish (admin Telegram'ini sozlash uchun)
    if (text === "/myid" || text === "myid") {
      await sendTelegramMessage(chatId, `Sizning chat ID: ${chatId}`);
      return NextResponse.json({ ok: true });
    }

    if (text === "/qarz" || text === "qarz" || text.includes("qarz")) {
      const debts = await fetchChatDebts(admin, chatId);
      await sendTelegramMessage(chatId, formatChatDebts(debts));
      return NextResponse.json({ ok: true });
    }

    // 4) Tanilmagan — qisqa yo'riq
    await sendTelegramMessage(
      chatId,
      "Qarzingizni ko'rish uchun /qarz deb yozing yoki /start bilan raqamingizni ulang."
    );
  } catch (err) {
    // Telegram qayta urinmasligi uchun har doim 200 qaytaramiz (xatoni log qilamiz)
    console.error("[telegram/webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
