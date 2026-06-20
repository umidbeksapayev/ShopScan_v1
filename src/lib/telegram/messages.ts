import { formatCurrency } from "@/lib/utils";

/**
 * Telegram bot matnlari — sof funksiyalar (server route + testda ishlatiladi).
 * Bot tili: o'zbek (lotin). Hech qanday tashqi holatga bog'liq emas → test qilinadi.
 */

/** Do'kon kesimidagi qarz (get_chat_debts qatori). */
export interface ChatDebt {
  shop_name: string;
  balance: number;
  due_date: string | null; // "YYYY-MM-DD"
}

/** "YYYY-MM-DD" → "DD.MM.YYYY" (bo'sh → ""). */
export function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return "";
  return `${day}.${m}.${y}`;
}

export type DueStatus = "none" | "upcoming" | "today" | "overdue";

/** Muddat holati (today — local kun). */
export function dueStatus(
  dueDate: string | null | undefined,
  today: Date = new Date()
): DueStatus {
  if (!dueDate) return "none";
  const due = new Date(dueDate + "T00:00:00");
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((due.getTime() - t.getTime()) / 86_400_000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  return "upcoming";
}

/** Bitta qarz qatori uchun muddat izohi (ko'rsatish uchun). */
function dueSuffix(dueDate: string | null, today: Date): string {
  switch (dueStatus(dueDate, today)) {
    case "overdue":
      return ` — ⏰ muddati o'tgan (${formatDate(dueDate)})`;
    case "today":
      return ` — ⏰ bugun (${formatDate(dueDate)})`;
    case "upcoming":
      return ` — muddat: ${formatDate(dueDate)}`;
    default:
      return "";
  }
}

/** /start — kontakt ulashga taklif. */
export const WELCOME_TEXT =
  "Assalomu alaykum! 👋\n\n" +
  "Bu — uscan do'kon qarz eslatma boti. Qarzingizni shu yerda ko'rishingiz va " +
  "eslatma olishingiz mumkin.\n\n" +
  "Boshlash uchun pastdagi tugma orqali telefon raqamingizni ulashing.";

/** Telefon ulanmadi yoki mos mijoz topilmadi. */
export const NOT_FOUND_TEXT =
  "Bu raqam bo'yicha qarz topilmadi. 🤔\n\n" +
  "Do'kon egasi sizni telefon raqamingiz bilan ro'yxatga olgan bo'lishi kerak. " +
  "Iltimos, do'kon egasiga murojaat qiling.";

/** Bog'lanish muvaffaqiyatli — qarzlar ro'yxati bilan. */
export function formatLinkedMessage(debts: ChatDebt[], today: Date = new Date()): string {
  if (debts.length === 0) {
    return "✅ Ulandingiz! Hozircha qarzingiz yo'q. Rahmat!";
  }
  return "✅ Ulandingiz!\n\n" + formatChatDebts(debts, today);
}

/** /qarz — joriy qarzlar (do'kon kesimida). */
export function formatChatDebts(debts: ChatDebt[], today: Date = new Date()): string {
  if (debts.length === 0) {
    return "🎉 Sizda qarz yo'q. Rahmat!";
  }
  const lines = debts.map(
    (d) => `🏪 ${d.shop_name}: ${formatCurrency(d.balance)}${dueSuffix(d.due_date, today)}`
  );
  const total = debts.reduce((s, d) => s + d.balance, 0);
  const header = "📋 Joriy qarzingiz:\n\n";
  const footer = debts.length > 1 ? `\n\n💰 Jami: ${formatCurrency(total)}` : "";
  return header + lines.join("\n") + footer;
}

/** Eslatma matni (qo'lda yoki avtomatik) — bitta do'kon uchun. */
export function formatReminder(
  shopName: string,
  balance: number,
  dueDate: string | null,
  today: Date = new Date()
): string {
  const status = dueStatus(dueDate, today);
  const head =
    status === "overdue"
      ? "⏰ Eslatma: qarzingiz muddati o'tdi."
      : "🔔 Eslatma: qarzingizni to'lashni unutmang.";
  const due =
    status === "none" ? "" : `\nMuddat: ${formatDate(dueDate)}`;
  return (
    `${head}\n\n` +
    `🏪 ${shopName}\n` +
    `💰 Qarz: ${formatCurrency(balance)}${due}\n\n` +
    "Rahmat! 🙏"
  );
}
