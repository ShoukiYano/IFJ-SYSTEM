/**
 * SES テンプレートの超過・控除計算ロジック単体テスト
 * new/page.tsx および edit/page.tsx 内の calculateItemAmount と同等のロジックを
 * ここでは純粋関数として定義してテストする
 */

// ─── テスト対象の純粋関数（ページとロジックを分離して再現） ───
type Item = {
  quantity: number;
  unitPrice: number;
  minHours: number;
  maxHours: number;
  overtimeRate: number;
  deductionRate: number;
  overtimeAmount?: number;
  deductionAmount?: number;
  amount?: number;
};

function calculateItemAmountSES(item: Item): Item {
  const hours = Number(item.quantity) || 0;
  const min   = Number(item.minHours) || 0;
  const max   = Number(item.maxHours) || 0;
  const otRate = Number(item.overtimeRate) || 0;
  const deRate = Number(item.deductionRate) || 0;

  const overtimeAmount  = hours > max ? (hours - max) * otRate : 0;
  const deductionAmount = hours < min ? (min - hours) * deRate : 0;
  const amount = Number(item.unitPrice) + overtimeAmount - deductionAmount;

  return { ...item, overtimeAmount, deductionAmount, amount };
}

function autoCalcRates(unitPrice: number, minHours: number, maxHours: number) {
  return {
    overtimeRate:  Math.floor(unitPrice / maxHours),
    deductionRate: Math.floor(unitPrice / minHours),
  };
}

// ─── autoCalcRates（単価÷精算幅 自動計算）──────────────────────
describe("autoCalcRates (精算幅からの自動計算)", () => {
  const unitPrice = 600000;
  const min = 140, max = 180;

  test("超過単価 = floor(600000 / 180) = 3333", () => {
    const { overtimeRate } = autoCalcRates(unitPrice, min, max);
    expect(overtimeRate).toBe(3333);
  });

  test("控除単価 = floor(600000 / 140) = 4285", () => {
    const { deductionRate } = autoCalcRates(unitPrice, min, max);
    expect(deductionRate).toBe(4285);
  });

  test("単価500000 / 精算幅160-200の場合", () => {
    const { overtimeRate, deductionRate } = autoCalcRates(500000, 160, 200);
    expect(overtimeRate).toBe(2500);   // floor(500000/200)
    expect(deductionRate).toBe(3125); // floor(500000/160)
  });
});

// ─── calculateItemAmountSES ─────────────────────────────────────
describe("calculateItemAmountSES", () => {
  const baseItem: Item = {
    unitPrice: 600000,
    minHours: 140,
    maxHours: 180,
    overtimeRate: 3333,
    deductionRate: 4285,
    quantity: 160, // 精算範囲内
  };

  test("精算範囲内 (160h): 超過・控除ゼロ、金額=単価", () => {
    const result = calculateItemAmountSES(baseItem);
    expect(result.overtimeAmount).toBe(0);
    expect(result.deductionAmount).toBe(0);
    expect(result.amount).toBe(600000);
  });

  test("精算範囲内 最小境界値 (140h): 超過・控除ゼロ", () => {
    const result = calculateItemAmountSES({ ...baseItem, quantity: 140 });
    expect(result.overtimeAmount).toBe(0);
    expect(result.deductionAmount).toBe(0);
    expect(result.amount).toBe(600000);
  });

  test("精算範囲内 最大境界値 (180h): 超過・控除ゼロ", () => {
    const result = calculateItemAmountSES({ ...baseItem, quantity: 180 });
    expect(result.overtimeAmount).toBe(0);
    expect(result.deductionAmount).toBe(0);
    expect(result.amount).toBe(600000);
  });

  test("超過 (190h): (190-180) × 3333 = +33330", () => {
    const result = calculateItemAmountSES({ ...baseItem, quantity: 190 });
    expect(result.overtimeAmount).toBe(33330);
    expect(result.deductionAmount).toBe(0);
    expect(result.amount).toBe(600000 + 33330);
  });

  test("控除 (130h): (140-130) × 4285 = -42850", () => {
    const result = calculateItemAmountSES({ ...baseItem, quantity: 130 });
    expect(result.overtimeAmount).toBe(0);
    expect(result.deductionAmount).toBe(42850);
    expect(result.amount).toBe(600000 - 42850);
  });

  test("稼働0h: 全控除 (0-140) × 4285 = -599900", () => {
    const result = calculateItemAmountSES({ ...baseItem, quantity: 0 });
    expect(result.deductionAmount).toBe(140 * 4285);
    expect(result.amount).toBe(600000 - 140 * 4285);
  });

  test("単価・rateが0の場合: 金額も0", () => {
    const result = calculateItemAmountSES({
      ...baseItem,
      unitPrice: 0,
      overtimeRate: 0,
      deductionRate: 0,
      quantity: 200,
    });
    expect(result.overtimeAmount).toBe(0);
    expect(result.amount).toBe(0);
  });

  test("小数時間 (160.5h): 精算範囲内のまま", () => {
    const result = calculateItemAmountSES({ ...baseItem, quantity: 160.5 });
    expect(result.overtimeAmount).toBe(0);
    expect(result.deductionAmount).toBe(0);
    expect(result.amount).toBe(600000);
  });

  test("小数時間 (180.5h): 超過 0.5h × 3333 = 1666.5", () => {
    const result = calculateItemAmountSES({ ...baseItem, quantity: 180.5 });
    expect(result.overtimeAmount).toBe(0.5 * 3333);
    expect(result.amount).toBeCloseTo(600000 + 0.5 * 3333, 5);
  });
});
