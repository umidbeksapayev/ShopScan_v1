/**
 * Telegram Bot API — past darajali chaqiruvlar (faqat server).
 * TELEGRAM_BOT_TOKEN env'dan olinadi (markaziy uscan boti).
 */
import "server-only";

function apiUrl(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan (.env.local)");
  }
  return `https://api.telegram.org/bot${token}/${method}`;
}

/** "Telefon raqamni ulashish" tugmasi (request_contact klaviaturasi). */
export const sharePhoneKeyboard = {
  keyboard: [[{ text: "📱 Telefon raqamni ulashish", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
} as const;

interface SendOpts {
  reply_markup?: Record<string, unknown>;
  parse_mode?: "HTML" | "Markdown";
}

/** Xabar yuborish. Xato bo'lsa exception tashlaydi (chaqiruvchi log qiladi). */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  opts: SendOpts = {}
): Promise<void> {
  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...opts }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage ${res.status}: ${body}`);
  }
}
