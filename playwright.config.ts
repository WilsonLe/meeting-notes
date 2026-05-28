import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.e2e\.ts/,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4187 --strictPort",
    url: "http://127.0.0.1:4187/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4187/",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
})
