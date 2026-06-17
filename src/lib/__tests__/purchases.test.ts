import { describe, it, expect } from "vitest";
import { weightedAvgCost, lineTotal } from "@/lib/purchases";

describe("weightedAvgCost", () => {
  it("o'rtacha (weighted average) tan narxni hisoblaydi", () => {
    // 10×1000 + 10×2000 = 30000 / 20 = 1500
    expect(weightedAvgCost(10, 1000, 10, 2000)).toBe(1500);
  });

  it("eski zaxira 0 bo'lsa — kirim narxi", () => {
    expect(weightedAvgCost(0, 0, 5, 1200)).toBe(1200);
  });

  it("narx teng bo'lsa o'zgarmaydi", () => {
    expect(weightedAvgCost(3, 1000, 7, 1000)).toBe(1000);
  });

  it("umumiy miqdor 0 bo'lsa — kirim narxini qaytaradi (bo'lishdan himoya)", () => {
    expect(weightedAvgCost(0, 500, 0, 800)).toBe(800);
  });
});

describe("lineTotal", () => {
  it("miqdor × narx", () => {
    expect(lineTotal(3, 1500)).toBe(4500);
  });

  it("kasr miqdor (kg) bilan ishlaydi", () => {
    expect(lineTotal(2.5, 1000)).toBe(2500);
  });
});
