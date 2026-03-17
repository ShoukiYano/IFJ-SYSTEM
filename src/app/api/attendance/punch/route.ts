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

    // 2. 前日の報告状況チェック (バリデーション)
    const lastWorkingRecord = await (prisma as any).attendanceRecord.findFirst({
      where: {
        staffId: staff.id,
        date: { lt: todayStart },
        clockIn: { not: null }
      },
      orderBy: { date: "desc" }
    });

    if (lastWorkingRecord && (lastWorkingRecord.status === "STAMPED" || lastWorkingRecord.status === "REMANDED")) {
      return NextResponse.json({ 
        error: "前日の業務報告が未提出です。報告を完了させてから打刻してください。",
        lastWorkingDate: lastWorkingRecord.date
      }, { status: 403 });
    }

    // 3. 現在の打刻状況を確認
    let record = await (prisma as any).attendanceRecord.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: todayStart
        }
      }
    });

    // シフト取得 (差異判定用)
    const shift = await (prisma as any).shift.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: todayStart
        }
      }
    });

    if (!record) {
      // --- 出勤打刻 ---
      let hasDiscrepancy = false;
      if (shift) {
        const diff = Math.abs(differenceInMinutes(now, new Date(shift.startTime)));
        if (diff > 15) hasDiscrepancy = true;
      }

      record = await (prisma as any).attendanceRecord.create({
        data: {
          tenantId,
          staffId: staff.id,
          date: todayStart,
          clockIn: now,
          status: "STAMPED",
          hasDiscrepancy
        }
      });
      return NextResponse.json({ message: "出勤を記録しました", record });

    } else if (record.clockIn && !record.clockOut) {
      // --- 退勤打刻 ---
      let hasDiscrepancy = record.hasDiscrepancy; // 出勤時の状態を引き継ぐ
      if (shift) {
        const diff = Math.abs(differenceInMinutes(now, new Date(shift.endTime)));
        if (diff > 15) hasDiscrepancy = true;
      }

      record = await (prisma as any).attendanceRecord.update({
        where: { id: record.id },
        data: {
          clockOut: now,
          status: "STAMPED",
          hasDiscrepancy
        }
      });
      return NextResponse.json({ message: "退勤を記録しました", record });

    } else {
      return NextResponse.json({ error: "本日の打刻は既に完了しています" }, { status: 400 });
    }

  } catch (error) {
    console.error("POST /api/attendance/punch error:", error);
    return NextResponse.json({ error: "打刻に失敗しました" }, { status: 500 });
  }
}
