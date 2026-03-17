import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { tenantId } = context;
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // 1. 全スタッフ（有効なもの）を取得
    const staffs = await (prisma as any).staff.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" }
    });

    // 2. 本日の打刻レコードを取得
    const records = await (prisma as any).attendanceRecord.findMany({
      where: {
        tenantId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        workReport: true
      }
    });

    // 3. 本日のシフトを取得
    const shifts = await (prisma as any).shift.findMany({
      where: {
        tenantId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    // 4. サマリー計算
    const totalStaff = staffs.length;
    const clockedInCount = records.filter((r: any) => r.clockIn).length;
    const clockedOutCount = records.filter((r: any) => r.clockOut).length;
    const lateCount = records.filter((r: any) => r.hasDiscrepancy).length;
    const pendingReportsCount = records.filter((r: any) => r.status === "SUBMITTED").length;

    return NextResponse.json({
      summary: {
        totalStaff,
        clockedInCount,
        clockedOutCount,
        lateCount,
        pendingReportsCount
      },
      staffs: staffs.map((s: any) => {
        const record = records.find((r: any) => r.staffId === s.id);
        const shift = shifts.find((sh: any) => sh.staffId === s.id);
        return {
          ...s,
          todayRecord: record,
          todayShift: shift
        };
      })
    });
  } catch (error) {
    console.error("GET /api/attendance/summary error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
