import { test, expect } from "@playwright/test";

/**
 * Sotuv tarixi E2E — SKELET (Sprint 0).
 * To'liq ishlashi uchun kerak: test sessiyasi + seed sotuvlar.
 */
test.describe.skip("Sotuv tarixi", () => {
  test("tarix ro'yxati ko'rinadi va sotuv tafsilotini ochadi", async ({ page }) => {
    // 1. Login → /history
    // 2. Sotuvlar ro'yxati render bo'lishini tekshirish
    // 3. Sotuvni ochib qatorlar (sale_items) ko'rinishini tekshirish
    expect(true).toBe(true);
  });
});
