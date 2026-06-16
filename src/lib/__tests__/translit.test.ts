import { describe, it, expect } from "vitest";
import { normalizeSearch, matchScore } from "@/lib/translit";

describe("normalizeSearch", () => {
  it("kichik harfga keltiradi va bo'shliqni tozalaydi", () => {
    expect(normalizeSearch("  OLMA  ")).toBe("olma");
    expect(normalizeSearch("qora   choy")).toBe("qora choy");
  });

  it("kirilni lotinga o'giradi", () => {
    expect(normalizeSearch("Олма")).toBe("olma");
    expect(normalizeSearch("Шакар")).toBe("shakar");
    expect(normalizeSearch("ў")).toBe("o");
  });

  it("apostrof variantlarini olib tashlaydi", () => {
    expect(normalizeSearch("o'lma")).toBe("olma");
    expect(normalizeSearch("oʻlma")).toBe("olma");
  });
});

describe("matchScore", () => {
  it("nom boshidan mos kelsa 2", () => {
    expect(matchScore("Olma", "olm")).toBe(2);
  });

  it("ichida bo'lsa 1", () => {
    expect(matchScore("Qizil olma", "olma")).toBe(1);
  });

  it("mos kelmasa 0", () => {
    expect(matchScore("Olma", "banan")).toBe(0);
  });

  it("bo'sh so'rov uchun 0", () => {
    expect(matchScore("Olma", "")).toBe(0);
  });

  it("kiril nom lotin so'rovga mos keladi (kross-skript)", () => {
    expect(matchScore("Олма", "olma")).toBe(2);
  });
});
