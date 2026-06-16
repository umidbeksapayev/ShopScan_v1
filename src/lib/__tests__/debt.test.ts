import { describe, it, expect } from "vitest";
import { saleDebt, remainingDebt, computeCustomerBalance } from "@/lib/debt";

describe("saleDebt", () => {
  it("to'lanmagan qismni qaytaradi", () => {
    expect(saleDebt(10000, 4000)).toBe(6000);
  });
  it("to'liq to'langanda 0", () => {
    expect(saleDebt(10000, 10000)).toBe(0);
  });
  it("ortiqcha to'lovda manfiy bo'lmaydi", () => {
    expect(saleDebt(10000, 12000)).toBe(0);
  });
});

describe("remainingDebt", () => {
  it("checkout qoldig'ini hisoblaydi", () => {
    expect(remainingDebt(50000, 20000)).toBe(30000);
  });
  it("to'liq to'lovda 0", () => {
    expect(remainingDebt(50000, 50000)).toBe(0);
  });
  it("manfiy bo'lmaydi", () => {
    expect(remainingDebt(50000, 60000)).toBe(0);
  });
});

describe("computeCustomerBalance", () => {
  it("qarz − to'lovlar formulasi", () => {
    const sales = [
      { total_revenue: 10000, paid_amount: 4000 }, // 6000 qarz
      { total_revenue: 20000, paid_amount: 20000 }, // naqd, qarz yo'q
      { total_revenue: 5000, paid_amount: 0 }, // 5000 qarz
    ];
    const payments = [{ amount: 3000 }];
    // (6000 + 0 + 5000) − 3000 = 8000
    expect(computeCustomerBalance(sales, payments)).toBe(8000);
  });

  it("barcha sotuvlar naqd → balans 0", () => {
    expect(
      computeCustomerBalance([{ total_revenue: 1000, paid_amount: 1000 }], [])
    ).toBe(0);
  });

  it("ortiqcha to'lov → manfiy balans (do'kon qarzdor)", () => {
    expect(
      computeCustomerBalance(
        [{ total_revenue: 5000, paid_amount: 0 }],
        [{ amount: 8000 }]
      )
    ).toBe(-3000);
  });

  it("bo'sh ma'lumotda 0", () => {
    expect(computeCustomerBalance([], [])).toBe(0);
  });
});
