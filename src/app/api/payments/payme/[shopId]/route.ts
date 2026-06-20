import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  handlePaymeRpc,
  PaymeState,
  type JsonRpcRequest,
  type PaymeIntentRow,
  type PaymeStore,
} from "@/lib/acquiring/payme-merchant";

/**
 * Payme Merchant API webhook — har do'kon uchun alohida URL:
 *   POST /api/payments/payme/<shopId>
 * Do'kon egasi shu URL'ni Payme kabinetidagi "Merchant API endpoint"ga yozadi.
 *
 * Xavfsizlik: Basic-auth paroli = do'konning payment_credentials.secret_key.
 * shopId URL'da (maxfiy emas) — haqiqiy himoya merchant kaliti orqali.
 */
export const runtime = "nodejs";

const AUTH_ERROR = {
  code: -32504,
  message: {
    uz: "Avtorizatsiya xatosi",
    ru: "Ошибка авторизации",
    en: "Authorization error",
  },
};

/** Basic-auth parolini secret bilan solishtiradi (login e'tiborga olinmaydi). */
function passwordMatches(authHeader: string | null, secret: string): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  } catch {
    return false;
  }
  const idx = decoded.indexOf(":");
  const password = idx >= 0 ? decoded.slice(idx + 1) : decoded;
  return password === secret;
}

function mapRow(r: Record<string, unknown>): PaymeIntentRow {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    id: String(r.id),
    amount: Number(r.amount),
    status: r.status as PaymeIntentRow["status"],
    provider_txn_id: (r.provider_txn_id as string | null) ?? null,
    provider_state: num(r.provider_state),
    provider_create_time: num(r.provider_create_time),
    provider_perform_time: num(r.provider_perform_time),
    provider_cancel_time: num(r.provider_cancel_time),
    provider_reason: num(r.provider_reason),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { shopId: string } }
) {
  const shopId = params.shopId;
  const admin = createAdminClient();

  // 1) Do'kon maxfiy kaliti (service-role RLS'ni chetlab o'tadi)
  const { data: cred } = await admin
    .from("payment_credentials")
    .select("secret_key")
    .eq("shop_id", shopId)
    .single();

  const secret = cred?.secret_key as string | undefined;

  // JSON-RPC id'ni javobда qaytarish uchun oldindan o'qiymiz
  let rpc: JsonRpcRequest = {};
  try {
    rpc = (await req.json()) as JsonRpcRequest;
  } catch {
    // bo'sh — quyida method=undefined → method not found
  }
  const rpcId = rpc.id ?? null;

  // 2) Autentifikatsiya
  if (!secret || !passwordMatches(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ jsonrpc: "2.0", id: rpcId, error: AUTH_ERROR });
  }

  // 3) DB adapteri (shopId bilan chegaralangan)
  const store: PaymeStore = {
    async getByOrderId(orderId) {
      const { data } = await admin
        .from("payment_intents")
        .select("*")
        .eq("id", orderId)
        .eq("shop_id", shopId)
        .eq("provider", "payme")
        .single();
      return data ? mapRow(data) : null;
    },
    async getByTxnId(txnId) {
      const { data } = await admin
        .from("payment_intents")
        .select("*")
        .eq("provider_txn_id", txnId)
        .eq("shop_id", shopId)
        .single();
      return data ? mapRow(data) : null;
    },
    async attachTxn(intentId, txnId, createTime) {
      await admin
        .from("payment_intents")
        .update({
          provider_txn_id: txnId,
          provider_create_time: createTime,
          provider_state: PaymeState.Created,
          updated_at: new Date().toISOString(),
        })
        .eq("id", intentId);
    },
    async setPerformed(intentId, performTime) {
      await admin
        .from("payment_intents")
        .update({
          provider_state: PaymeState.Performed,
          provider_perform_time: performTime,
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", intentId);
    },
    async setCanceled(intentId, cancelTime, reason, newState) {
      await admin
        .from("payment_intents")
        .update({
          provider_state: newState,
          provider_cancel_time: cancelTime,
          provider_reason: reason,
          status: "canceled",
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", intentId);
    },
  };

  const outcome = await handlePaymeRpc(rpc, store);
  return NextResponse.json({ jsonrpc: "2.0", id: rpcId, ...outcome });
}
