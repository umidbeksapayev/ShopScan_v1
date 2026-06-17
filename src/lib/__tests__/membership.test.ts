import { describe, it, expect } from "vitest";
import { canDo } from "@/lib/membership";

describe("canDo", () => {
  it("ega — har doim ruxsat bor", () => {
    expect(canDo("owner", {}, "view_reports")).toBe(true);
    expect(canDo("owner", undefined, "manage_products")).toBe(true);
    expect(canDo("owner", { purchase: false }, "purchase")).toBe(true);
  });

  it("kassir — faqat yoqilgan ruxsat", () => {
    expect(canDo("cashier", { purchase: true }, "purchase")).toBe(true);
    expect(canDo("cashier", { purchase: true }, "returns")).toBe(false);
    expect(canDo("cashier", {}, "view_reports")).toBe(false);
    expect(canDo("cashier", { view_cost: false }, "view_cost")).toBe(false);
  });

  it("a'zo bo'lmasa — ruxsat yo'q", () => {
    expect(canDo(undefined, undefined, "view_reports")).toBe(false);
  });
});
