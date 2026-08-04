import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { isExpoPushToken, sendPushMessages, type PushMessage } from "./expo";

/**
 * Push yuborish mantiqi (server-only) — `telegram/dispatch.ts` bilan bir xil
 * shakl: cron route chaqiradi, har yuborish `notification_log`ga yoziladi.
 *
 * Telegram kanalini ALMASHTIRMAYDI — yonma-yon ishlaydi. Sababi: ega
 * Telegramni ulamagan bo'lishi mumkin (P1 ning asosiy nuqtasi), ilova esa
 * doim telefonida.
 */

type Admin = ReturnType<typeof createAdminClient>;

export interface DispatchResult {
  total: number;
  sent: number;
  failed: number;
}

interface PushSummaryRow {
  shop_id: string;
  shop_name: string;
  tokens: string[];
  total_debt: number;
  debtor_count: number;
  overdue_count: number;
}

/** Push xabari matni — Telegram xulosasining qisqartirilgan varianti. */
export function formatSummaryPush(row: PushSummaryRow): { title: string; body: string } {
  const parts = [`Jami qarz: ${formatCurrency(row.total_debt)}`];
  if (row.debtor_count > 0) parts.push(`${row.debtor_count} qarzdor`);
  if (row.overdue_count > 0) parts.push(`${row.overdue_count} muddati o'tgan`);
  return {
    title: `${row.shop_name} — kunlik xulosa`,
    body: parts.join(" · "),
  };
}

/**
 * Tanlangan slot (morning/evening) egalariga push kunlik xulosa.
 * Do'kon `summary_time` sozlamasidan foydalanadi — Telegram bilan bir xil
 * vaqt tanlovi, ya'ni ega ikkita alohida sozlama boshqarmaydi.
 */
export async function runPushSummaries(
  admin: Admin,
  slot: "morning" | "evening"
): Promise<DispatchResult> {
  const { data, error } = await admin.rpc("get_push_summaries", { p_slot: slot });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PushSummaryRow[];

  // Barcha do'konlar uchun xabarlarni bitta ro'yxatga yig'amiz — Expo API
  // batch qabul qiladi, har do'kon uchun alohida so'rov yubormaymiz.
  //
  // ⚠️ Bitta ega bir nechta do'konga ega bo'lishi mumkin — u holda AYNI token
  // bir necha qatorda uchraydi. Shuning uchun token→do'kon xaritasi emas,
  // do'kon bo'yicha ro'yxat yuritamiz (aks holda audit yozuvi noto'g'ri
  // do'konga tegishli bo'lib qolardi).
  const messages: PushMessage[] = [];
  const shopTokens = new Map<string, string[]>();

  for (const row of rows) {
    const valid = row.tokens.filter(isExpoPushToken);
    if (valid.length === 0) continue;
    const { title, body } = formatSummaryPush(row);
    for (const token of valid) {
      messages.push({ to: token, title, body, data: { kind: "summary", shopId: row.shop_id } });
    }
    shopTokens.set(row.shop_id, valid);
  }

  if (messages.length === 0) return { total: 0, sent: 0, failed: 0 };

  const res = await sendPushMessages(messages);

  // Yaroqsiz tokenlarni tozalaymiz (ilova o'chirilgan / token eskirgan)
  if (res.invalidTokens.length > 0) {
    await admin.from("push_tokens").delete().in("token", res.invalidTokens);
  }

  // Audit — do'kon bo'yicha bitta yozuv (har token uchun emas, shovqin bo'lmasin)
  const invalid = new Set(res.invalidTokens);
  for (const [shopId, tokens] of Array.from(shopTokens.entries())) {
    const allFailed = tokens.every((tk: string) => invalid.has(tk));
    await admin.from("notification_log").insert({
      shop_id: shopId,
      customer_id: null,
      channel: "push",
      kind: "summary",
      status: allFailed ? "failed" : "sent",
      error: res.errors.length > 0 ? res.errors.slice(0, 3).join("; ") : null,
    });
  }

  return { total: messages.length, sent: res.sent, failed: res.failed };
}
