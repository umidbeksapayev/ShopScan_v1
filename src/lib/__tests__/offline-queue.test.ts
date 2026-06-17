import { describe, it, expect } from "vitest";
import {
  upsertSale,
  removeSale,
  patchSale,
  countByStatus,
  type QueuedSale,
} from "@/lib/offline-queue";

function sale(p: Partial<QueuedSale> & { clientId: string }): QueuedSale {
  return {
    clientId: p.clientId,
    shopId: "s1",
    items: [{ product_id: "p1", quantity: 1 }],
    method: "manual",
    customerId: null,
    paidAmount: null,
    receiptItems: [],
    totalRevenue: p.totalRevenue ?? 1000,
    customerName: null,
    createdAt: "2026-06-17T00:00:00Z",
    status: p.status ?? "pending",
    error: p.error,
  };
}

describe("upsertSale", () => {
  it("yangi sotuvni qo'shadi", () => {
    const res = upsertSale([], sale({ clientId: "a" }));
    expect(res).toHaveLength(1);
  });

  it("mavjud clientId'ni almashtiradi (dublikat emas)", () => {
    const list = [sale({ clientId: "a", totalRevenue: 1000 })];
    const res = upsertSale(list, sale({ clientId: "a", totalRevenue: 2000 }));
    expect(res).toHaveLength(1);
    expect(res[0].totalRevenue).toBe(2000);
  });
});

describe("removeSale", () => {
  it("clientId bo'yicha o'chiradi", () => {
    const list = [sale({ clientId: "a" }), sale({ clientId: "b" })];
    expect(removeSale(list, "a").map((s) => s.clientId)).toEqual(["b"]);
  });

  it("mavjud bo'lmasa o'zgarmaydi", () => {
    const list = [sale({ clientId: "a" })];
    expect(removeSale(list, "x")).toHaveLength(1);
  });
});

describe("patchSale", () => {
  it("status va xatoni yangilaydi", () => {
    const list = [sale({ clientId: "a" })];
    const res = patchSale(list, "a", { status: "failed", error: "qoldiq yetmadi" });
    expect(res[0].status).toBe("failed");
    expect(res[0].error).toBe("qoldiq yetmadi");
  });

  it("boshqa sotuvlarga tegmaydi", () => {
    const list = [sale({ clientId: "a" }), sale({ clientId: "b" })];
    const res = patchSale(list, "a", { status: "failed" });
    expect(res[1].status).toBe("pending");
  });
});

describe("countByStatus", () => {
  it("pending va failed sonini sanaydi", () => {
    const list = [
      sale({ clientId: "a", status: "pending" }),
      sale({ clientId: "b", status: "failed" }),
      sale({ clientId: "c", status: "pending" }),
    ];
    expect(countByStatus(list)).toEqual({ pending: 2, failed: 1 });
  });

  it("bo'sh ro'yxat → 0/0", () => {
    expect(countByStatus([])).toEqual({ pending: 0, failed: 0 });
  });
});
