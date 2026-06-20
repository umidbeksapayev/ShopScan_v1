import { describe, it, expect } from "vitest";
import {
  generateInternalBarcode,
  isValidEan13,
  LABEL_BARCODE_FORMAT,
} from "../barcode-format";

describe("barcode-format", () => {
  it("generateInternalBarcode: 8 xonali, '2' bilan boshlanadi", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInternalBarcode();
      expect(code).toMatch(/^2\d{7}$/);
    }
  });

  it("generateInternalBarcode: turli chaqiruvlar har xil (yuqori ehtimol)", () => {
    const set = new Set(Array.from({ length: 100 }, () => generateInternalBarcode()));
    // 100M diapazon → 100 ta namuna deyarli unik
    expect(set.size).toBeGreaterThan(95);
  });

  it("isValidEan13: to'g'ri kodni qabul qiladi", () => {
    expect(isValidEan13("5901234123457")).toBe(true); // klassik namuna
  });

  it("isValidEan13: noto'g'ri nazorat raqami / uzunlikni rad etadi", () => {
    expect(isValidEan13("5901234123450")).toBe(false);
    expect(isValidEan13("123")).toBe(false);
    expect(isValidEan13("abcdefghijklm")).toBe(false);
  });

  it("yorliq formati CODE128 (zich raqamlar)", () => {
    expect(LABEL_BARCODE_FORMAT).toBe("CODE128");
  });
});
