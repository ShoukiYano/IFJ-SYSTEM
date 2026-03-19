export const dynamic = "force-dynamic";

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

    // 3. 期間内のシフト（予定）を取得
    const shifts = await (prisma as any).shift.findMany({
      where: {
        tenantId,
        date: { gte: rangeStart, lte: rangeEnd },
        type: "WORKING"
      }
    });

    // 4. 集計
    const summary = staffs.map((staff: any) => {
      const staffRecords = records.filter((r: any) => r.staffId === staff.id);
      const staffShifts = shifts.filter((s: any) => s.staffId === staff.id);
      
      let totalMinutes = 0;
      let daysWorked = 0;

      staffRecords.forEach((r: any) => {
        if (r.clockIn && r.clockOut) {
          // 実績ベース：勤務時間から休憩時間（recordがあればその値、無ければデフォルト60分）を引く
          const breakMin = r.breakMinutes || 60;
          const diff = differenceInMinutes(new Date(r.clockOut), new Date(r.clockIn)) - breakMin;
          totalMinutes += Math.max(0, diff);
          daysWorked++;
        }
      });

      const totalHours = Number((totalMinutes / 60).toFixed(2));
      const minHours = staff.minHours || 140;
      const maxHours = staff.maxHours || 180;

      let hourStatus = "NORMAL";
      if (totalHours < minHours) hourStatus = "SHORTAGE";
      if (totalHours > maxHours) hourStatus = "OVERTIME";

      // 承認ステータスの判定
      // 全て承認済みなら APPROVED, それ以外で提出済みがあれば SUBMITTED, まだなら PENDING
      let approvalStatus = "PENDING";
      if (staffRecords.length > 0) {
        if (staffRecords.every((r: any) => r.status === "APPROVED")) {
          approvalStatus = "APPROVED";
        } else if (staffRecords.some((r: any) => r.status === "SUBMITTED")) {
          approvalStatus = "SUBMITTED";
        } else if (staffRecords.some((r: any) => r.status === "REMANDED")) {
          approvalStatus = "REMANDED";
        }
      }

      return {
        staffId: staff.id,
        name: staff.name,
        clientName: staff.client?.name,
        totalHours,
        daysWorked,
        daysShifted: staffShifts.length,
        minHours,
        maxHours,
        hourStatus,
        approvalStatus,
        unitPrice: Number(staff.unitPrice)
      };
    });

    return NextResponse.json(summary);

  } catch (error) {
    console.error("GET /api/attendance/monthly-summary error:", error);
    return NextResponse.json({ error: "集計に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context || context.role === "TENANT_USER") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { tenantId, userId } = context;
    const body = await req.json();
    const { staffId, month, action } = body; // month: "2024-03", action: "APPROVE" | "REMAND"

    if (!staffId || !month || !action) {
      return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
    }

    const targetDate = new Date(month + "-01");
    const rangeStart = startOfMonth(targetDate);
    const rangeEnd = endOfMonth(targetDate);

    const newStatus = action === "APPROVE" ? "APPROVED" : "REMANDED";

    // 月間の打刻レコードを一括更新
    const result = await (prisma as any).attendanceRecord.updateMany({
      where: {
        tenantId,
        staffId,
        date: { gte: rangeStart, lte: rangeEnd },
        // 既に打刻があるもの、または報告済みのものを対象とする
        status: { in: ["STAMPED", "SUBMITTED", "APPROVED", "REMANDED"] }
      },
      data: {
        status: newStatus,
        updatedBy: userId
      }
    });

    return NextResponse.json({ 
      message: `${action === "APPROVE" ? "承認" : "差戻し"}処理が完了しました`,
      count: result.count 
    });

  } catch (error) {
    console.error("POST /api/attendance/monthly-summary error:", error);
    return NextResponse.json({ error: "処理に失敗しました" }, { status: 500 });
  }
}
