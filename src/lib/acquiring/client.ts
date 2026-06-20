import { createClient } from "@/lib/supabase/client";
import type { PaymentIntentStatus } from "@/types/database";

/** Checkout intent yaratish so'rovi. */
export interface CreateIntentArgs {
  shopId: string;
  items: { product_id: string; quantity: number }[];
  amount: number;
  searchMethod: string;
  clientId: string;
}

export interface CreateIntentResult {
  intentId: string;
  payUrl: string;
  provider: string;
}

/** QR to'lov urinishini yaratadi va checkout havolasini qaytaradi. */
export async function createPaymentIntent(
  args: CreateIntentArgs
): Promise<CreateIntentResult> {
  const res = await fetch("/api/payments/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "intent_failed");
  }
  return (await res.json()) as CreateIntentResult;
}

export interface IntentStatus {
  status: PaymentIntentStatus;
  finalized: boolean;
}

/** Intent holatini so'raydi (polling). */
export async function getIntentStatus(intentId: string): Promise<IntentStatus> {
  const res = await fetch(`/api/payments/intent/${intentId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("status_failed");
  const data = (await res.json()) as IntentStatus;
  return data;
}

/** Sotuv yozilgach intentni "yakunlangan" deb belgilaydi (best-effort reconciliation). */
export async function markIntentFinalized(intentId: string): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("acquiring_mark_finalized", { p_intent_id: intentId });
}
