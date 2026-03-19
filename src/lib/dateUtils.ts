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
  const isSat = isSaturday(date);
  const isSun = isSunday(date);
  if (isSat) return { isHoliday: true, reason: "土曜日" };
  if (isSun) return { isHoliday: true, reason: "日曜日" };

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0: Sun, 1: Mon, ...

  // -- 1. 祝判定ロジック --
  const checkHoliday = (d: Date): string | null => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dayOfMonth = d.getDate();
    const dow = d.getDay();
    const dateStr = format(d, "MM-dd");

    // 固定祝日
    if (dateStr === "01-01") return "元日";
    if (dateStr === "02-11") return "建国記念の日";
    if (dateStr === "02-23") return "天皇誕生日";
    if (dateStr === "04-29") return "昭和の日";
    if (dateStr === "05-03") return "憲法記念日";
    if (dateStr === "05-04") return "みどりの日";
    if (dateStr === "05-05") return "こどもの日";
    if (dateStr === "08-11") return "山の日";
    if (dateStr === "11-03") return "文化の日";
    if (dateStr === "11-23") return "勤労感謝の日";

    // 春分の日 (簡易計算式: 2000-2099)
    const vernalDay = Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    if (m === 3 && dayOfMonth === vernalDay) return "春分の日";

    // 秋分の日 (簡易計算式: 2000-2099)
    const autumnalDay = Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    if (m === 9 && dayOfMonth === autumnalDay) return "秋分の日";

    // ハッピーマンデー
    if (dow === 1) {
      if (m === 1 && dayOfMonth >= 8 && dayOfMonth <= 14) return "成人の日";
      if (m === 7 && dayOfMonth >= 15 && dayOfMonth <= 21) return "海の日";
      if (m === 9 && dayOfMonth >= 15 && dayOfMonth <= 21) return "敬老の日";
      if (m === 10 && dayOfMonth >= 8 && dayOfMonth <= 14) return "スポーツの日";
    }

    return null;
  };

  // 本日の祝日判定
  const holidayName = checkHoliday(date);
  if (holidayName) return { isHoliday: true, reason: holidayName };

  // 振替休日の判定 (祝日が日曜日の場合、翌月曜日以降の最初の平日が休み)
  if (dayOfWeek !== 0) { // 日曜日以外
    let checkDay = new Date(date);
    // 前日まで遡る
    while (true) {
        checkDay.setDate(checkDay.getDate() - 1);
        const name = checkHoliday(checkDay);
        const dow = checkDay.getDay();
        if (name && dow === 0) return { isHoliday: true, reason: "振替休日" };
        if (!name) break; // 祝日が途切れたら終了
    }
  }

  // 国民の休日 (祝日に挟まれた平日)
  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    const yesterday = new Date(date); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(date); tomorrow.setDate(tomorrow.getDate() + 1);
    if (checkHoliday(yesterday) && checkHoliday(tomorrow)) return { isHoliday: true, reason: "国民の休日" };
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
