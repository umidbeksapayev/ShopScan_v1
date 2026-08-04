/**
 * Expo Push API — past darajali chaqiruvlar (faqat server).
 *
 * Telegram'dan farqli: kalit kerak emas (token qurilmaning o'zidan keladi),
 * lekin javob har bir token uchun alohida holat qaytaradi — muvaffaqiyatsiz
 * tokenlar (`DeviceNotRegistered`) tozalanishi kerak, aks holda o'chirilgan
 * ilovalarga cheksiz urinaveramiz.
 *
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */
import "server-only";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Expo bir so'rovda 100 tagacha xabar qabul qiladi. */
const BATCH_SIZE = 100;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  /** Ilova ochilganda qayerga o'tish kerakligi (mobil tomonda o'qiladi). */
  data?: Record<string, unknown>;
}

export interface PushSendResult {
  sent: number;
  failed: number;
  /** Yaroqsiz tokenlar — chaqiruvchi ularni DB'dan o'chiradi. */
  invalidTokens: string[];
  errors: string[];
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Xabarlarni yuboradi. Exception TASHLAMAYDI — natija obyektida qaytaradi,
 * chunki cron bitta do'kon uchun yiqilib qolsa qolganlari ham yuborilmaydi.
 */
export async function sendPushMessages(messages: PushMessage[]): Promise<PushSendResult> {
  const result: PushSendResult = { sent: 0, failed: 0, invalidTokens: [], errors: [] };
  if (messages.length === 0) return result;

  for (const batch of chunk(messages, BATCH_SIZE)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        result.failed += batch.length;
        result.errors.push(`Expo push ${res.status}: ${body.slice(0, 200)}`);
        continue;
      }

      const json = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = json.data ?? [];

      tickets.forEach((ticket, i) => {
        if (ticket.status === "ok") {
          result.sent++;
          return;
        }
        result.failed++;
        const detail = ticket.details?.error;
        if (detail === "DeviceNotRegistered") {
          // Ilova o'chirilgan yoki token eskirgan — tokenni tozalaymiz.
          result.invalidTokens.push(batch[i].to);
        } else {
          result.errors.push(ticket.message ?? detail ?? "noma'lum push xatosi");
        }
      });
    } catch (e) {
      result.failed += batch.length;
      result.errors.push(e instanceof Error ? e.message : "noma'lum tarmoq xatosi");
    }
  }

  return result;
}

/** Expo token formati — noto'g'ri qiymatlarni yuborishdan oldin filtrlash. */
export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}
