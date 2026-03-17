export const dynamic = "force-dynamic";

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

    // 2. 打刻レコード取得（日跨ぎ対応：まず未退勤のレコードを探す）
    let record = await (prisma as any).attendanceRecord.findFirst({
      where: {
        staffId: staff.id,
        clockIn: { not: null },
        clockOut: null,
      },
      include: {
        workReport: true
      },
      orderBy: { date: "desc" }
    });

    // 未退勤レコードがなければ、本日（日付指定）のレコードを探す
    if (!record) {
      record = await (prisma as any).attendanceRecord.findUnique({
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
    }

    // 3. 本日のシフト取得 (record が yesterday のものでも、基本的には record.date に基づくシフトを出すべき)
    const activeDate = record ? record.date : todayStart;
    const shift = await (prisma as any).shift.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: activeDate
        }
      }
    });

    // 4. 前日の報告状況チェック
    // record が「昨日の未完了分」である場合は、それは「前日の報告漏れ」とは扱わず「現在進行中」とする
    const lastWorkingRecord = await (prisma as any).attendanceRecord.findFirst({
      where: {
        staffId: staff.id,
        date: { lt: activeDate },
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
