import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfMonth, endOfMonth, differenceInMinutes } from "date-fns";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { tenantId } = context;
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month"); // e.g. 2024-03
    
    const targetDate = monthStr ? new Date(monthStr + "-01") : new Date();
    const rangeStart = startOfMonth(targetDate);
    const rangeEnd = endOfMonth(targetDate);

    // 1. 全スタッフ取得
    const staffs = await (prisma as any).staff.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        client: true
      }
    });

    // 2. 期間内の打刻レコード（承認済み or 提出済み）を取得
    const records = await (prisma as any).attendanceRecord.findMany({
      where: {
        tenantId,
        date: { gte: rangeStart, lte: rangeEnd },
        status: { in: ["APPROVED", "SUBMITTED", "STAMPED"] }
      }
    });

    // 3. 集計
    const summary = staffs.map((staff: any) => {
      const staffRecords = records.filter((r: any) => r.staffId === staff.id);
      
      let totalMinutes = 0;
      let daysWorked = 0;

      staffRecords.forEach((r: any) => {
        if (r.clockIn && r.clockOut) {
          // 休憩時間を固定1時間（60分）引くロジック（簡易版）
          const diff = differenceInMinutes(new Date(r.clockOut), new Date(r.clockIn)) - 60;
          totalMinutes += Math.max(0, diff);
          daysWorked++;
        }
      });

      const totalHours = Number((totalMinutes / 60).toFixed(2));
      const minHours = staff.minHours || 140;
      const maxHours = staff.maxHours || 180;

      let status = "NORMAL";
      if (totalHours < minHours) status = "SHORTAGE";
      if (totalHours > maxHours) status = "OVERTIME";

      return {
        staffId: staff.id,
        name: staff.name,
        clientName: staff.client?.name,
        totalHours,
        daysWorked,
        minHours,
        maxHours,
        status,
        unitPrice: Number(staff.unitPrice)
      };
    });

    return NextResponse.json(summary);

  } catch (error) {
    console.error("GET /api/attendance/monthly-summary error:", error);
    return NextResponse.json({ error: "集計に失敗しました" }, { status: 500 });
  }
}
