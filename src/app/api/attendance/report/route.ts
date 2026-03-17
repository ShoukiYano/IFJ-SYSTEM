import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenantContext";

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

    const body = await req.json();
    const { attendanceRecordId, content, discrepancyReason } = body;

    if (!attendanceRecordId || !content) {
      return NextResponse.json({ error: "報告内容を入力してください" }, { status: 400 });
    }

    // 2. 打刻レコードの存在と権限を確認
    const record = await (prisma as any).attendanceRecord.findUnique({
      where: { id: attendanceRecordId },
      include: { workReport: true }
    });

    if (!record || record.staffId !== staff.id) {
      return NextResponse.json({ error: "無効な打刻レコードです" }, { status: 403 });
    }

    // 3. 報告の作成または更新
    const report = await (prisma as any).workReport.upsert({
      where: { attendanceRecordId },
      create: {
        attendanceRecordId,
        content,
        discrepancyReason
      },
      update: {
        content,
        discrepancyReason
      }
    });

    // 4. 打刻レコードのステータスを「SUBMITTED」に更新
    await (prisma as any).attendanceRecord.update({
      where: { id: attendanceRecordId },
      data: { status: "SUBMITTED" }
    });

    return NextResponse.json({ message: "業務報告を提出しました", report });

  } catch (error) {
    console.error("POST /api/attendance/report error:", error);
    return NextResponse.json({ error: "提出に失敗しました" }, { status: 500 });
  }
}
