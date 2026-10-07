import { defineConfig, devices } from '@playwright/test';

// End-to-end tests. Run them with `npm run e2e`, which starts the test copy of the shop first
// (see e2e/run.mjs); `npx playwright test` alone expects it to be running already.
export default defineConfig({
  testDir: './e2e/tests',
  // One shopper journey builds on the last (the order placed is then handled in the admin).
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_STORE_URL ?? 'http://localhost:3500',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // On Windows the installed Edge is used, so no browser download is needed; CI installs Chromium.
    ...(process.platform === 'win32' && !process.env.CI ? { channel: 'msedge' } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Most shoppers are on mid-range Android phones.
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /shopping\.spec\.ts/ },
  ],
});
