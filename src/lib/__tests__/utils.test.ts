import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatWeight,
  calculateProfit,
  computeLowStockThreshold,
  normalizeBarcode,
  barcodeVariants,
} from "@/lib/utils";

/** Faqat raqamlarni qoldiradi — lokal ajratuvchi (bo'shliq/vergul) ga bog'liq bo'lmaslik uchun. */
const digits = (s: string) => s.replace(/\D/g, "");

describe("formatCurrency", () => {
  it("nol uchun ajratuvchisiz va so'm bilan", () => {
    expect(formatCurrency(0)).toBe("0 so'm");
  });

  it('har doim " so\'m" bilan tugaydi', () => {
    expect(formatCurrency(50).endsWith(" so'm")).toBe(true);
  });

  it("raqamlarni saqlaydi (ajratuvchidan qat'i nazar)", () => {
    expect(digits(formatCurrency(1234567))).toBe("1234567");
  });

  it("kasr qismini butun songa yaxlitlaydi", () => {
    expect(digits(formatCurrency(1234.56))).toBe("1235");
    expect(formatCurrency(0.4)).toBe("0 so'm");
  });
});

describe("formatWeight", () => {
  it(">= 1 kg uchun 3 kasr bilan kg", () => {
    expect(formatWeight(1)).toBe("1.000 kg");
    expect(formatWeight(2.5)).toBe("2.500 kg");
  });

  it("< 1 kg uchun grammda", () => {
    expect(formatWeight(0.5)).toBe("500 gramm");
    expect(formatWeight(0.25)).toBe("250 gramm");
    expect(formatWeight(0.999)).toBe("999 gramm");
  });
});

describe("calculateProfit", () => {
  it("foyda va foizni hisoblaydi", () => {
    expect(calculateProfit(1500, 1000)).toEqual({ profit: 500, profitPercent: 50 });
  });

  it("zarar (manfiy) holatini qo'llaydi", () => {
    expect(calculateProfit(800, 1000)).toEqual({ profit: -200, profitPercent: -20 });
  });

  it("tan narx 0 bo'lsa foiz 0 (bo'lishdan himoya)", () => {
    expect(calculateProfit(1000, 0)).toEqual({ profit: 1000, profitPercent: 0 });
  });
});

describe("computeLowStockThreshold", () => {
  it("miqdor 0 yoki manfiy bo'lsa 0", () => {
    expect(computeLowStockThreshold(0, "unit")).toBe(0);
    expect(computeLowStockThreshold(-5, "unit")).toBe(0);
  });

  it("donali: 20% ni yuqoriga yaxlitlaydi (kamida 1)", () => {
    expect(computeLowStockThreshold(100, "unit")).toBe(20);
    expect(computeLowStockThreshold(7, "unit")).toBe(2); // 1.4 -> ceil 2
    expect(computeLowStockThreshold(1, "unit")).toBe(1); // 0.2 -> ceil 1
  });

  it("vazn: 20% ni 1 gramm aniqlikda", () => {
    expect(computeLowStockThreshold(10, "weight")).toBe(2);
    expect(computeLowStockThreshold(5.5, "weight")).toBe(1.1);
  });
});

describe("normalizeBarcode", () => {
  it("bo'shliq va belgilarni olib tashlaydi", () => {
    expect(normalizeBarcode(" 123 456 ")).toBe("123456");
    expect(normalizeBarcode("abc-123")).toBe("abc123");
    expect(normalizeBarcode("!@#$%")).toBe("");
  });

  it("EAN-13 boshlovchi nollarini saqlaydi", () => {
    expect(normalizeBarcode("0012300")).toBe("0012300");
  });
});

describe("barcodeVariants", () => {
  it("UPC-A (12) → EAN-13 yetakchi nol shaklini ham beradi", () => {
    expect(barcodeVariants("036000291452").sort()).toEqual(
      ["036000291452", "0036000291452"].sort()
    );
  });

  it("yetakchi nolli EAN-13 (13) → UPC-A (12) shaklini ham beradi", () => {
    expect(barcodeVariants("0036000291452").sort()).toEqual(
      ["036000291452", "0036000291452"].sort()
    );
  });

  it("oddiy EAN-13 (yetakchi nolsiz) o'zgarmaydi", () => {
    expect(barcodeVariants("5449000000996")).toEqual(["5449000000996"]);
  });

  it("raqamsiz kod (CODE128/QR) o'zgarmaydi", () => {
    expect(barcodeVariants("ABC-123x")).toEqual(["ABC123x"]);
  });

  it("bo'sh kirish bo'sh massiv", () => {
    expect(barcodeVariants("")).toEqual([]);
    expect(barcodeVariants("  ")).toEqual([]);
  });
});
