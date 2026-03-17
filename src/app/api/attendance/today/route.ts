import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { userId, tenantId } = context;

    // 1. User に紐づく Staff を特定
    const staff = await (prisma as any).staff.findFirst({
      where: { userId, tenantId, deletedAt: null }
    });

    if (!staff) {
      return NextResponse.json({ error: "従業員情報が見つかりません" }, { status: 404 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // 2. 本日の打刻レコード取得
    const record = await (prisma as any).attendanceRecord.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: todayStart
        }
      },
      include: {
        workReport: true
      }
    });

    // 3. 本日のシフト取得
    const shift = await (prisma as any).shift.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: todayStart
        }
      }
    });

    // 4. 前日の報告状況チェック (直近の営業日を取得するのが理想だが、簡易的に「昨日」を確認)
    // ※実際には「最後に打刻した日」の報告が出ているかを確認すべき
    const lastWorkingRecord = await (prisma as any).attendanceRecord.findFirst({
      where: {
        staffId: staff.id,
        date: { lt: todayStart },
        clockIn: { not: null }
      },
      orderBy: { date: "desc" }
    });

    const isPreviousReportMissing = lastWorkingRecord && 
      (lastWorkingRecord.status === "STAMPED" || lastWorkingRecord.status === "REMANDED");

    return NextResponse.json({
      staff,
      record,
      shift,
      isPreviousReportMissing,
      lastWorkingDate: lastWorkingRecord?.date
    });
  } catch (error) {
    console.error("GET /api/attendance/today error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
