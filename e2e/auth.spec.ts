import { test, expect } from "@playwright/test";

/**
 * Auth smoke testlar — haqiqiy Supabase ma'lumotisiz ishlaydi
 * (login UI render + himoyalangan marshrut redirecti middleware orqali).
 */
test.describe("Auth", () => {
  test("login sahifasi render bo'ladi", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "ShopScan" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("autentifikatsiyasiz dashboard → login ga yo'naltiriladi", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("register sahifasiga havola ishlaydi", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /.+/ }).last().click();
    await expect(page).toHaveURL(/\/register/);
  });
});
