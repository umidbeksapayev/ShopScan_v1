import { describe, it, expect } from "vitest";
import { returnableQty } from "@/lib/returns";

describe("returnableQty", () => {
  it("hech narsa qaytarilmagan → hammasi qaytariladi", () => {
    expect(returnableQty(5, 0)).toBe(5);
  });

  it("qisman qaytarilgan → qolgani", () => {
    expect(returnableQty(5, 2)).toBe(3);
  });

  it("hammasi qaytarilgan → 0", () => {
    expect(returnableQty(5, 5)).toBe(0);
  });

  it("ortiqcha qaytarilgan (himoya) → manfiy emas, 0", () => {
    expect(returnableQty(5, 7)).toBe(0);
  });

  it("vazn (kasr) qiymatlar", () => {
    expect(returnableQty(2.5, 1)).toBe(1.5);
  });
});
