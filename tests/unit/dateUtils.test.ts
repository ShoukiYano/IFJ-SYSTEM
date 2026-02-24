import {
  calculateDueDate,
  isHolidayOrWeekend,
  checkServiceMonthMismatch,
} from "@/lib/dateUtils";

// ─── calculateDueDate ───────────────────────────────────────────
describe("calculateDueDate", () => {
  test("翌月末払い: 発行日2024-01-15, offset=1, paymentDay=31 → 2024-02-29", () => {
    const result = calculateDueDate(new Date("2024-01-15"), 31, 1, 31);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // 0-indexed → 2月
    expect(result.getDate()).toBe(29); // 2024年はうるう年
  });

  test("当月25日払い: offset=0, paymentDay=25", () => {
    const result = calculateDueDate(new Date("2024-03-01"), 31, 0, 25);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2); // 3月
    expect(result.getDate()).toBe(25);
  });

  test("翌々月10日払い: offset=2, paymentDay=10", () => {
    const result = calculateDueDate(new Date("2024-01-01"), 31, 2, 10);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2); // 3月
    expect(result.getDate()).toBe(10);
  });

  test("paymentDay=31 → 月末日を返す（2月）", () => {
    const result = calculateDueDate(new Date("2024-01-15"), 31, 1, 31);
    // 2024年2月 = 29日（うるう年）
    expect(result.getDate()).toBe(29);
  });

  test("paymentDay=31 → 月末日を返す（平年2月）", () => {
    const result = calculateDueDate(new Date("2023-01-15"), 31, 1, 31);
    // 2023年2月 = 28日
    expect(result.getDate()).toBe(28);
  });
});

// ─── isHolidayOrWeekend ─────────────────────────────────────────
describe("isHolidayOrWeekend", () => {
  test("土曜日は祝日扱い", () => {
    const saturday = new Date("2024-02-24"); // 土曜
    const result = isHolidayOrWeekend(saturday);
    expect(result.isHoliday).toBe(true);
    expect(result.reason).toBe("土曜日");
  });

  test("日曜日は祝日扱い", () => {
    const sunday = new Date("2024-02-25"); // 日曜
    const result = isHolidayOrWeekend(sunday);
    expect(result.isHoliday).toBe(true);
    expect(result.reason).toBe("日曜日");
  });

  test("元日(1/1)は祝日", () => {
    const result = isHolidayOrWeekend(new Date("2024-01-01"));
    expect(result.isHoliday).toBe(true);
    expect(result.reason).toBe("元日");
  });

  test("天皇誕生日(2/23)は祝日", () => {
    const result = isHolidayOrWeekend(new Date("2024-02-23"));
    expect(result.isHoliday).toBe(true);
    expect(result.reason).toBe("天皇誕生日");
  });

  test("通常の平日は祝日でない", () => {
    const weekday = new Date("2024-02-19"); // 月曜
    const result = isHolidayOrWeekend(weekday);
    expect(result.isHoliday).toBe(false);
  });
});

// ─── checkServiceMonthMismatch ───────────────────────────────────
describe("checkServiceMonthMismatch", () => {
  test("前月のSES請求（正常: 1ヶ月差）は警告なし", () => {
    // 発行日: 2024-02-01, サービス月: 2024年1月 → 差分=1ヶ月 → 正常
    const result = checkServiceMonthMismatch(new Date("2024-02-01"), "2024年1月");
    expect(result).toBe(false);
  });

  test("当月請求（差分=0）は正常", () => {
    const result = checkServiceMonthMismatch(new Date("2024-02-15"), "2024年2月");
    expect(result).toBe(false);
  });

  test("2ヶ月前（差分=2）は正常上限", () => {
    const result = checkServiceMonthMismatch(new Date("2024-03-01"), "2024年1月");
    expect(result).toBe(false);
  });

  test("3ヶ月前（差分=3）は警告あり", () => {
    const result = checkServiceMonthMismatch(new Date("2024-04-01"), "2024年1月");
    expect(result).toBe(true);
  });

  test("未来月（差分=-1）は警告あり", () => {
    const result = checkServiceMonthMismatch(new Date("2024-01-01"), "2024年2月");
    expect(result).toBe(true);
  });

  test("フォーマット不正な文字列は警告なし（trueを返さない）", () => {
    const result = checkServiceMonthMismatch(new Date("2024-02-01"), "不正な文字列");
    expect(result).toBe(false);
  });
});
