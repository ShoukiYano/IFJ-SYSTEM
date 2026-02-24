import { formatCurrency, calculateTax, generateInvoiceNumber } from "@/lib/utils";

// ─── formatCurrency ─────────────────────────────────────────────
describe("formatCurrency", () => {
  test("整数を日本円表記に変換", () => {
    expect(formatCurrency(100000)).toBe("￥100,000");
  });

  test("0円の表示", () => {
    expect(formatCurrency(0)).toBe("￥0");
  });

  test("マイナス金額の表示", () => {
    expect(formatCurrency(-5000)).toBe("-￥5,000");
  });

  test("1円の表示", () => {
    expect(formatCurrency(1)).toBe("￥1");
  });
});

// ─── calculateTax ───────────────────────────────────────────────
describe("calculateTax", () => {
  test("10%の消費税計算（切り捨て）", () => {
    // 55,555 × 0.1 = 5,555.5 → floor → 5,555
    expect(calculateTax(55555)).toBe(5555);
  });

  test("デフォルトtaxRate=0.1", () => {
    expect(calculateTax(100000)).toBe(10000);
  });

  test("8%の軽減税率", () => {
    // 10,000 × 0.08 = 800
    expect(calculateTax(10000, 0.08)).toBe(800);
  });

  test("切り捨て: 500,001 × 0.1 = 50,000.1 → 50,000", () => {
    expect(calculateTax(500001)).toBe(50000);
  });

  test("0円の税額は0", () => {
    expect(calculateTax(0)).toBe(0);
  });
});

// ─── generateInvoiceNumber ──────────────────────────────────────
describe("generateInvoiceNumber", () => {
  test("フォーマット: INV-YYYYMM-NNNN", () => {
    const result = generateInvoiceNumber(1);
    expect(result).toMatch(/^INV-\d{6}-\d{4}$/);
  });

  test("連番が4桁ゼロパディングされる", () => {
    const result = generateInvoiceNumber(42);
    expect(result).toMatch(/INV-\d{6}-0042$/);
  });

  test("連番999は4桁", () => {
    const result = generateInvoiceNumber(999);
    expect(result).toMatch(/INV-\d{6}-0999$/);
  });

  test("連番10000は5桁（オーバーフロー確認）", () => {
    const result = generateInvoiceNumber(10000);
    expect(result).toMatch(/INV-\d{6}-10000$/);
  });
});
