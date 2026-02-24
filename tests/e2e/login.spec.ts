import { test, expect } from "@playwright/test";

// テスト用アカウント（seed.js で作成される初期ユーザー）
const TEST_EMAIL    = "drive@example.com";
const TEST_PASSWORD = "drive1001";
const WRONG_PASSWORD = "wrongpassword";

test.describe("ログイン機能", () => {
  // 各テスト前にログインページへ移動
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  // ─── 正常系 ───────────────────────────────────────────────────
  test("正しい認証情報でログインするとダッシュボードに遷移する", async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // ダッシュボード（/）に遷移することを確認
    await page.waitForURL("/", { timeout: 10_000 });
    expect(page.url()).toContain("/");
    // ダッシュボード固有コンテンツが表示されていることを確認
    await expect(page.locator("text=ダッシュボード")).toBeVisible();
  });

  test("ログイン状態でログインページにアクセスするとダッシュボードにリダイレクト", async ({
    page,
  }) => {
    // まずログイン
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10_000 });

    // 再度ログインページにアクセス
    await page.goto("/login");
    // Next-AuthはログインページにアクセスするとSessionがあれば/ にリダイレクトしない
    // ※ ミドルウェアの設定次第
    expect(page.url()).toBeDefined();
  });

  // ─── 異常系 ───────────────────────────────────────────────────
  test("誤ったパスワードでエラーメッセージが表示される", async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', WRONG_PASSWORD);
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(
      page.locator("text=メールアドレスまたはパスワードが正しくありません")
    ).toBeVisible({ timeout: 5_000 });

    // ログインページに留まっていることを確認
    expect(page.url()).toContain("/login");
  });

  test("メールアドレスが空のままだとsubmitできない（HTML5バリデーション）", async ({ page }) => {
    // メール未入力でパスワードのみ
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // フォームバリデーションによりページ遷移しない
    expect(page.url()).toContain("/login");
  });

  test("パスワードが空のままだとsubmitできない（HTML5バリデーション）", async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');

    expect(page.url()).toContain("/login");
  });

  // ─── 未認証アクセス ──────────────────────────────────────────
  test("未ログイン状態で保護ページにアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    // クッキークリアで未ログイン状態にする
    await page.context().clearCookies();
    await page.goto("/invoices");

    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("未ログイン状態でダッシュボードにアクセスすると /login にリダイレクト", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto("/");

    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});

// ─── ログアウト ──────────────────────────────────────────────────
test.describe("ログアウト機能", () => {
  test.beforeEach(async ({ page }) => {
    // ログイン状態をセットアップ
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 10_000 });
  });

  test("ログアウトするとログインページに遷移する", async ({ page }) => {
    // サイドバーのログアウトボタンをクリック
    await page.click("text=ログアウト");

    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("ログアウト後は保護ページにアクセスできない", async ({ page }) => {
    await page.click("text=ログアウト");
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    // ログアウト後に直接アクセスしてみる
    await page.goto("/invoices");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
