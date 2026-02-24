import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // 全テストのタイムアウト
  timeout: 30_000,
  // 失敗時に1ライトライ
  retries: 1,
  // ヘッドレスで実行
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // E2Eテストを実行する前にdev serverを自動で起動しない（Docker環境想定）
  webServer: undefined,
});
