import { describe, it, expect } from "vitest";
import {
  handlePaymeRpc,
  PaymeState,
  PaymeError,
  type PaymeStore,
  type PaymeIntentRow,
} from "../payme-merchant";

/** Bitta intent ustida ishlovchi in-memory store (real DB o'rniga). */
function makeStore(initial: Partial<PaymeIntentRow> = {}): {
  store: PaymeStore;
  row: PaymeIntentRow;
} {
  const row: PaymeIntentRow = {
    id: "intent-1",
    amount: 15000, // so'm → 1_500_000 tiyin
    status: "pending",
    provider_txn_id: null,
    provider_state: null,
    provider_create_time: null,
    provider_perform_time: null,
    provider_cancel_time: null,
    provider_reason: null,
    ...initial,
  };
  const store: PaymeStore = {
    async getByOrderId(orderId) {
      return orderId === row.id ? row : null;
    },
    async getByTxnId(txnId) {
      return row.provider_txn_id === txnId ? row : null;
    },
    async attachTxn(_id, txnId, createTime) {
      row.provider_txn_id = txnId;
      row.provider_create_time = createTime;
      row.provider_state = PaymeState.Created;
    },
    async setPerformed(_id, performTime) {
      row.provider_state = PaymeState.Performed;
      row.provider_perform_time = performTime;
      row.status = "paid";
    },
    async setCanceled(_id, cancelTime, reason, newState) {
      row.provider_state = newState;
      row.provider_cancel_time = cancelTime;
      row.provider_reason = reason;
      row.status = "canceled";
    },
  };
  return { store, row };
}

const AMOUNT_TIYIN = 15000 * 100;

describe("Payme Merchant API handler", () => {
  it("CheckPerformTransaction: yaroqli → allow:true", async () => {
    const { store } = makeStore();
    const out = await handlePaymeRpc(
      {
        method: "CheckPerformTransaction",
        params: { amount: AMOUNT_TIYIN, account: { order_id: "intent-1" } },
      },
      store
    );
    expect(out).toEqual({ result: { allow: true } });
  });

  it("CheckPerformTransaction: buyurtma topilmadi → -31050", async () => {
    const { store } = makeStore();
    const out = await handlePaymeRpc(
      {
        method: "CheckPerformTransaction",
        params: { amount: AMOUNT_TIYIN, account: { order_id: "yo'q" } },
      },
      store
    );
    expect("error" in out && out.error.code).toBe(PaymeError.OrderNotFound);
  });

  it("CheckPerformTransaction: noto'g'ri summa → -31001", async () => {
    const { store } = makeStore();
    const out = await handlePaymeRpc(
      {
        method: "CheckPerformTransaction",
        params: { amount: 999, account: { order_id: "intent-1" } },
      },
      store
    );
    expect("error" in out && out.error.code).toBe(PaymeError.WrongAmount);
  });

  it("CreateTransaction: yangi tranzaksiya → state=1 va txn bog'lanadi", async () => {
    const { store, row } = makeStore();
    const out = await handlePaymeRpc(
      {
        method: "CreateTransaction",
        params: {
          id: "txn-A",
          time: 1000,
          amount: AMOUNT_TIYIN,
          account: { order_id: "intent-1" },
        },
      },
      store
    );
    expect("result" in out && out.result.state).toBe(PaymeState.Created);
    expect("result" in out && out.result.transaction).toBe("intent-1");
    expect(row.provider_txn_id).toBe("txn-A");
    expect(row.provider_create_time).toBe(1000);
  });

  it("CreateTransaction: o'sha txn qayta → idempotent (bir xil create_time)", async () => {
    const { store } = makeStore({
      provider_txn_id: "txn-A",
      provider_state: PaymeState.Created,
      provider_create_time: 1000,
    });
    const out = await handlePaymeRpc(
      {
        method: "CreateTransaction",
        params: {
          id: "txn-A",
          time: 5000,
          amount: AMOUNT_TIYIN,
          account: { order_id: "intent-1" },
        },
      },
      store
    );
    expect("result" in out && out.result.create_time).toBe(1000);
    expect("result" in out && out.result.state).toBe(PaymeState.Created);
  });

  it("CreateTransaction: boshqa txn band qilgan → -31008", async () => {
    const { store } = makeStore({
      provider_txn_id: "txn-A",
      provider_state: PaymeState.Created,
      provider_create_time: 1000,
    });
    const out = await handlePaymeRpc(
      {
        method: "CreateTransaction",
        params: {
          id: "txn-B",
          time: 5000,
          amount: AMOUNT_TIYIN,
          account: { order_id: "intent-1" },
        },
      },
      store
    );
    expect("error" in out && out.error.code).toBe(PaymeError.CannotPerform);
  });

  it("PerformTransaction: created → performed va intent 'paid'", async () => {
    const { store, row } = makeStore({
      provider_txn_id: "txn-A",
      provider_state: PaymeState.Created,
      provider_create_time: 1000,
    });
    const out = await handlePaymeRpc(
      { method: "PerformTransaction", params: { id: "txn-A" } },
      store,
      () => 2000
    );
    expect("result" in out && out.result.state).toBe(PaymeState.Performed);
    expect("result" in out && out.result.perform_time).toBe(2000);
    expect(row.status).toBe("paid");
  });

  it("PerformTransaction: allaqachon performed → idempotent", async () => {
    const { store } = makeStore({
      status: "paid",
      provider_txn_id: "txn-A",
      provider_state: PaymeState.Performed,
      provider_create_time: 1000,
      provider_perform_time: 2000,
    });
    const out = await handlePaymeRpc(
      { method: "PerformTransaction", params: { id: "txn-A" } },
      store
    );
    expect("result" in out && out.result.perform_time).toBe(2000);
    expect("result" in out && out.result.state).toBe(PaymeState.Performed);
  });

  it("PerformTransaction: txn topilmadi → -31003", async () => {
    const { store } = makeStore();
    const out = await handlePaymeRpc(
      { method: "PerformTransaction", params: { id: "yo'q" } },
      store
    );
    expect("error" in out && out.error.code).toBe(PaymeError.TxnNotFound);
  });

  it("CancelTransaction: created → state=-1", async () => {
    const { store, row } = makeStore({
      provider_txn_id: "txn-A",
      provider_state: PaymeState.Created,
      provider_create_time: 1000,
    });
    const out = await handlePaymeRpc(
      { method: "CancelTransaction", params: { id: "txn-A", reason: 3 } },
      store,
      () => 3000
    );
    expect("result" in out && out.result.state).toBe(
      PaymeState.CanceledBeforePerform
    );
    expect(row.status).toBe("canceled");
    expect(row.provider_reason).toBe(3);
  });

  it("CheckTransaction: holatni qaytaradi", async () => {
    const { store } = makeStore({
      provider_txn_id: "txn-A",
      provider_state: PaymeState.Performed,
      provider_create_time: 1000,
      provider_perform_time: 2000,
    });
    const out = await handlePaymeRpc(
      { method: "CheckTransaction", params: { id: "txn-A" } },
      store
    );
    expect("result" in out && out.result.state).toBe(PaymeState.Performed);
    expect("result" in out && out.result.create_time).toBe(1000);
    expect("result" in out && out.result.perform_time).toBe(2000);
  });

  it("Noma'lum metod → -32601", async () => {
    const { store } = makeStore();
    const out = await handlePaymeRpc({ method: "FooBar", params: {} }, store);
    expect("error" in out && out.error.code).toBe(-32601);
  });
});
