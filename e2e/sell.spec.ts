import { test, expect } from "@playwright/test";

/**
 * Sotuv oqimi E2E — SKELET (Sprint 0).
 * To'liq ishlashi uchun kerak: test foydalanuvchi sessiyasi + seed mahsulotlar.
 * Bu autentifikatsiya/seed infratuzilmasi keyingi sprintda qo'shilganda yoqiladi.
 */
test.describe.skip("Sotuv oqimi", () => {
  test("barcode bo'yicha mahsulot qo'shib donali sotuv", async ({ page }) => {
    // 1. Test foydalanuvchi sifatida login
    // 2. /sell ga o'tish
    // 3. Barcode kiritish/skanerlash → mahsulot savatga
    // 4. Sotuvni tasdiqlash → process_sale_cart
    // 5. Muvaffaqiyat + inventar kamayishini tekshirish
    expect(true).toBe(true);
  });

  test("kg (vazn) bo'yicha sotuv", async ({ page }) => {
    expect(true).toBe(true);
  });
});
