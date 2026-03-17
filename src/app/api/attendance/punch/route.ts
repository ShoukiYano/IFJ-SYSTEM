import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";
import { startOfDay, differenceInMinutes } from "date-fns";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { userId, tenantId } = context;

    // 1. Staff 特定
    const staff = await (prisma as any).staff.findFirst({
      where: { userId, tenantId, deletedAt: null }
    });

    if (!staff) {
      return NextResponse.json({ error: "従業員情報が見つかりません" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const body = await req.json().catch(() => ({}));
    const { clockIn, clockOut, breakMinutes, location, note, content, discrepancyReason, attendanceRecordId } = body;

    // 3. 現在の打刻状況を確認
    // 日跨ぎ対応：まず ID 指定があればそれ、無ければ未退勤の最新レコードを探す
    let record = null;
    if (attendanceRecordId) {
      record = await (prisma as any).attendanceRecord.findUnique({ where: { id: attendanceRecordId } });
    } else {
      record = await (prisma as any).attendanceRecord.findFirst({
        where: { staffId: staff.id, clockIn: { not: null }, clockOut: null },
        orderBy: { date: "desc" }
      });
    }

    // 未退勤レコードが無ければ本日分を探す
    if (!record) {
      record = await (prisma as any).attendanceRecord.findUnique({
        where: { staffId_date: { staffId: staff.id, date: todayStart } }
      });
    }

    // シフト取得 (差異判定用) - レコードがあればその日付、無ければ今日
    const activeDate = record ? record.date : todayStart;
    const shift = await (prisma as any).shift.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: activeDate
        }
      }
    });

    if (!record || !record.clockIn) {
      // --- 出勤打刻 ---
      let hasDiscrepancy = false;
      const stampTime = clockIn ? new Date(clockIn) : now;

      if (shift) {
        const diff = Math.abs(differenceInMinutes(stampTime, new Date(shift.startTime)));
        if (diff > 15) hasDiscrepancy = true;
      }

      record = await (prisma as any).attendanceRecord.upsert({
        where: { staffId_date: { staffId: staff.id, date: activeDate } },
        update: {
          clockIn: stampTime,
          status: "STAMPED",
          hasDiscrepancy
        },
        create: {
          tenantId,
          staffId: staff.id,
          date: activeDate,
          clockIn: stampTime,
          status: "STAMPED",
          hasDiscrepancy
        }
      });
      return NextResponse.json({ message: "出勤を記録しました", record });

    } else if (record.clockIn && !record.clockOut) {
      // --- 退勤打刻（実績報告を兼ねる） ---
      const stampIn = clockIn ? new Date(clockIn) : record.clockIn;
      const stampOut = clockOut ? new Date(clockOut) : now;
      
      let hasDiscrepancy = false;
      if (shift) {
        const diffIn = Math.abs(differenceInMinutes(stampIn, new Date(shift.startTime)));
        const diffOut = Math.abs(differenceInMinutes(stampOut, new Date(shift.endTime)));
        if (diffIn > 15 || diffOut > 15) hasDiscrepancy = true;
      }

      record = await (prisma as any).attendanceRecord.update({
        where: { id: record.id },
        data: {
          clockIn: stampIn,
          clockOut: stampOut,
          breakMinutes: breakMinutes !== undefined ? parseInt(breakMinutes) : record.breakMinutes,
          location: location || record.location,
          note: note || record.note,
          status: content ? "SUBMITTED" : "STAMPED",
          hasDiscrepancy
        }
      });

      if (content) {
        await (prisma as any).workReport.upsert({
          where: { attendanceRecordId: record.id },
          create: {
            attendanceRecordId: record.id,
            content,
            discrepancyReason
          },
          update: {
            content,
            discrepancyReason
          }
        });
      }

      return NextResponse.json({ message: "退勤と実績を記録しました", record });

    } else {
      return NextResponse.json({ error: "有効な打刻対象が見つからないか、既に完了しています" }, { status: 400 });
    }

  } catch (error) {
    console.error("POST /api/attendance/punch error:", error);
    return NextResponse.json({ error: "打刻に失敗しました" }, { status: 500 });
  }
}
