import type { FeedbackCategory } from "@/lib/telegram/messages";

export type { FeedbackCategory };

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
  shopId?: string | null;
  shopName?: string | null;
}

/** Fikr yuborish (server /api/feedback orqali: DB + admin Telegram). */
export async function submitFeedback(
  input: FeedbackInput
): Promise<{ ok: boolean; reason?: string }> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await res.json().catch(() => ({ ok: false, reason: "network" }))) as {
    ok: boolean;
    reason?: string;
  };
}
