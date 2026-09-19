import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // These flows share seeded accounts and mutate ticket/user state. Run serially.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    // The API session cookie is SameSite=Strict. Keep app and API on localhost
    // so the browser sends it on subsequent authenticated requests.
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev --prefix server",
      url: "http://127.0.0.1:3000/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev --prefix client -- --host localhost",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
