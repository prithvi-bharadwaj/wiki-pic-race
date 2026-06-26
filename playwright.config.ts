import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  use: { baseURL: "http://localhost:4317" },
  webServer: {
    // dedicated port + never reuse, so the suite can't latch onto another app on :3000
    command: "pnpm exec next dev -p 4317",
    url: "http://localhost:4317",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
