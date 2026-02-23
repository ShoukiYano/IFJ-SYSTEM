import { addMonths, setDate, lastDayOfMonth, isSaturday, isSunday, format } from "date-fns";

/**
 * 取引先の締め日・支払条件に基づいて、支払期限を計算する
 */
export function calculateDueDate(
  issueDate: Date,
  closingDay: number,
  paymentMonthOffset: number,
  paymentDay: number
): Date {
  // 1. 締め日に基づいて、対象の「月」を確定させる（現在は発行日ベース）
  // 簡易化のため、発行日の月にoffsetを加算
  let targetDate = addMonths(issueDate, paymentMonthOffset);

  // 2. 支払日を設定
  if (paymentDay >= 31) {
    targetDate = lastDayOfMonth(targetDate);
  } else {
    // 指定された日がその月に存在しない場合は月末にする
    const lastDay = lastDayOfMonth(targetDate).getDate();
    targetDate = setDate(targetDate, Math.min(paymentDay, lastDay));
  }

  return targetDate;
}

/**
 * 日本の祝日・週末判定（簡易版）
 * 本来は内閣府公表のCSV等を使うべきだが、デモ用に主要な祝日と週末を判定
 */
export function isHolidayOrWeekend(date: Date): { isHoliday: boolean; reason?: string } {
  if (isSaturday(date)) return { isHoliday: true, reason: "土曜日" };
  if (isSunday(date)) return { isHoliday: true, reason: "日曜日" };

  const dateStr = format(date, "MM-dd");
  const holidays: Record<string, string> = {
    "01-01": "元日",
    "01-02": "正月休み",
    "01-03": "正月休み",
    "02-11": "建国記念の日",
    "02-23": "天皇誕生日",
    "04-29": "昭和の日",
    "05-03": "憲法記念日",
    "05-04": "みどりの日",
    "05-05": "こどもの日",
    "08-11": "山の日",
    "11-03": "文化の日",
    "11-23": "勤労感謝の日",
    "12-31": "大晦日",
  };

  if (holidays[dateStr]) {
    return { isHoliday: true, reason: holidays[dateStr] };
  }

  return { isHoliday: false };
}

/**
 * サービス月と発行日の不整合をチェック（2ヶ月以上の乖離を警告）
 */
export function checkServiceMonthMismatch(issueDate: Date, serviceMonthStr: string): boolean {
  // serviceMonthStr: "2024年8月"
  const match = serviceMonthStr.match(/(\d+)年(\d+)月/);
  if (!match) return false;

  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // 0-indexed
  const serviceDate = new Date(year, month, 1);

  const diffMonths = (issueDate.getFullYear() - serviceDate.getFullYear()) * 12 + (issueDate.getMonth() - serviceDate.getMonth());
  
  // 発行日の前月または当月であれば正常とする（SESは翌月請求が多いため）
  return diffMonths < 0 || diffMonths > 2;
}
