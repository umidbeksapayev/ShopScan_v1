import type { PaymentIntentStatus } from "@/types/database";
import { somToTiyin } from "./payme";

/**
 * Payme Merchant API (JSON-RPC) handler — SOF mantiq (DB'dan mustaqil, testlanadi).
 *
 * Payme to'lovni qabul qilgach SHU metodlarni chaqiradi:
 *   CheckPerformTransaction → CreateTransaction → PerformTransaction
 *   (yoki CancelTransaction). CheckTransaction/GetStatement — holat/reconciliation.
 *
 * DB ishlari `PaymeStore` orqali in'ektsiya qilinadi → route Supabase'ni ulaydi,
 * testlar mock beradi. Bu yerda HECH QANDAY tarmoq/DB chaqiruvi yo'q.
 *
 * Hujjat: https://developer.help.paycom.uz/protokol-merchant-api/
 */

/** Payme tranzaksiya holatlari. */
export const PaymeState = {
  Created: 1,
  Performed: 2,
  CanceledBeforePerform: -1,
  CanceledAfterPerform: -2,
} as const;

/** Payme JSON-RPC xato kodlari (-310xx — biznes mantiq). */
export const PaymeError = {
  WrongAmount: -31001,
  TxnNotFound: -31003,
  CannotCancel: -31007,
  CannotPerform: -31008,
  OrderNotFound: -31050,
} as const;

export interface PaymeMessage {
  ru: string;
  uz: string;
  en: string;
}

/** Webhook ko'radigan intent qatori (faqat kerakli maydonlar). */
export interface PaymeIntentRow {
  id: string;
  amount: number; // so'm (DECIMAL)
  status: PaymentIntentStatus;
  provider_txn_id: string | null;
  provider_state: number | null;
  provider_create_time: number | null;
  provider_perform_time: number | null;
  provider_cancel_time: number | null;
  provider_reason: number | null;
}

/** DB adapteri — route to'ldiradi, test mock qiladi. */
export interface PaymeStore {
  getByOrderId(orderId: string): Promise<PaymeIntentRow | null>;
  getByTxnId(txnId: string): Promise<PaymeIntentRow | null>;
  attachTxn(intentId: string, txnId: string, createTime: number): Promise<void>;
  setPerformed(intentId: string, performTime: number): Promise<void>;
  setCanceled(
    intentId: string,
    cancelTime: number,
    reason: number | null,
    newState: number
  ): Promise<void>;
}

export interface JsonRpcRequest {
  method?: string;
  params?: Record<string, unknown>;
  id?: number | string | null;
}

export type RpcOutcome =
  | { result: Record<string, unknown> }
  | { error: { code: number; message: PaymeMessage; data?: string } };

function msg(uz: string, ru: string, en: string): PaymeMessage {
  return { uz, ru, en };
}

function rpcError(code: number, m: PaymeMessage, data?: string): RpcOutcome {
  return { error: { code, message: m, data } };
}

const ERR_ORDER_NOT_FOUND = msg(
  "Buyurtma topilmadi",
  "Заказ не найден",
  "Order not found"
);
const ERR_WRONG_AMOUNT = msg("Noto'g'ri summa", "Неверная сумма", "Wrong amount");
const ERR_TXN_NOT_FOUND = msg(
  "Tranzaksiya topilmadi",
  "Транзакция не найдена",
  "Transaction not found"
);
const ERR_CANNOT_PERFORM = msg(
  "Operatsiyani bajarib bo'lmaydi",
  "Невозможно выполнить операцию",
  "Unable to perform operation"
);

function orderIdOf(params: Record<string, unknown> | undefined): string | null {
  const account = params?.account as Record<string, unknown> | undefined;
  const v = account?.order_id;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Bitta JSON-RPC so'rovni qayta ishlaydi va natija/xato qaytaradi.
 * Autentifikatsiya (Basic-auth) BU YERDA EMAS — route'da chaqiruvdan oldin.
 */
export async function handlePaymeRpc(
  req: JsonRpcRequest,
  store: PaymeStore,
  now: () => number = Date.now
): Promise<RpcOutcome> {
  const params = req.params ?? {};

  switch (req.method) {
    // ── To'lov mumkinligini tekshirish ──────────────────────────────
    case "CheckPerformTransaction": {
      const orderId = orderIdOf(params);
      if (!orderId) return rpcError(PaymeError.OrderNotFound, ERR_ORDER_NOT_FOUND);
      const intent = await store.getByOrderId(orderId);
      if (!intent) return rpcError(PaymeError.OrderNotFound, ERR_ORDER_NOT_FOUND);
      if (intent.status !== "pending")
        return rpcError(PaymeError.CannotPerform, ERR_CANNOT_PERFORM);
      if (Number(params.amount) !== somToTiyin(intent.amount))
        return rpcError(PaymeError.WrongAmount, ERR_WRONG_AMOUNT);
      return { result: { allow: true } };
    }

    // ── Tranzaksiya yaratish ────────────────────────────────────────
    case "CreateTransaction": {
      const orderId = orderIdOf(params);
      const txnId = String(params.id ?? "");
      if (!orderId) return rpcError(PaymeError.OrderNotFound, ERR_ORDER_NOT_FOUND);
      const intent = await store.getByOrderId(orderId);
      if (!intent) return rpcError(PaymeError.OrderNotFound, ERR_ORDER_NOT_FOUND);
      if (Number(params.amount) !== somToTiyin(intent.amount))
        return rpcError(PaymeError.WrongAmount, ERR_WRONG_AMOUNT);

      // Allaqachon tranzaksiya bog'langan
      if (intent.provider_txn_id) {
        if (intent.provider_txn_id === txnId) {
          // Idempotent — o'sha tranzaksiya qayta yuborildi
          return {
            result: {
              create_time: intent.provider_create_time ?? now(),
              transaction: intent.id,
              state: intent.provider_state ?? PaymeState.Created,
            },
          };
        }
        // Boshqa tranzaksiya buyurtmani band qilgan
        return rpcError(PaymeError.CannotPerform, ERR_CANNOT_PERFORM);
      }

      if (intent.status !== "pending")
        return rpcError(PaymeError.CannotPerform, ERR_CANNOT_PERFORM);

      const createTime = Number(params.time) || now();
      await store.attachTxn(intent.id, txnId, createTime);
      return {
        result: {
          create_time: createTime,
          transaction: intent.id,
          state: PaymeState.Created,
        },
      };
    }

    // ── To'lovni yakunlash (pul yechildi) ───────────────────────────
    case "PerformTransaction": {
      const txnId = String(params.id ?? "");
      const intent = await store.getByTxnId(txnId);
      if (!intent) return rpcError(PaymeError.TxnNotFound, ERR_TXN_NOT_FOUND);

      if (intent.provider_state === PaymeState.Created) {
        const performTime = now();
        await store.setPerformed(intent.id, performTime);
        return {
          result: {
            transaction: intent.id,
            perform_time: performTime,
            state: PaymeState.Performed,
          },
        };
      }
      if (intent.provider_state === PaymeState.Performed) {
        // Idempotent — allaqachon yakunlangan
        return {
          result: {
            transaction: intent.id,
            perform_time: intent.provider_perform_time ?? now(),
            state: PaymeState.Performed,
          },
        };
      }
      // Bekor qilingan — yakunlab bo'lmaydi
      return rpcError(PaymeError.CannotPerform, ERR_CANNOT_PERFORM);
    }

    // ── Tranzaksiyani bekor qilish ──────────────────────────────────
    case "CancelTransaction": {
      const txnId = String(params.id ?? "");
      const reason = params.reason == null ? null : Number(params.reason);
      const intent = await store.getByTxnId(txnId);
      if (!intent) return rpcError(PaymeError.TxnNotFound, ERR_TXN_NOT_FOUND);

      // Allaqachon bekor qilingan — idempotent
      if (
        intent.provider_state === PaymeState.CanceledBeforePerform ||
        intent.provider_state === PaymeState.CanceledAfterPerform
      ) {
        return {
          result: {
            transaction: intent.id,
            cancel_time: intent.provider_cancel_time ?? now(),
            state: intent.provider_state,
          },
        };
      }

      const newState =
        intent.provider_state === PaymeState.Performed
          ? PaymeState.CanceledAfterPerform
          : PaymeState.CanceledBeforePerform;
      const cancelTime = now();
      await store.setCanceled(intent.id, cancelTime, reason, newState);
      return {
        result: { transaction: intent.id, cancel_time: cancelTime, state: newState },
      };
    }

    // ── Holatni tekshirish ──────────────────────────────────────────
    case "CheckTransaction": {
      const txnId = String(params.id ?? "");
      const intent = await store.getByTxnId(txnId);
      if (!intent) return rpcError(PaymeError.TxnNotFound, ERR_TXN_NOT_FOUND);
      return {
        result: {
          create_time: intent.provider_create_time ?? 0,
          perform_time: intent.provider_perform_time ?? 0,
          cancel_time: intent.provider_cancel_time ?? 0,
          transaction: intent.id,
          state: intent.provider_state ?? 0,
          reason: intent.provider_reason ?? null,
        },
      };
    }

    // ── Hisobot (reconciliation) — MVP: bo'sh ──────────────────────
    case "GetStatement":
      return { result: { transactions: [] } };

    default:
      return {
        error: {
          code: -32601,
          message: msg("Metod topilmadi", "Метод не найден", "Method not found"),
        },
      };
  }
}
