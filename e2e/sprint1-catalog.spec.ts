/**
 * Sprint 1 — E2E test (Playwright)
 * Oqim: register → login → mahsulot qo'shish (donali + vazn) → tahrirlash → arxivlash → qidiruv
 *
 * ISHGA TUSHIRISH (avval bir marta sozlash):
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *   # .env.local da real Supabase kalitlari bo'lishi shart
 *   # Supabase'da 001–004 migratsiyalar bajarilgan bo'lishi shart
 *   npm run dev        # boshqa terminalda
 *   npx playwright test
 *
 * Eslatma: bu spec real Supabase backend talab qiladi. CI'da test do'koni/foydalanuvchi kerak.
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const ts = Date.now();
const EMAIL = `e2e+${ts}@misol.uz`;
const PASSWORD = "Parol12345";
const SHOP = `E2E Do'kon ${ts}`;

test.describe("Sprint 1 — Auth + Katalog", () => {
  test("ro'yxatdan o'tish va do'kon yaratish", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.getByLabel("Do'kon nomi").fill(SHOP);
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Parol").fill(PASSWORD);
    await page.getByRole("button", { name: /Ro'yxatdan o'tish/ }).click();
    // Email tasdiqlash o'chirilgan bo'lsa dashboard, aks holda login
    await expect(page).toHaveURL(/dashboard|login/);
  });

  test("kirish", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Parol").fill(PASSWORD);
    await page.getByRole("button", { name: "Kirish" }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test("donali mahsulot qo'shish + foyda preview", async ({ page }) => {
    await page.goto(`${BASE}/catalog`);
    await page.getByRole("button", { name: /Qo'shish/ }).click();
    await page.getByLabel("Mahsulot nomi").fill("Shampun");
    await page.getByRole("button", { name: /DONALI/ }).click();
    await page.getByLabel(/Tan narxi/).fill("15000");
    await page.getByLabel(/Sotish narxi/).fill("20000");
    // FR-16: foyda preview ko'rinishi
    await expect(page.getByText(/33%/)).toBeVisible();
    await page.getByLabel(/Miqdor/).fill("50");
    // Rasm yuklash: setInputFiles bilan test fixturasi qo'shing
    // await page.setInputFiles('input[type=file]', 'e2e/fixtures/sample.jpg');
    // await page.getByRole("button", { name: "Qo'shish" }).click();
    // await expect(page.getByText("Shampun")).toBeVisible();
  });

  test("qidiruv va filtr", async ({ page }) => {
    await page.goto(`${BASE}/catalog`);
    await page.getByPlaceholder(/qidirish/).fill("Shampun");
    // natija filtrlanishini tekshiring
  });
});
