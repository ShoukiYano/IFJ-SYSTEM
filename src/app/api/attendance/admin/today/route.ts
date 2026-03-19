export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfDay, endOfDay, isAfter, addMinutes } from "date-fns";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context || context.role === "TENANT_USER") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { tenantId } = context;
    const now = new Date();
    const today = startOfDay(now);

    // 1. 全スタッフ取得
    const staffs = await (prisma as any).staff.findMany({
      where: { tenantId, deletedAt: null },
      include: { client: true }
    });

    // 2. 本日のシフト取得
    const shifts = await (prisma as any).shift.findMany({
      where: {
        tenantId,
        date: today,
        type: "WORKING"
      }
    });

    // 3. 本日の打刻レコード取得
    const records = await (prisma as any).attendanceRecord.findMany({
      where: {
        tenantId,
        date: today
      }
    });

    // 4. マッピング
    const statusBoard = staffs.map((staff: any) => {
      const shift = shifts.find((s: any) => s.staffId === staff.id);
      const record = records.find((r: any) => r.staffId === staff.id);

      let status = "FREE"; // 予定なし
      if (shift) {
        if (record?.clockOut) {
          status = "FINISHED"; // 勤務終了
        } else if (record?.clockIn) {
          status = "WORKING"; // 勤務中
        } else {
          // 予定はあるが打刻なし
          // 15分以上過ぎていたら LATE, それ以外は WAITING
          const limit = addMinutes(new Date(shift.startTime), 15);
          if (isAfter(now, limit)) {
            status = "LATE";
          } else {
            status = "WAITING";
          }
        }
      } else if (record?.clockIn && !record.clockOut) {
        status = "WORKING"; // 予定外の勤務中
      } else if (record?.clockOut) {
        status = "FINISHED"; // 予定外の勤務終了
      }

      return {
        staffId: staff.id,
        name: staff.name,
        clientName: staff.client?.name,
        shift: shift ? {
          startTime: shift.startTime,
          endTime: shift.endTime
        } : null,
        record: record ? {
          clockIn: record.clockIn,
          clockOut: record.clockOut,
          status: record.status
        } : null,
        status
      };
    });

    return NextResponse.json(statusBoard);

  } catch (error) {
    console.error("GET /api/attendance/admin/today error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
