import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E skeleton — Sprint 0.
 * Lokal ishga tushirish: `npm run test:e2e` (dev server avtomatik ko'tariladi).
 * Eslatma: to'liq oqimlar (login, sotuv) ishlashi uchun .env.local da haqiqiy
 * Supabase qiymatlari kerak. CI bu testlarni bloklamaydi (alohida ishlaydi).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
